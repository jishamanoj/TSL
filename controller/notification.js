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


async function sendNotificationToUsers(userIds, title, message) {
  try {
    
    const notifications = await Notification.findAll({ where: { UId: userIds } });
    
    
    if (!notifications.length) {
      console.error('Notifications not found for any user');
      return;
    }

    
    const notificationMessages = notifications.map(notification => ({
      notification: { title, body: message },
      token: notification.token
    }));

    
    const responses = await Promise.all(
      notificationMessages.map(notificationMessage => admin.messaging().send(notificationMessage))
    );

    
    responses.forEach((response, index) => {
      console.log(`Notification sent successfully to user ${userIds[index]}:`, response);
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

router.post('/send-broadcast-notification', async (req, res) => {
  try {

    const users = await Notification.findAll();
    const userIds = users.map(user => user.UId);
    
    const {title, message } = req.body;

    
    if (!userIds || !title || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await sendNotificationToUsers(userIds, title, message);

    res.json({ message: 'Broadcast notification sent successfully' });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'An error occurred while sending broadcast notification' });
  }
});

module.exports = router;