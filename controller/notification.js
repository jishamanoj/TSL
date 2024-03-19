const express = require('express');
const app = express();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const cron = require('node-cron');
const Appointment = require('../model/appointment');
//const account = require('./serviceAccountKey.json');
const { Op } = require('sequelize');
const moment = require('moment');
const admin =require('firebase-admin');
const Notification = require('../model/notification');


router.post("/order",async(req, res) => {
  console.log("enter ");
  const razorpay = new Razorpay({
      key_id:"rzp_test_iupJrCXb3OkViV",

      key_secret:"ENTq0OZLrGiOApdzk70wzd1Y"

  });
  const options = req.body;
  const order = await razorpay.orders.create(options);
  if(!order){
      return res.status(500).send("error");
  }
  res.json(order);

});

router.post("/order/validate", async (req, res) => {
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const sha = crypto.createHmac("sha256","ENTq0OZLrGiOApdzk70wzd1Y");
  //order_id + "|" + razorpay_payment_id
  sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const digest = sha.digest("hex");
  if (digest !== razorpay_signature) {
    return res.status(400).json({ msg: "Transaction is not legit!" });
  }

  res.json({
    msg: "success",
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
  });
});

async function sendNotificationToUser(UId, title, message) {
  try {
    const notification = await Notification.findOne({ where: { UId: UId } });
    if (!notification) {
      console.error('Notification not found');
      return;
    }

    const notificationMessage = {
      notification: { title, body: message },
      token: notification.token
    };

    const response = await admin.messaging().send(notificationMessage);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

const notificationCronJob = cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = moment();

    const appointments = await Appointment.findAll({
      where: {
        appointmentDate: {
          [Op.lte]: moment(currentDate).add(3, 'days').format('DD/MM/YYYY')
        }
      }
    });

    appointments.forEach(async (appointment) => {
      const UId = appointment.UId;
      const title = 'Reminder:Upcoming Appointment';
      const message = `You have an appointment scheduled for ${appointment.appointmentDate}. Please be on time.`;
      await sendNotificationToUser(UId, title, message);
    });
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

notificationCronJob.start();

module.exports = router;