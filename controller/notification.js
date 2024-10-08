const express = require('express');
const app = express();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const router = express.Router();
const cron = require('node-cron');
const Appointment = require('../model/appointment');
//const account = require('./serviceAccountKey.json');
const { Op, where } = require('sequelize');
const moment = require('moment');
const admin =require('firebase-admin');
const Notification = require('../model/notification');
const broadcast = require('../model/broadcast');
const {Users} = require('../model/validUsers');
const meditationFees = require('../model/meditationFees');
const dekshina = require('../model/dekshina');
const donation = require('../model/donation');
const maintenance = require('../model/maintenance');
const { Sequelize} = require('sequelize')

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const instance1 = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY1,
  key_secret: process.env.RAZORPAY_API_SECRET1,
});
 
///////mediation fees/////
 
router.post('/meditation-checkout', async (req, res) => {
  const totalAmount = Number(req.body.amount);

  const account1Amount = totalAmount * 0.50; 
  const account2Amount = totalAmount * 0.25; 
  const account3Amount = totalAmount * 0.25;

  const options = {
    amount: totalAmount,
    currency: "INR",
    transfers: [
      {
        account: "acc_Oz1KV0Ypue1q9X", 
        amount: account1Amount, 
        currency: "INR",
        on_hold: 0,
      },
      {
        account: "acc_OyvngROSXRXKrz", 
        amount: account2Amount, 
        currency: "INR",
        on_hold: 0,
      },
      {
        account: "acc_Oyw6zHLwGxOAKk", 
        amount: account3Amount, 
        currency: "INR",
        on_hold: 0,
      },
    ],
  };

  try {
    const order = await instance.orders.create(options);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
 
router.post('/meditation-paymentVerification', async (req, res) => {
  try{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,UId,amount,payment_date,payment_time,fee_payment_status} =
    req.body;
 
  const body = razorpay_order_id + "|" + razorpay_payment_id;
 
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");
 
  const isAuthentic = expectedSignature === razorpay_signature;
 
  if (isAuthentic) {
    try {
      // Database operation
      await meditationFees.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        UId,
        amount,
        payment_date,
        payment_time,
        fee_payment_status:true
      });
      await sendNotificationToUser(UId, 'Payment Successful', 'Your support is invaluable, and we are excited to accompany you on this transformative journey.If you have any questions or need further assistance, please feel free to contact us..');
      return res.status(200).json({success:true})
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "Invalid signature"
    });
  }
} catch (error) {
  return res.status(500).json({
    success: false,
    error: error.message
  });
}
});
 
/////maintenance fees//////
 
router.post('/maintenance-checkout',async (req, res) => {
  try {
  const options = {
    amount: Number(req.body.amount),
    currency: "INR",
  };
  
    const order = await instance.orders.create(options);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
 
router.post('/maintenance-paymentVerification', async (req, res) => {
  try{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,UId,amount,payment_date,payment_time,maintenance_payment_status} =
    req.body;
 
  const body = razorpay_order_id + "|" + razorpay_payment_id;
 
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");
 
  const isAuthentic = expectedSignature === razorpay_signature;
 
  if (isAuthentic) {
    try {
      // Database operation
      await maintenance.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        UId,
        amount,
        payment_date,
        payment_time,
        maintenance_payment_status:true
      });
      await sendNotificationToUser(UId, 'Payment Successful', 'thank you for your valuable contribution. it helps us maintain the highest standards and continue providing exceptional service.This is a gentle reminder about the upcoming  zoom maintenance fee ..');
      return res.status(200).json({success:true})
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "Invalid signature"
    });
  }
}
catch (error) {
  return res.status(500).json('internal server error ');
}
});
 
/////dekshina//////
 
router.post('/dekshina-checkout',async (req, res) => {
  const options = {
    amount: Number(req.body.amount),
    currency: "INR",
  };
  try {
    const order = await instance1.orders.create(options);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
 
 
router.post('/dekshina-paymentVerification', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,UId,amount,payment_date,payment_time,dekshina_payment_status} =
    req.body;
 
  const body = razorpay_order_id + "|" + razorpay_payment_id;
 
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET1)
    .update(body.toString())
    .digest("hex");
 
  const isAuthentic = expectedSignature === razorpay_signature;
 
  if (isAuthentic) {
    try {
      // Database operation
      await dekshina.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        UId,
        amount,
        payment_date,
        payment_time,
        dekshina_payment_status:true
      });
      
      return res.status(200).json({success:true})
      await sendNotificationToUser(UId, 'Payment Successful', "This is a gentle reminder to pay your Guru Dakshina. Your contribution honors our Guru's guidance and supports our community.");

    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "Invalid signature"
    });
  }
});
 
 
////////donation///////
 
router.post('/donation-checkout',async (req, res) => {
  try {
  const options = {
    amount: Number(req.body.amount),
    currency: "INR",
  };
 
    const order = await instance.orders.create(options);
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
 
router.post('/donation-paymentVerification', async (req, res) => {
  try{
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature,UId,amount,payment_date,payment_time,donation_payment_status} =
    req.body;
 
  const body = razorpay_order_id + "|" + razorpay_payment_id;
 
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
    .update(body.toString())
    .digest("hex");
 
  const isAuthentic = expectedSignature === razorpay_signature;
 
  if (isAuthentic) {
    try {
      // Database operation
      await donation.create({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        UId,
        amount,
        payment_date,
        payment_time,
        donation_payment_status:true
      });
      await sendNotificationToUser(UId, 'Payment Successful', 'We are deeply grateful for your generous contribution to Thasmai Star Life.Your kindness and support play a crucial role in empowering our mission and making a positive impact..');

      return res.status(200).json({success:true})
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      error: "Invalid signature"
    });
  }}
  catch (error) {
    return res.status(500).json('internal server error')
  }
});
 
router.post('/save-token', async (req, res) => {
  try {
   const { UId } = req.body;
    const { token } = req.body;
    if (!UId || !token) {
      return res.status(400).json({ error: 'UId and token are required' });
    }
    const existingRecord = await Notification.findOne({ where: { UId } });

    if (existingRecord) {
      existingRecord.token = token;
      await existingRecord.save();
    } else {
      await Notification.create({ UId, token });
    }

    return res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

 
async function sendNotificationToUser(UId, title, message) {
  try {
    const notification = await Notification.findOne({ where: { UId: UId } });
    if (!notification) {
      console.log('Notification not found');
      return;
    }
 
    const notificationMessage = {
      notification: { title, body: message },
      token: notification.token
    };
 
    const response = await admin.messaging().send(notificationMessage);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.log('Error sending notification:', error);
  }
}
 
// const notificationCronJob = cron.schedule('0 0 * * *', async () => {
//   try {
//     const currentDate = moment().format('YYYY-MM-DD');

//     const appointments = await Appointment.findAll({
//       where: {
//         appointmentDate: {
//           [Op.between]: [
//             currentDate,
//             moment(currentDate).add(3, 'days').format('YYYY-MM-DD')
//           ]
//         }
//       }
//     });

//     appointments.forEach(async (appointment) => {
//       const UId = appointment.UId;
//       const title = 'Reminder: Upcoming Appointment';
//       const message = `You have an appointment scheduled for ${appointment.appointmentDate}. Please be on time.`;
//       await sendNotificationToUser(UId, title, message);
//     });
//   } catch (error) {
//     console.log('Error in cron job:', error);
//   }
// });

// notificationCronJob.start();
 

router.get('/list-users', async(req,res)=>{
 
  try{
    const users = await Users.findAll({attributes:['UId','firstName','secondName']});
 
    return res.status(200).json(users);
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message:'internal server error'})
  }
 
});
 
async function sendNotificationToUsers(userIds, title, message) {
  try {
 
    const notifications = await Notification.findAll({ where: { UId: userIds } });
 
 
    if (!notifications.length) {
      console.log('Notifications not found for any user');
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
    console.log('Error sending notifications:', error);
  }
}
 
router.post('/send-notification', async (req, res) => {
  try {
    const { userIds, title, message, Date } = req.body;
 
    if (!userIds || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
 
    await sendNotificationToUsers(userIds, title, message);
 
    return res.json({ message: 'Specific notification sent successfully'});
  } catch (error) {
    console.log('Error sending specific notification:', error);
    return res.status(500).json({ error: 'An error occurred while sending specific notification' });
  }
});
 
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
 
    return res.json({ message: 'Broadcast notification sent successfully',notification });
  } catch (error) {
    console.log('Error sending broadcast notification:', error);
    return res.status(500).json({ error: 'An error occurred while sending broadcast notification' });
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
      order: [['id', 'DESC']],
      offset: offset,
      limit: pageSize
    });
 
    return res.status(200).json({ notifications: notification,totalpages: totalpages });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 

// async function updateMaintenanceStatus() {
//   try {
//       const currentDate = new Date();
//       const uniqueUIds = await maintenance.findAll({
//           attributes: [
//               [Sequelize.fn('DISTINCT', Sequelize.col('UId')), 'UId'],
//           ],
//       });

//       for (let record of uniqueUIds) {
//           const { UId } = record.dataValues;
      
//           const latestPayment = await maintenance.findOne({
//               where: { UId },
//               order: [['id', 'DESC']],
//           });

//           if (latestPayment) {
//               const paymentDate = new Date(latestPayment.payment_date);
//               const daysSincePayment = (currentDate - paymentDate) / (1000 * 60 * 60 * 24);

//               if (daysSincePayment > 30 && latestPayment.maintenance_payment_status === true) {
//                   await latestPayment.update({ maintenance_payment_status: false });
//                   console.log(`Updated maintenance_payment_status for UId: ${UId}`);
//               }
//           }
//       }
//   } catch (error) {
//       console.log('Error updating maintenance payment status:', error);
//   }
// }


// cron.schedule('0 0 * * *', updateMaintenanceStatus);
 
module.exports = router;
