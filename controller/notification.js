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
const payment = require('../model/payment');

router.post('/checkout',async (req, res) => {
  const options = {
    amount: Number(req.body.amount),
    currency: "INR",
  };
  try {
    const order = await instance.orders.create(options);
    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
router.post('/paymentVerification', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_APT_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    try {
      // Database operation
      await payment.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });
      res.status(200).json({success:true})
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    res.status(400).json({
      success: false,
      error: "Invalid signature"
    });
  }
})


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
    
    const {title, message,Date } = req.body;

    
    if (!userIds ||  !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    await sendNotificationToUsers(userIds, title, message);
    const notification = await broadcast.create({
      Date,
      message,
      title
    })

    res.json({ message: 'Broadcast notification sent successfully',notification });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({ error: 'An error occurred while sending broadcast notification' });
  }
});
router.post('/get-notification', async (req, res) => {
  try {
    
    const page = parseInt(req.body.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const count = await broadcast.count();

    const totalpages = Math.ceil(count/pageSize)

    const notification = await broadcast.findAll({
      offset: offset,
      limit: pageSize
    });

    return res.status(200).json({ notifications: notification,totalpages: totalpages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
router.get('/get-notificationbyid/:id', async (req, res) => {
  try {
    const { id } = req.params;

    
    const notification = await broadcast.findOne({ where: { id } });

    if (!notification) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({notification:notification });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;