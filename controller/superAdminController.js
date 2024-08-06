const express = require('express');
const { sequelize, reg } = require('../model/registration');
const router = express.Router();
const {Users} = require('../model/validUsers');
const { Op } = require("sequelize");
const Distribution = require('../model/distribution');
const financialconfig = require('../model/financialConfig');
const BankDetails = require('../model/bankdetails');
const mahadhanam =require('../model/mahadhanam');
const events = require('../model/events')
const coupondistribution = require('../model/coupondistribution');
const message =require('../model/gurujiMessage')
//const multer= require('multer');
const meditation =require('../model/meditation');
const Notification = require('../model/notification');
const { validationResult } = require('express-validator');
const admin =require('firebase-admin');
const serviceAccount = require("../serviceAccountKey.json");
const Appointment =require('../model/appointment');
const supportcontact =require('../model/supportContactConfig');
const Admin = require('../model/adminlogin');
const bcrypt = require('bcrypt');
const applicationconfig =require('../model/applicationConfig');
const GroupMembers = require('../model/groupmembers')
const ApplicationConfig = require('../model/applicationConfig');
const globalMessage = require('../model/globalMessage');
//const redeem = require('../model/redeem');
const privateMsg = require('../model/privatemsg');
const multer =require('multer');
const timeTracking = require('../model/timeTracking');
const gurujiMessage = require('../model/gurujiMessage');
const ashramexpense = require('../model/expense');
const blogs = require('../model/blogs');
const Video = require('../model/videos');
const donation = require('../model/donation');
const meditationTime = require('../model/medtitationTime')
const meditationFees = require('../model/meditationFees')
const maintenance = require('../model/maintenance')
const zoomRecord = require('../model/zoomRecorder')
const zoom = require('../model/zoom');
const questions = require('../model/question');
const dekshina = require('../model/dekshina');
const feedback =require('../model/feedback');
const operatorFund = require('../model/operatorFund');
const mahadhanamDistribution = require('../model/mahadhanamDistribution');
const mahadhanamCouponDistribution =require('../model/mahadhanamCouponDistribution');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://thasmai-star-life.appspot.com"
});
const upload = multer({ dest: 'uploads/' });
const storage = admin.storage().bucket();


router.post('/login', async (req, res) => {
  console.log("..................enter...........")
  try {
    console.log("login");
    const { userName, password } = req.body;
    console.log(userName, password);

    const user = await Admin.findOne({
      where: {
        userName,
        // role,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // if (user.role !== role) {
    //   return res.status(403).json({ message: 'Invalid role for the user' });
    // }

    return res.status(200).json({ message: 'Login successful',user});

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/register-count', async (req, res) => {
  try {
      const { month, year } = req.query;

      // Validate client input
      if (!month && !year) {
          return res.status(400).json({ message: 'Please provide month or year parameter' });
      }

      let groupBy;
      let attributes;
      let additionalConditions = {};
      let fullList = [];

      if (month) {
          // Ensure year is provided if month is specified
          if (!year) {
              return res.status(400).json({ message: 'Please provide year parameter along with month' });
          }

          // Get the number of days in the given month
          const daysInMonth = new Date(year, month, 0).getDate();
          fullList = Array.from({ length: daysInMonth }, (v, k) => ({ day: k + 1, count: 0 }));

          // If month is provided, get the count for each day in that month
          groupBy = [sequelize.fn('DAY', sequelize.col('DOJ'))];
          attributes = [
              [sequelize.fn('DAY', sequelize.col('DOJ')), 'day'],
              [sequelize.fn('COUNT', '*'), 'count'],
          ];
          additionalConditions = {
              DOJ: {
                  [Op.between]: [`${year}-${month}-01`, `${year}-${month}-${daysInMonth}`],
              },
          };
      } else if (year) {
          // Get the full list of months in a year
          fullList = Array.from({ length: 12 }, (v, k) => ({ month: k + 1, count: 0 }));

          // If year is provided, get the count for each month in that specific year
          groupBy = [sequelize.fn('MONTH', sequelize.col('DOJ'))];
          attributes = [
              [sequelize.fn('MONTH', sequelize.col('DOJ')), 'month'],
              [sequelize.fn('COUNT', '*'), 'count'],
          ];
          additionalConditions = {
              DOJ: {
                  [Op.between]: [`${year}-01-01`, `${year}-12-31`],
              },
          };
      }

      const registerCounts = await reg.findAll({
          attributes: attributes,
          where: {
              ...additionalConditions,
          },
          group: groupBy,
          order: groupBy,
      });

      // Merge the database results with the full list to ensure all periods are included
      const result = fullList.map(item => {
          const dbItem = registerCounts.find(dbItem => {
              return month
                  ? dbItem.dataValues.day === item.day
                  : dbItem.dataValues.month === item.month;
          });
          return dbItem ? dbItem.dataValues : item;
      });

      res.json(result);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/incomePiechart' , async(req, res) =>{
  try{
    const DonationAmt = await donation.sum('amount' );
    const maintenanceAmt = await maintenance.sum('amount');
    const meditationAmt = await meditationFees.sum('amount');
    const dekshinaAmt = await dekshina.sum('amount');
    const appointmentAmt = await Appointment.sum('payment');
    const totalAmt = DonationAmt + maintenanceAmt + meditationAmt + dekshinaAmt ;
    const fee = maintenanceAmt + meditationAmt ;
    donationpercentage = DonationAmt/totalAmt * 100 ;
    feePercentage = fee / totalAmt * 100;
    dekshinaPercentage = dekshinaAmt / totalAmt * 100;
    appointmentpercentage = appointmentAmt / totalAmt * 100;
    return res.status(200).json({
      message:'income percentage',
      summary:[
      { field: 'donation',
        value: donationpercentage},
      {field:'fee',
        value: feePercentage},
     { field:'dekshina',
      value: dekshinaPercentage} ,
      { field:'appointment',
        value: appointmentpercentage}
    ]
    });

} catch(error){
  console.log(error);
  return res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/expensePiechart' , async(req, res) =>{
  try{
    const coupon = await Distribution.sum('distributed_coupons' );
    const expense = await ashramexpense.sum('amount');
    const total = coupon + expense;
    const couponPercentage = coupon / total * 100;
    const expensePercentage = expense / total * 100;
    return res.status(200).json({
      message:'expense percentage',
      summary:[
      { field: 'coupon',
        value: couponPercentage},
      {field:'expense',
        value: expensePercentage}
    ]
  });

} catch(error){
  console.log(error);
  return res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/waiting-list', async (req, res) => {
  try {
    const list = await reg.count({
      where: {
        classAttended: 'false'
      }
    });

    res.json({list});
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/beneficiaries', async (req, res) => {
  try {
    const list = await Distribution.count({
      distinct: true,
      col: 'UId'
    });

    res.json({list});
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.get('/this-month', async (req, res) => {
  try {
      
      const currentDate = new Date();
     
      const startDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const userCount = await reg.count({
          where: {
              DOJ: {
                  [Op.between]: [startDateOfMonth.toISOString().slice(0, 10), endDateOfMonth.toISOString().slice(0, 10)]
              }
          }
      });

      res.json({ count: userCount });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditation', async (req, res) => {
  try {
      
      const firstTenUserIds = (await Users.findAll({
          attributes: ['UserId'],
          order: [['UserId', 'ASC']],
          limit: 10,
      })).map(user => user.UserId);

      
      const count = await Users.count({
          where: {
              UserId: {
                  [Op.notIn]: firstTenUserIds,
              },
          },
      });

      return res.json({ count });
  } catch (err) {
      console.log(err);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

////////////////////////////////events///////////////////////////////

router.post('/add-event', upload.single('image'), async (req, res) => {
  const { event_name, event_description, priority, place, date ,event_time } = req.body;
  const eventImageFile = req.file;
  
  try {
    
    if (!event_name || !event_description || !priority || !place || !date) {
      return res.status(400).send({ error: 'Missing required fields' });
    }

    const newEvent = await events.create({
      event_name,
      event_description,
      priority,
      place,
      date,
      event_time
    });

    
    let image = ''; 
    if (eventImageFile) {
      const eventImagePath = `event_image/${newEvent.id}/${eventImageFile.originalname}`;

      
      await storage.upload(eventImageFile.path, {
        destination: eventImagePath,
        metadata: {
          contentType: eventImageFile.mimetype
        }
      });

      image = `gs://${storage.name}/${eventImagePath}`;
    }

    await newEvent.update({ image });

    res.status(201).json({ message: 'Event created successfully', event: newEvent });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Parse page number from query string, default to page 1 if not provided
    const pageSize = parseInt(req.query.pageSize) || 10; // Parse page size from query string, default to 10 if not provided

    // Fetch total count of events
    const totalCount = await events.count();

    // Calculate total number of pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate offset based on the requested page and page size
    const offset = (page - 1) * pageSize;

    // Fetch events with pagination
    const allEvents = await events.findAll({
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset
    });

    // Map events to desired format
    const everyEvents = allEvents.map(event => {
      return {
        id: event.id,
        event_name: event.event_name,
        event_description: event.event_description,
        priority: event.priority,
        place: event.place,
        date: event.date,
        event_time: event.event_time
        // image: event.image.toString('base64'), 
      };
    });

    // Respond with events and total pages
    res.status(200).json({ events: everyEvents, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/events-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.events WHERE ";
    let sql = "SELECT * FROM thasmai.events WHERE ";

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const [queryResults, metadata] = await sequelize.query(sql);

    res.json({ queryResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/get-event/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user details by UId from the reg table
    const user = await events.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let image = null;
    if (user.image) {
      // If profilePicUrl exists, fetch the image URL from Firebase Storage
      const file = storage.file(user.image.split(storage.name + '/')[1]);
      const [exists] = await file.exists();
      if (exists) {
        image = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
      }
    }

    // Send the response with user data including profilePicUrl
    return res.status(200).json({
      user: {
        ...user.toJSON(),
        image
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update-event/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const userData = req.body;
  const eventImageFile = req.file;

  try {
    // Check if the user is authenticated
    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user by UId
    const user = await events.findOne({ where: { id } });

    // Update user details
    if (user) {
      // Update all fields provided in the request, excluding the profilePic field
      delete userData.image; // Remove profilePic from userData
      await user.update(userData);

      // Fetch current profile picture URL
      let currentProfilePicUrl = user.image;

      // Store or update profile picture in Firebase Storage
      let image = currentProfilePicUrl; // Default to current URL
      if (eventImageFile) {
        const profilePicPath = `event_image/${id}/${eventImageFile.originalname}`;
        // Upload new profile picture to Firebase Storage
        await storage.upload(eventImageFile.path, {
          destination: profilePicPath,
          metadata: {
            contentType: eventImageFile.mimetype
          }
        });

        // Get the URL of the uploaded profile picture
        image = `gs://${storage.name}/${profilePicPath}`;

        // Delete the current profile picture from Firebase Storage
        if (currentProfilePicUrl) {
          const currentProfilePicPath = currentProfilePicUrl.split(storage.name + '/')[1];
          await storage.file(currentProfilePicPath).delete();
        }
      }

      // Update user's profilePicUrl in reg table
      await user.update({ image });

      return res.status(200).json({ message: 'event details updated successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-events/:eventId', async (req, res) => {
  try {
      const eventId = req.params.eventId;
      const event = await events.findByPk(eventId);

      if (!event) {
          return res.status(404).json({ error: 'Event not found' });
      }
       if (event.image) {
        const imagePath = event.image.replace(`gs://thasmai-star-life.appspot.com/`, '');
        await storage.file(imagePath).delete();
      }
  
      await event.destroy();

      res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/events-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let sql = "SELECT * FROM thasmai.events WHERE ";
    for (let i = 0; i < queryConditions.length; i++) {
      if(queryConditions[i].operator === "between"){

      sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
        
      }
      else{
      sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
      }
    }

    // Apply pagination
    const offset = (page - 1) * pageSize;
     sql += `LIMIT ${pageSize} OFFSET ${offset}`;

    console.log(sql);

    const Results = await sequelize.query(sql);
      
    const totalCount = Results.length;
    //console.log(Results,Results.length,'..............');
   

 
    const totalPages = Math.ceil(totalCount / pageSize);
    
    // Assuming sequelize returns an array of rows in the first element of the results array
    res.json({ Results ,totalPages});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

//////////////////////////////////meditator//////////////////////////


// router.get('/list-meditators', async (req, res) => {
//   try {
//     //console.log(".................enter...............");
//     // Pagination parameters
//     const page = req.query.page || 1; // Current page, default is 1
//     const limit =  10; // Number of records per page
//     const offset = (page - 1) * limit; // Calculate offset based on page number

//     // Step 1: Fetch the list of users with pagination
//     const usersList = await Users.findAll({
//       attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'user_Status'],
//       limit: limit,
//       offset: 10,
//     });

//     res.json( usersList );
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// });


router.get('/searchfield', async (req, res) => {
  try {
    const field = req.query.field;
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const offset = (page - 1) * limit;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
      
    const lowerCaseValue = value.toLowerCase();

    // Fetch users avoiding the first 10 UserIds
    const { count, rows: userDetails } = await Users.findAndCountAll({
      where: {
        [field]: lowerCaseValue,
        UserId: { [Op.gte]: 11 }, 
      },
      limit,
      offset,
    });

    if (userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Success',
      data: userDetails,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/coupon-systemDistribute', async (req, res) => {
  try {
   // console.log("...................enter....................");
    const { totalCoupons, distributedIds } = req.body;
//console.log("------------------------totalCoupons, distributedIds, description.........",totalCoupons, distributedIds);
    // Validate input
    if (!totalCoupons || !distributedIds || !Array.isArray(distributedIds)) {
      return res.status(400).json({ message: 'Invalid input. Please provide totalCoupons and an array of distributedIds.' });
    }

    // Check if totalCoupons is a positive integer
    if (!Number.isInteger(totalCoupons) || totalCoupons <= 0) {
      return res.status(400).json({ message: 'Invalid input. totalCoupons should be a positive integer.' });
    }

    // Fetch user IDs and corresponding coupon numbers in descending order
    const usersWithCoupons = await Users.findAll({
      attributes: ['UserId', 'coupons'],
      order: [['coupons', 'DESC']], 
      limit: totalCoupons,
      where: {
        UserId: { [Op.gt]: 11 },
        coupons: { [Op.gt]: 0 }, // Start from UserId 11
      }, // Exclude the first 10 records
    });

    if (usersWithCoupons.length < totalCoupons) {
      return res.status(400).json({ message: 'Not enough coupons available to distribute.' });
    }

    // Build the where condition to ensure coupons is greater than or equal to 1
    const whereCondition = {
      UserId: usersWithCoupons
        .filter((user) => user.coupons > 0) // Filter out users with 0 coupons
        .map((user) => user.UserId),
      coupons: { [Op.gte]: 1 }, // Ensure coupons is greater than or equal to 1
    };
    //console.log("whereCondition........................................................................", whereCondition);

    const updatedCoupons = await Users.update(
      { coupons: sequelize.literal('coupons - 1') },
      { where: whereCondition }
    );

    const couponsPerUser = totalCoupons / distributedIds.length;

    // Update Users table with couponsPerUser for each distributed user
    await Promise.all(distributedIds.map(async (UId) => {
      const user = await Users.findOne({where:{UId}});
      if (user) {
        // Update coupons in the Users table by adding couponsPerUser
        await Users.update(
          { coupons: sequelize.literal(`coupons + ${couponsPerUser}`) },
          { where: { UId: UId } }
        );
              }
    }));

    // Send response after all updates are complete
    res.json({ message: 'Coupons distributed successfully', updatedCoupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/redeem', async (req, res) => {
  try {
    console.log("entered");
    const { coupons, UIds, description,title } = req.body;
    console.log( "coupons, UIds, description.................:", coupons, UIds, description);
    // Validate input
    if (!coupons || !UIds || !Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide coupons and a non-empty array of UIds.' });
    }

    // Check if coupons is a positive integer
    if (!Number.isInteger(coupons) || coupons <= 0) {
      return res.status(400).json({ message: 'Invalid input. Coupons should be a positive integer.' });
    }

    // Fetch users with specified UIds and valid coupons
    const usersToUpdate = await Users.findAll({
      where: {
        UId: UIds,
        coupons: { [Op.gte]: coupons },
      },
    });

    // Check if enough coupons are available for all specified users
    if (usersToUpdate.length !== UIds.length) {
      return res.status(400).json({ message: 'Not enough coupons available for all specified users.' });
    }

    // Update coupons for each user
    const updatedUsers =await Promise.all(usersToUpdate.map(async (user) => {
      const updatedCoupons = user.coupons - coupons;
      await Users.update({ coupons: updatedCoupons }, { where: { UId: user.UId } });
      await Distribution.create({
        firstName: user.firstName,
        secondName: user.secondName,
        UId: user.UId,
        distributed_coupons: coupons,
        description: description,
        title: title,
        distribution_time: new Date().toISOString(),
      });

      //////////////////////////////////
      const latestDistributionRecord = await Distribution.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time','title'],
        where: { UId: user.UId },
        order: [['distribution_time', 'DESC']], // Order by distribution_time in descending order to get the latest record
      });

      // Fetch the corresponding bank details for the user
      const bankDetails = await BankDetails.findOne({
        attributes: ['AadarNo', 'IFSCCode', 'branchName', 'accountName', 'accountNo'],
        where: { UId: user.UId },
      });

      return {
        firstName: latestDistributionRecord.firstName,
        secondName: latestDistributionRecord.secondName,
        UId: latestDistributionRecord.UId,
        distributed_coupons: latestDistributionRecord.distributed_coupons,
        description: latestDistributionRecord.description,
        title : latestDistributionRecord.title,
        distribution_time: latestDistributionRecord.distribution_time,
        AadarNo: bankDetails.AadarNo,
        IFSCCode: bankDetails.IFSCCode,
        branchName: bankDetails.branchName,
        accountName: bankDetails.accountName,
        accountNo: bankDetails.accountNo,
      };
    }));

    res.json({ message: 'Coupons reduced successfully for specified users.',distributionDetails: updatedUsers});
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const ExcelJS = require('exceljs');

router.get('/download', async (req, res) => {
  try {
    const UIds = req.query.UIds;
    console.log("UIds: " + UIds)
 
    if (!Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide a non-empty array of UIds.' });
    }

    // Fetch the distribution details for each user
    const userDistributionDetails = await Promise.all(UIds.map(async (UId) => {
      const latestDistributionRecord = await Distribution.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time'],
        where: { UId },
        order: [['distribution_time', 'DESC']],
      });

      if (!latestDistributionRecord) {
        return { message: `Distribution details not found for UId: ${UId}` };
      }

      const bankDetails = await BankDetails.findOne({
        attributes: ['AadarNo', 'IFSCCode', 'branchName', 'accountName', 'accountNo'],
        where: { UId },
      });

      return {
        firstName: latestDistributionRecord.firstName,
        secondName: latestDistributionRecord.secondName,
        UId: latestDistributionRecord.UId,
        distributed_coupons: latestDistributionRecord.distributed_coupons,
        description: latestDistributionRecord.description,
        distribution_time: latestDistributionRecord.distribution_time,
        AadarNo: bankDetails.AadarNo,
        IFSCCode: bankDetails.IFSCCode,
        branchName: bankDetails.branchName,
        accountName: bankDetails.accountName,
        accountNo: bankDetails.accountNo,
      };
    }));

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Distribution Details');

    // Add headers to the worksheet
    worksheet.addRow([
      'First Name',
      'Second Name',
      'UId',
      'Distributed Coupons',
      'Description',
      'Distribution Time',
      'AadarNo',
      'IFSCCode',
      'Branch Name',
      'Account Name',
      'Account No',
    ]);

    // Add data to the worksheet
    userDistributionDetails.forEach(user => {
      worksheet.addRow([
        user.firstName,
        user.secondName,
        user.UId,
        user.distributed_coupons,
        user.description,
        user.distribution_time,
        user.AadarNo,
        user.IFSCCode,
        user.branchName,
        user.accountName,
        user.accountNo,
      ]);
    });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DistributionDetails.xlsx');

    // Stream the workbook to the response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/coupons-cart', async (req, res) => {
  try {
    const { UIds, couponsToDistribute } = req.body;
   // console.log("UIds, couponsToDistribute",UIds, couponsToDistribute);

    const users = await Users.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    const insufficientCouponUsers = users.filter(user => user.coupons < couponsToDistribute);
    if (insufficientCouponUsers.length > 0) {
      return res.status(400).json({ message: 'Not enough coupons to distribute for some users' });
    }

    let totalCouponsDistributed = 0;

    await sequelize.transaction(async (t) => {
      for (const user of users) {
        user.coupons -= couponsToDistribute;
        await user.save();

        const distributionRecord = await coupondistribution.create({
          firstName: user.firstName,
          secondName: user.secondName,
          UId: user.UId,
          coupons_to_distribute: couponsToDistribute,
          distribution_time: new Date().toISOString(),
        }, { transaction: t });
        
      }
    });

    const totalCouponsInDistributionTable = await coupondistribution.sum('coupons_to_distribute');


    return res.status(200).json({ message: 'Coupons added to cart successfully',totalCouponsInDistributionTable: totalCouponsInDistributionTable });
  } catch (error) {
    console.log('Error distributing coupons:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/revoke-coupons', async (req, res) => {
  try {
    const { UIds } = req.body;

    // Retrieve coupon distribution details
    const couponDistributionRecords = await coupondistribution.findAll({ where: { UId: UIds } });

    if (!couponDistributionRecords || couponDistributionRecords.length === 0) {
      return res.status(404).json({ message: 'Coupon distribution records not found' });
    }

    // Update Users table to return coupons
    await sequelize.transaction(async (t) => {
      for (const record of couponDistributionRecords) {
        const user = await Users.findOne({ where: { UId: record.UId } });

        if (user) {
          // Add the distributed coupons back to the user's account
          user.coupons += record.coupons_to_distribute;
          await user.save();

          // Delete the record from Coupondistribution table
          await coupondistribution.destroy({ where: { id: record.id }, transaction: t });
        }
      }
    });

    return res.status(200).json({ message: 'Coupons revoked successfully' });
  } catch (error) {
    console.error('Error revoking coupons:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/distributetousers', async (req, res) => {
  try {
    const { UIds } = req.body;

    const users = await Users.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    const totalCouponsToDistribute = await coupondistribution.sum('coupons_to_distribute');

    if (totalCouponsToDistribute === null || totalCouponsToDistribute === 0) {
      return res.status(400).json({ message: 'No coupons to distribute' });
    }

    const couponsPerUser = totalCouponsToDistribute / UIds.length;

    if (!Number.isInteger(couponsPerUser)) {
      return res.status(400).json({ message: 'Cannot equally distribute coupons among the specified users' });
    }

    await sequelize.transaction(async (t) => {
      for (const user of users) {
        user.coupons += couponsPerUser;
        await user.save();
      }

      await coupondistribution.destroy({ where: {}, transaction: t });
    });

    return res.status(200).json({ message: 'Coupons distributed equally successfully' });
  } catch (error) {
    console.error('Error distributing coupons equally:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/TSL', async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'ban'],
      order: [['UserId', 'ASC']], // Order by UId in ascending order
           where: {
       UId: { [Op.lt]: 11 }, // Start from UId 11
      },
    });

    const totalCoupons = users.reduce((sum, user) => sum + user.coupons, 0);

    res.json({ users, totalCoupons });

   // res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/list-meditators', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit;

    const users = await Users.findAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'ban','UserId','user_Status'],
      order: [['userId', 'DESC']], // Order by UId in ascending order
      where: {
        UserId: { [Op.gte]: 11 }, // Start from UId 11
      },
      limit: limit,
      offset: offset,
    });

    const totalCoupons = users.reduce((sum, user) => sum + user.coupons, 0);

    // Get total count of users for pagination
    const totalUsers = await Users.count({
      where: {
        UserId   : { [Op.gte]: 11 },
      },
    });

    res.json({
      users,
      totalCoupons,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/view-cart', async (req, res) => {
  try {
    // Fetch all distribution records from the coupondistribution table
    const distributionRecords = await coupondistribution.findAll();

    // Calculate total coupons to distribute
    let totalCouponsToDistribute = 0;
    distributionRecords.forEach(record => {
      totalCouponsToDistribute += record.coupons_to_distribute;
    });

    // Send the response with the distribution records and total coupons to distribute
    return res.status(200).json({ distributionRecords, totalCouponsToDistribute });
  } catch (error) {
    console.error('Error fetching distribution records:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/total-coupons', async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['coupons']
    });

    const totalCoupons = users.reduce((acc, user) => {
      return acc + (user.coupons || 0);
    }, 0);

    res.status(200).json({ totalCoupons });
  } catch (error) {
    console.error('Error fetching total coupons:', error);
    res.status(500).json({ message: 'Error fetching total coupons', details: error.message });
  }
});

router.post('/execute-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let baseCondition = "UserId >= 11";
    let countSql = `SELECT COUNT(*) AS total FROM thasmai.users WHERE ${baseCondition} AND `;
    let sql = `SELECT * FROM thasmai.users WHERE ${baseCondition} AND `;

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;

    const [queryResults, metadata] = await sequelize.query(sql);

    res.json({ queryResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

////////////////////////////////////////mahadhanam///////////////////////////////////////




router.post('/copy-users', async (req, res) => {
  try {
    // Fetch all users
    const users = await Users.findAll();
    
    // Map User data to Mahadhanam data
    const mahadhanamData = users.map(user => {
      console.log(user.UserId);  // Logging each user's UserId
      return {
        UserId: user.UserId,
        firstName: user.firstName,
        secondName: user.secondName,
        DOB: user.DOB,
        phone: user.phone,
        email: user.email,
        DOJ: user.DOJ,
        state: user.state,
        district: user.district,
        ReferrerID: user.ReferrerID,
        Level: user.Level,
        node_number: user.node_number,
        reserved_id: user.reserved_id,
        coupons: user.coupons,
        points: user.points,
        distribute: user.distribute,
        distributed_points: user.distributed_points,
        ban: user.ban,
        UId: user.UId,
        user_Status: user.user_Status,
      };
    });

    // Start a transaction
    await sequelize.transaction(async (transaction) => {
      // Truncate Mahadhanam table
      await mahadhanam.destroy({
        where: {},
        truncate: true,
        transaction,
      });

      // Insert data into Mahadhanam
      await mahadhanam.bulkCreate(mahadhanamData, { transaction });
    });

    res.status(200).json({ message: 'Data copied successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error copying data', error });
  }
});



router.get('/mahadhanam-searchfield', async (req, res) => {
  try {
    const field = req.query.field;
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const offset = (page - 1) * limit;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
      
    const lowerCaseValue = value.toLowerCase();

    // Fetch users avoiding the first 10 UserIds
    const { count, rows: userDetails } = await mahadhanam.findAndCountAll({
      where: {
        [field]: lowerCaseValue,
        UserId: { [Op.gte]: 11 }, 
      },
      limit,
      offset,
    });

    if (userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Success',
      data: userDetails,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/mahadhanam-coupon-systemDistribute', async (req, res) => {
  try {
   // console.log("...................enter....................");
    const { totalCoupons, distributedIds } = req.body;
//console.log("------------------------totalCoupons, distributedIds, description.........",totalCoupons, distributedIds);
    // Validate input
    if (!totalCoupons || !distributedIds || !Array.isArray(distributedIds)) {
      return res.status(400).json({ message: 'Invalid input. Please provide totalCoupons and an array of distributedIds.' });
    }

    // Check if totalCoupons is a positive integer
    if (!Number.isInteger(totalCoupons) || totalCoupons <= 0) {
      return res.status(400).json({ message: 'Invalid input. totalCoupons should be a positive integer.' });
    }

    // Fetch user IDs and corresponding coupon numbers in descending order
    const usersWithCoupons = await mahadhanam.findAll({
      attributes: ['UserId', 'coupons'],
      order: [['coupons', 'DESC']], 
      limit: totalCoupons,
      where: {
        UserId: { [Op.gt]: 11 },
        coupons: { [Op.gt]: 0 }, // Start from UserId 11
      }, // Exclude the first 10 records
    });

    if (usersWithCoupons.length < totalCoupons) {
      return res.status(400).json({ message: 'Not enough coupons available to distribute.' });
    }

    // Build the where condition to ensure coupons is greater than or equal to 1
    const whereCondition = {
      UserId: usersWithCoupons
        .filter((user) => user.coupons > 0) // Filter out users with 0 coupons
        .map((user) => user.UserId),
      coupons: { [Op.gte]: 1 }, // Ensure coupons is greater than or equal to 1
    };
    //console.log("whereCondition........................................................................", whereCondition);

    const updatedCoupons = await mahadhanam.update(
      { coupons: sequelize.literal('coupons - 1') },
      { where: whereCondition }
    );

    const couponsPerUser = totalCoupons / distributedIds.length;

    // Update Users table with couponsPerUser for each distributed user
    await Promise.all(distributedIds.map(async (UId) => {
      const user = await mahadhanam.findOne({where:{UId}});
      if (user) {
        // Update coupons in the Users table by adding couponsPerUser
        await mahadhanam.update(
          { coupons: sequelize.literal(`coupons + ${couponsPerUser}`) },
          { where: { UId: UId } }
        );
              }
    }));

    // Send response after all updates are complete
    res.json({ message: 'Coupons distributed successfully', updatedCoupons });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/mahadhanam-redeem', async (req, res) => {
  try {
    console.log("entered");
    const { coupons, UIds, description,title } = req.body;
    console.log( "coupons, UIds, description.................:", coupons, UIds, description);
    // Validate input
    if (!coupons || !UIds || !Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide coupons and a non-empty array of UIds.' });
    }

    // Check if coupons is a positive integer
    if (!Number.isInteger(coupons) || coupons <= 0) {
      return res.status(400).json({ message: 'Invalid input. Coupons should be a positive integer.' });
    }

    // Fetch users with specified UIds and valid coupons
    const usersToUpdate = await mahadhanam.findAll({
      where: {
        UId: UIds,
        coupons: { [Op.gte]: coupons },
      },
    });

    // Check if enough coupons are available for all specified users
    if (usersToUpdate.length !== UIds.length) {
      return res.status(400).json({ message: 'Not enough coupons available for all specified users.' });
    }

    // Update coupons for each user
    const updatedUsers =await Promise.all(usersToUpdate.map(async (user) => {
      const updatedCoupons = user.coupons - coupons;
      await mahadhanam.update({ coupons: updatedCoupons }, { where: { UId: user.UId } });
      await mahadhanamDistribution.create({
        firstName: user.firstName,
        secondName: user.secondName,
        UId: user.UId,
        distributed_coupons: coupons,
        description: description,
        title: title,
        distribution_time: new Date().toISOString(),
      });

      //////////////////////////////////
      const latestDistributionRecord = await mahadhanamDistribution.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time','title'],
        where: { UId: user.UId },
        order: [['distribution_time', 'DESC']], // Order by distribution_time in descending order to get the latest record
      });

      // Fetch the corresponding bank details for the user
      const bankDetails = await BankDetails.findOne({
        attributes: ['AadarNo', 'IFSCCode', 'branchName', 'accountName', 'accountNo'],
        where: { UId: user.UId },
      });

      return {
        firstName: latestDistributionRecord.firstName,
        secondName: latestDistributionRecord.secondName,
        UId: latestDistributionRecord.UId,
        distributed_coupons: latestDistributionRecord.distributed_coupons,
        description: latestDistributionRecord.description,
        title : latestDistributionRecord.title,
        distribution_time: latestDistributionRecord.distribution_time,
        AadarNo: bankDetails.AadarNo,
        IFSCCode: bankDetails.IFSCCode,
        branchName: bankDetails.branchName,
        accountName: bankDetails.accountName,
        accountNo: bankDetails.accountNo,
      };
    }));

    res.json({ message: 'Coupons reduced successfully for specified users.',distributionDetails: updatedUsers});
    } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//const ExcelJS = require('exceljs');

router.get('/mahadhanam-download', async (req, res) => {
  try {
    const UIds = req.query.UIds;
    console.log("UIds: " + UIds)
 
    if (!Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide a non-empty array of UIds.' });
    }

    // Fetch the distribution details for each user
    const userDistributionDetails = await Promise.all(UIds.map(async (UId) => {
      const latestDistributionRecord = await mahadhanamDistribution.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time'],
        where: { UId },
        order: [['distribution_time', 'DESC']],
      });

      if (!latestDistributionRecord) {
        return { message: `Distribution details not found for UId: ${UId}` };
      }

      const bankDetails = await BankDetails.findOne({
        attributes: ['AadarNo', 'IFSCCode', 'branchName', 'accountName', 'accountNo'],
        where: { UId },
      });

      return {
        firstName: latestDistributionRecord.firstName,
        secondName: latestDistributionRecord.secondName,
        UId: latestDistributionRecord.UId,
        distributed_coupons: latestDistributionRecord.distributed_coupons,
        description: latestDistributionRecord.description,
        distribution_time: latestDistributionRecord.distribution_time,
        AadarNo: bankDetails.AadarNo,
        IFSCCode: bankDetails.IFSCCode,
        branchName: bankDetails.branchName,
        accountName: bankDetails.accountName,
        accountNo: bankDetails.accountNo,
      };
    }));

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Distribution Details');

    // Add headers to the worksheet
    worksheet.addRow([
      'First Name',
      'Second Name',
      'UId',
      'Distributed Coupons',
      'Description',
      'Distribution Time',
      'AadarNo',
      'IFSCCode',
      'Branch Name',
      'Account Name',
      'Account No',
    ]);

    // Add data to the worksheet
    userDistributionDetails.forEach(user => {
      worksheet.addRow([
        user.firstName,
        user.secondName,
        user.UId,
        user.distributed_coupons,
        user.description,
        user.distribution_time,
        user.AadarNo,
        user.IFSCCode,
        user.branchName,
        user.accountName,
        user.accountNo,
      ]);
    });

    // Set response headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=DistributionDetails.xlsx');

    // Stream the workbook to the response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/mahadhanam-coupons-cart', async (req, res) => {
  try {
    const { UIds, couponsToDistribute } = req.body;
   // console.log("UIds, couponsToDistribute",UIds, couponsToDistribute);

    const users = await mahadhanam.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    const insufficientCouponUsers = users.filter(user => user.coupons < couponsToDistribute);
    if (insufficientCouponUsers.length > 0) {
      return res.status(400).json({ message: 'Not enough coupons to distribute for some users' });
    }

    let totalCouponsDistributed = 0;

    await sequelize.transaction(async (t) => {
      for (const user of users) {
        user.coupons -= couponsToDistribute;
        await user.save();

        const distributionRecord = await mahadhanamCouponDistribution.create({
          firstName: user.firstName,
          secondName: user.secondName,
          UId: user.UId,
          coupons_to_distribute: couponsToDistribute,
          distribution_time: new Date().toISOString(),
        }, { transaction: t });
        
      }
    });

    const totalCouponsInDistributionTable = await mahadhanamCouponDistribution.sum('coupons_to_distribute');


    return res.status(200).json({ message: 'Coupons added to cart successfully',totalCouponsInDistributionTable: totalCouponsInDistributionTable });
  } catch (error) {
    console.log('Error distributing coupons:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/mahadhanam-revoke-coupons', async (req, res) => {
  try {
    const { UIds } = req.body;

    // Retrieve coupon distribution details
    const couponDistributionRecords = await mahadhanamCouponDistribution.findAll({ where: { UId: UIds } });

    if (!couponDistributionRecords || couponDistributionRecords.length === 0) {
      return res.status(404).json({ message: 'Coupon distribution records not found' });
    }

    // Update Users table to return coupons
    await sequelize.transaction(async (t) => {
      for (const record of couponDistributionRecords) {
        const user = await mahadhanam.findOne({ where: { UId: record.UId } });

        if (user) {
          // Add the distributed coupons back to the user's account
          user.coupons += record.coupons_to_distribute;
          await user.save();

          // Delete the record from Coupondistribution table
          await mahadhanamCouponDistribution.destroy({ where: { id: record.id }, transaction: t });
        }
      }
    });

    return res.status(200).json({ message: 'Coupons revoked successfully' });
  } catch (error) {
    console.error('Error revoking coupons:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/mahadhanam-distributetousers', async (req, res) => {
  try {
    const { UIds } = req.body;

    const users = await mahadhanam.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    const totalCouponsToDistribute = await mahadhanamCouponDistribution.sum('coupons_to_distribute');

    if (totalCouponsToDistribute === null || totalCouponsToDistribute === 0) {
      return res.status(400).json({ message: 'No coupons to distribute' });
    }

    const couponsPerUser = totalCouponsToDistribute / UIds.length;

    if (!Number.isInteger(couponsPerUser)) {
      return res.status(400).json({ message: 'Cannot equally distribute coupons among the specified users' });
    }

    await sequelize.transaction(async (t) => {
      for (const user of users) {
        user.coupons += couponsPerUser;
        await user.save();
      }

      await mahadhanamCouponDistribution.destroy({ where: {}, transaction: t });
    });

    return res.status(200).json({ message: 'Coupons distributed equally successfully' });
  } catch (error) {
    console.error('Error distributing coupons equally:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/mahadhanam-TSL', async (req, res) => {
  try {
    const users = await mahadhanam.findAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'ban'],
      order: [['UserId', 'ASC']], // Order by UId in ascending order
           where: {
       UId: { [Op.lt]: 11 }, // Start from UId 11
      },
    });

    const totalCoupons = users.reduce((sum, user) => sum + user.coupons, 0);

    res.json({ users, totalCoupons });

   // res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/mahadhanam-list-meditators', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit;

    const users = await mahadhanam.findAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'ban','UserId','user_Status'],
      order: [['userId', 'DESC']], // Order by UId in ascending order
      where: {
        UserId: { [Op.gte]: 11 }, // Start from UId 11
      },
      limit: limit,
      offset: offset,
    });

    const totalCoupons = users.reduce((sum, user) => sum + user.coupons, 0);

    // Get total count of users for pagination
    const totalUsers = await mahadhanam.count({
      where: {
        UserId   : { [Op.gte]: 11 },
      },
    });

    res.json({
      users,
      totalCoupons,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/mahadhanam-view-cart', async (req, res) => {
  try {
    // Fetch all distribution records from the coupondistribution table
    const distributionRecords = await mahadhanamCouponDistribution.findAll();

    // Calculate total coupons to distribute
    let totalCouponsToDistribute = 0;
    distributionRecords.forEach(record => {
      totalCouponsToDistribute += record.coupons_to_distribute;
    });

    // Send the response with the distribution records and total coupons to distribute
    return res.status(200).json({ distributionRecords, totalCouponsToDistribute });
  } catch (error) {
    console.error('Error fetching distribution records:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/mahadhanam-total-coupons', async (req, res) => {
  try {
    const users = await mahadhanam.findAll({
      attributes: ['coupons']
    });

    const totalCoupons = users.reduce((acc, user) => {
      return acc + (user.coupons || 0);
    }, 0);

    res.status(200).json({ totalCoupons });
  } catch (error) {
    console.error('Error fetching total coupons:', error);
    res.status(500).json({ message: 'Error fetching total coupons', details: error.message });
  }
});

router.post('/ban-User', async (req, res) => {
  try {
    const { UId } = req.body;

    // Find user by primary key
    const closeUser = await mahadhanam.findOne({ where: { UId } });

    // Check if user exists
    if (!closeUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    // Update user's 'ban' property and status
    closeUser.ban = true;
    closeUser.user_Status = 'BANNED';

    // Save changes to the database
    await closeUser.save();

    const userWithIdOne = await mahadhanam.findOne({ where: { UserId: 1 } });
    if (userWithIdOne) {
      userWithIdOne.coupons += closeUser.coupons;
      await userWithIdOne.save();
    }

    closeUser.coupons = 0;
    await closeUser.save();


    // const user = await reg.findOne({ where: { UId } });
    // if(user) {
    //   user.user_Status = 'BANNED'
    //   await user.save();
    // }

    return res.json({ status: "success", data: "User updated successfully" });
  } catch (err) {
    // Handle errors
    console.error(err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.post('/mahadhanam-execute-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let baseCondition = "UserId >= 11";
    let countSql = `SELECT COUNT(*) AS total FROM thasmai.mahadhanams WHERE ${baseCondition} AND `;
    let sql = `SELECT * FROM thasmai.mahadhanams WHERE ${baseCondition} AND `;

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;

    const [queryResults, metadata] = await sequelize.query(sql);

    res.json({ queryResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

///////////////////////////////////////////////////////// configarations///////////////////////////////////////


router.get('/financialconfig', async (req,res) => {
  try {
     // console.log("get financialconfig data");
      const finconfig = await financialconfig.findAll();
      
      res.status(200).json({message:'Fetching data successfully',finconfig});
  } catch(error) {
      //console.log(error);
      res.status(500).json({message:'An error occurred while fetching data'});
  }
});

router.put('/update-configuration', async (req, res) => {
  try {
    const id = req.body.id;
    const configData = req.body;

    if (!id) {
      const newData = await financialconfig.create({
        ...configData
      });
      return res.status(200).json({message:'Data created successfully', newData});

    }

    // Try to find the existing record
    const data = await financialconfig.findOne({ where: { id } });

    if (data) {
      // If found, update the existing record
      await data.update(configData);
      return res.status(201).json({ message: 'Data updated successfully' });
    } 
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/appconfig',async(req,res) =>{
  try{
      //console.log("get appconfig data");
      const appconfig = await applicationconfig.findAll({
        where: {
            id: {
                [Op.ne]: 11
            }
        }
    });
      
      res.status(200).json({message:'Fetching data successfully',appconfig});
  } catch(error) {
      //console.log(error);
      res.status(500).json({message:'internal server error'});
  }
});

router.put('/update-appconfig', async (req, res) => {
  try {
    const id = req.body.id;
    const configData = req.body;

    if (!id) {
      const newData = await applicationconfig.create({
        ...configData
      });
      return res.status(200).json({message:'Data created successfully', newData});

    }

    // Try to find the existing record
    const data = await applicationconfig.findOne({ where: { id } });

    if (data) {
      // If found, update the existing record
      await data.update(configData);
      return res.status(201).json({ message: 'Data updated successfully' });
    } 
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/support',async(req,res) =>{
  try{
     // console.log('get support');
      const support = await supportcontact.findAll();
      res.status(200).json({message:'Fetching data successfully',support});

  } catch (error) {
      //console.log(error);
      res.status(500).json({message:'internal server error'});
  }
});

router.put('/update-support/:id', async (req, res) => {
  const id = req.params.id;
  const usersdata = req.body;

  try {
      if (!id) {
          return res.status(400).json({ error: 'Invalid request, missing ID' });
      }

      // Find the support contact by ID
      const data = await supportcontact.findOne({ where: { id } });

      if (data) {
          // Update the support contact data
          await data.update(usersdata);

          return res.status(200).json({ message: 'Data updated successfully' });
      } else {
          return res.status(404).json({ error: 'Support contact not found' });
      }
  } catch (error) {
      //console.error(error); 

      return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.post('/addSupport', async (req, res) => {
  try {
    const data = req.body;
    const support = await supportcontact.create(data);
    return res.status(200).json({ message: 'Success', support });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const configData = req.body;

    if (!id) {
      return res.status(401).json({ message: 'id required' });
    }

    // Try to find the existing record
    const data = await questions.findAll({ where: { id } });

    if (data && data.length > 0) { // Check if a record was found
      // If found, update the existing record
      await data[0].update(configData); // Update the first record found
      return res.status(201).json({ message: 'Data updated successfully' });
    } else {
      return res.status(404).json({ message: 'Data not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

////////////////////////////////// financial pages////////////////////////////////


router.get('/list-users', async (req, res) => {
  const pageSize = parseInt(req.query.pageSize)||10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * pageSize;

  try {
    // Step 1: Fetch the list of users with pagination
    const { rows: usersList, count: totalUsers } = await Users.findAndCountAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'Level', 'node_number'],
      limit: pageSize,
      offset: offset,
    });

    // Extract UIds from the usersList
    const UIds = usersList.map(user => user.UId);

    // Step 2: Fetch the total sum of distributed_coupons for each UId
    const distributionResults = await Distribution.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('distributed_coupons')), 'total_distributed_coupons']],
      group: ['UId'],
    });

    // Step 3: Merge the results and send the response
    const mergedResults = usersList.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_distributed_coupons: distributionResult ? distributionResult.dataValues.total_distributed_coupons : 0,
      };
    });

    res.json({ 
      users: mergedResults,
      totalUsers: totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: page 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/query',async (req, res) => {
  const results = await sequelize.query(`${req.body.query}`);
  if(results){
    return res.json({ response: results });
  }}
)

router.post('/financial-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.Users WHERE ";
    let sql = "SELECT * FROM thasmai.Users WHERE ";

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const userResults = await sequelize.query(sql);

    const UIds = userResults[0].map(user => user.UId);

    const distributionResults = await Distribution.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('distributed_coupons')), 'total_distributed_coupons']],
      group: ['UId'],
    });

    const mergedResults = userResults[0].map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      return {
        ...user,
        total_distributed_coupons: distributionResult ? distributionResult.dataValues.total_distributed_coupons : 0,
      };
    });

    res.json({ results: mergedResults,totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/search', async (req, res) => {
  try {
    const field = req.query.field; 
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }

    // Calculate the offset
    const offset = (page - 1) * limit;

    // Step 1: Fetch user details with pagination
    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
      limit,
      offset,
    });

    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Extract UIds from the search results
    const UIds = userDetails.map(user => user.UId);

    // Step 3: Fetch the total sum of distributed_coupons for each UId
    const distributionResults = await Distribution.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('distributed_coupons')), 'total_distributed_coupons']],
      group: ['UId'],
    });

    // Step 4: Merge the user details with the distribution results
    const mergedResults = userDetails.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_distributed_coupons: distributionResult ? distributionResult.dataValues.total_distributed_coupons : 0,
      };
    });

    // Optional: Fetch the total number of users for pagination meta info
    const totalUsers = await Users.count({
      where: {
        [field]: value,
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({ 
      message: 'Success', 
      data: mergedResults,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/list-donation', async (req, res) => {
  const pageSize =parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * pageSize;
 
  try {
    // Step 1: Fetch the list of users with pagination
    const { rows: usersList, count: totalUsers } = await Users.findAndCountAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'Level', 'node_number'],
      limit: pageSize,
      offset: offset,
    });
 
    // Extract UIds from the usersList
    const UIds = usersList.map(user => user.UId);
 
    // Step 2: Fetch the total sum of distributed_coupons for each UId
    const distributionResults = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_donation']],
      group: ['UId'],
    });
 
    const latestDonations = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });
 
    // Step 3: Merge the results and send the response
    const mergedResults = usersList.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_donation: distributionResult ? distributionResult.dataValues.total_donation : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });
 
    res.json({ 
      users: mergedResults,
      totalUsers: totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: page 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
router.post('/donation-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided
 
    console.log(queryConditions);
 
    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }
 
    function isNumeric(num) {
      return !isNaN(num);
    }
 
    let countSql = "SELECT COUNT(*) AS total FROM thasmai.Users WHERE ";
    let sql = "SELECT * FROM thasmai.Users WHERE ";
 
    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }
 
    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;
 
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
 
    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);
 
    const userResults = await sequelize.query(sql);
 
    const UIds = userResults[0].map(user => user.UId);
 
    const distributionResults = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_donation']],
      group: ['UId'],
    });
 
    const latestDonations = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });
 
    const mergedResults = userResults[0].map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user,
        total_donation: distributionResult ? distributionResult.dataValues.total_donation : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });
 
    res.json({ results: mergedResults,totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
 
router.get('/donation-search', async (req, res) => {
  try {
    const field = req.query.field; 
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }

    const offset = (page - 1) * limit;

    // Step 1: Fetch user details with pagination
    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
      limit,
      offset,
    });

    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Extract UIds from the search results
    const UIds = userDetails.map(user => user.UId);

    // Step 3: Fetch the total sum of distributed_coupons for each UId
    const distributionResults = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_donation']],
      group: ['UId'],
    });

    const latestDonations = await donation.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });

    // Step 4: Merge the user details with the distribution results
    const mergedResults = userDetails.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_donation: distributionResult ? distributionResult.dataValues.total_donation : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });

    // Optional: Fetch the total number of users for pagination meta info
    const totalUsers = await Users.count({
      where: {
        [field]: value,
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({ 
      message: 'Success', 
      data: mergedResults,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/list-fees', async (req, res) => {
  const pageSize =parseInt(req.query.pageSize) || 10;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * pageSize;
 
  try {
    // Step 1: Fetch the list of users with pagination
    const { rows: usersList, count: totalUsers } = await Users.findAndCountAll({
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'Level', 'node_number'],
      limit: pageSize,
      offset: offset,
    });
 
    // Extract UIds from the usersList
    const UIds = usersList.map(user => user.UId);
 
    // Step 2: Fetch the total sum of distributed_coupons for each UId
    const distributionResults = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_fees']],
      group: ['UId'],
    });
 
    const latestDonations = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });
 
    // Step 3: Merge the results and send the response
    const mergedResults = usersList.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_fees: distributionResult ? distributionResult.dataValues.total_fees : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });
 
    res.json({ 
      users: mergedResults,
      totalUsers: totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: page 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
router.post('/fees-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided
 
    console.log(queryConditions);
 
    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }
 
    function isNumeric(num) {
      return !isNaN(num);
    }
 
    let countSql = "SELECT COUNT(*) AS total FROM thasmai.Users WHERE ";
    let sql = "SELECT * FROM thasmai.Users WHERE ";
 
    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }
 
    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;
 
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
 
    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);
 
    const userResults = await sequelize.query(sql);
 
    const UIds = userResults[0].map(user => user.UId);
 
    const distributionResults = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_fees']],
      group: ['UId'],
    });
 
    const latestDonations = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });
 
    const mergedResults = userResults[0].map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user,
        total_fees: distributionResult ? distributionResult.dataValues.total_fees : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });
 
    res.json({ results: mergedResults,totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
 
router.get('/fees-search', async (req, res) => {
  try {
    const field = req.query.field; 
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }

    const offset = (page - 1) * limit;

    // Step 1: Fetch user details with pagination
    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
      limit,
      offset,
    });

    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Extract UIds from the search results
    const UIds = userDetails.map(user => user.UId);

    // Step 3: Fetch the total sum of fees for each UId
    const distributionResults = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', [sequelize.fn('sum', sequelize.col('amount')), 'total_fees']],
      group: ['UId'],
    });

    const latestDonations = await meditationFees.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'amount', 'id'],
      order: [['id', 'DESC']],
      group: ['id']
    });

    // Step 4: Merge the user details with the distribution results
    const mergedResults = userDetails.map(user => {
      const distributionResult = distributionResults.find(result => result.UId === user.UId);
      const latestDonation = latestDonations.find(result => result.UId === user.UId);
      return {
        ...user.dataValues,
        total_fees: distributionResult ? distributionResult.dataValues.total_fees : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });

    // Optional: Fetch the total number of users for pagination meta info
    const totalUsers = await Users.count({
      where: {
        [field]: value,
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({ 
      message: 'Success', 
      data: mergedResults,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/list-operation', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; 
 
    const offset = (page - 1) * pageSize;
    totalUsers = await ashramexpense.count({})
 
    // Fetching all events with pagination
    const allEvents = await ashramexpense.findAll({
      limit: pageSize,
      offset: offset
    });
 
    // Fetching all events without pagination to calculate the sum
    const allEventsForSum = await ashramexpense.findAll();
 
    // Creating a map to store the sum of amounts for each emp_id
    const amountSumMap = allEventsForSum.reduce((acc, event) => {
      if (acc[event.emp_id]) {
        acc[event.emp_id] += event.amount;
      } else {
        acc[event.emp_id] = event.amount;
      }
      return acc;
    }, {});
 
    const everyEvents = await Promise.all(allEvents.map(async event => {
      const admin = await Admin.findOne({ where: { emp_id: event.emp_id } });
      const adminName = admin ? admin.name : null;
 
      return {
        id: event.id,
        expenseType: event.expenseType,
        amount: event.amount,
        description: event.description,
        Expense_Date: event.Expense_Date,
        emp_id: event.emp_id,
        emp_name: adminName,
        totalAmount: amountSumMap[event.emp_id] // Adding the total amount for the same emp_id
      };
    }));
 
    res.status(200).json({ expense: everyEvents ,totalPages: Math.ceil(totalUsers / pageSize)});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/operation-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.ashramexpenses WHERE ";
    let sql = `
      SELECT ae.*, ad.name as emp_name, SUM(ae.amount) OVER (PARTITION BY ae.emp_id) as totalAmount
      FROM sequel.ashramexpenses ae
      LEFT JOIN thasmai.admins ad ON ae.emp_id = ad.emp_id
      WHERE `;

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const [queryResults, metadata] = await sequelize.query(sql);

    res.json({ queryResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/operation-search', async (req, res) => {
  try {
    const field = req.query.field; // Retrieve the field from query parameters
    const value = req.query.value; // Retrieve the value from query parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const offset = (page - 1) * limit;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }

    const lowerCaseValue = value.toLowerCase();

    // Fetch expenses matching the field and value with pagination
    const { count, rows: allEvents } = await ashramexpense.findAndCountAll({
      where: {
        [field]: lowerCaseValue,
      },
      limit,
      offset,
    });

    if (allEvents.length === 0) {
      return res.status(404).json({ message: 'No matching expenses found' });
    }

    // Fetch all events to calculate the total sum of amounts for each emp_id
    const allEventsForSum = await ashramexpense.findAll({
      where: {
        [field]: lowerCaseValue,
      },
    });

    // Create a map to store the sum of amounts for each emp_id
    const amountSumMap = allEventsForSum.reduce((acc, event) => {
      if (acc[event.emp_id]) {
        acc[event.emp_id] += event.amount;
      } else {
        acc[event.emp_id] = event.amount;
      }
      return acc;
    }, {});

    // Fetch the admin name and total amount for each expense
    const everyEvents = await Promise.all(allEvents.map(async event => {
      const admin = await Admin.findOne({ where: { emp_id: event.emp_id } });
      const adminName = admin ? admin.name : null;

      return {
        id: event.id,
        expenseType: event.expenseType,
        amount: event.amount,
        description: event.description,
        Expense_Date: event.Expense_Date,
        emp_id: event.emp_id,
        emp_name: adminName,
        totalAmount: amountSumMap[event.emp_id], // Adding the total amount for the same emp_id
      };
    }));

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Success',
      data: everyEvents,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
 
router.get('/list-ashram-appointments', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; 
 
    // Fetch total count of events
    const totalCount = await Appointment.count();
 
    // Calculate total number of pages
    const totalPages = Math.ceil(totalCount / pageSize);
 
    // Calculate offset based on the requested page and page size
    const offset = (page - 1) * pageSize;
 
    // Fetch events with pagination
    const allEvents = await Appointment.findAll({
      limit: pageSize,
      offset: offset
    });
 
    const everyEvents = await Promise.all(allEvents.map(async event => {
      const admin = await Users.findOne({ where: { UId: event.UId } });
      const adminName = admin ? admin.coupons : null;
 
      return {
        id: event.id,
        UId: event.UId,
        phone: event.phone,
        appointmentDate: event.appointmentDate,
        num_of_people: event.num_of_people,
        user_name:event.user_name,
        payment:event.payment,
        days: event.days,
        discount:event.discount,
        coupons: adminName,
 
      };
    }));
 
    // Respond with events and total pages
    res.status(200).json({ events: everyEvents, totalPages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/ashram-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; 
    const pageSize = req.body.pageSize || 10; 
 
    console.log(queryConditions);
 
    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }
 
    function isNumeric(num) {
      return !isNaN(num);
    }
 
    let countSql = "SELECT COUNT(*) AS total FROM thasmai.appointments WHERE ";
    let sql = "SELECT * FROM thasmai.appointments WHERE ";
 
    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        const [start, end] = queryConditions[i].value.split("/");
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} "${start}" AND "${end}" ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${start}" AND "${end}" ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }
 
    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;
 
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
 
    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);
 
    const queryResults = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
 
    const detailedResults = await Promise.all(queryResults.map(async appointment => {
      const user = await sequelize.query(`SELECT coupons FROM thasmai.Users WHERE UId = ${appointment.UId}`, { type: sequelize.QueryTypes.SELECT });
      const coupons = user[0] ? user[0].coupons : null;
 
      return {
        ...appointment,
        coupons: coupons
      };
    }));
 
    res.json({ queryResults: detailedResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});
 
router.get('/ashram-search', async (req, res) => {
  try {
    const field = req.query.field; // Retrieve the field from query parameters
    const value = req.query.value; // Retrieve the value from query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
      
    const lowerCaseValue = value.toLowerCase();
    const offset = (page - 1) * limit;

    // Step 1: Search the database for appointments matching the field and value with pagination
    const userDetails = await Appointment.findAll({
      where: {
        [field]: lowerCaseValue,
      },
      limit,
      offset,
    });

    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Step 2: Fetch the coupons field from the Users table for each appointment
    const resultsWithCoupons = await Promise.all(userDetails.map(async appointment => {
      const user = await Users.findOne({ where: { UId: appointment.UId } });
      return {
        ...appointment.dataValues,
        coupons: user ? user.coupons : null,
      };
    }));

    // Optional: Fetch the total number of appointments for pagination meta info
    const totalAppointments = await Appointment.count({
      where: {
        [field]: lowerCaseValue,
      },
    });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalAppointments / limit);

    res.json({ 
      message: 'Success', 
      data: resultsWithCoupons,
      pagination: {
        totalAppointments,
        totalPages,
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


////////////////////////////appointments/////////////////////////////////


router.get('/list-all-appointment', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Parse page number from query string, default to page 1 if not provided
    const pageSize = parseInt(req.query.pageSize) || 10; // Parse page size from query string, default to 10 if not provided

    // Fetch total count of appointments
    const totalCount = await Appointment.count();

    // Calculate total number of pages
    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate offset based on the requested page and page size
    const offset = (page - 1) * pageSize;

    // Fetch appointments with pagination
    const appointmentData = await Appointment.findAll({
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset
    });

    if (!appointmentData || appointmentData.length === 0) {
      return res.status(404).json({ message: 'No appointments found' });
    }

    const UIds = appointmentData.map(appointment => appointment.UId);

    const userData = await Users.findAll({
      where: { UId: { [Op.in]: UIds } },
      attributes: ['UId', 'coupons'],
    });

    const userCouponMap = new Map(userData.map(user => [user.UId, user.coupons]));

    const mergedResults = appointmentData.map(appointment => {
      const userCoupons = userCouponMap.get(appointment.UId) || 0;
      return {
        ...appointment.dataValues,
        userCoupons,
      };
    });

    res.json({ appointments: mergedResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/list-appointment-details', async (req, res) => {
  try {
    // Find all appointments
    const appointments = await Appointment.findAll();

    // Fetch group members and coupons for each appointment
    const appointmentsWithGroupMembersAndCoupons = [];
    for (const appointment of appointments) {
      const groupMembers = await GroupMembers.findAll({ where: { appointmentId: appointment.id } });
      const user = await Users.findOne({ where: { UId: appointment.UId }, attributes: ['coupons'] });

      // Create a merged object for each appointment
      const mergedAppointmentData = {
        appointment,
        groupMembers,
        user // Only includes coupon-related data
      };

      appointmentsWithGroupMembersAndCoupons.push(mergedAppointmentData);
    }

    // Respond with the list of merged appointment data
    return res.status(200).json({ message: 'Fetching appointments', appointments: appointmentsWithGroupMembersAndCoupons });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

const cron = require('node-cron');


router.get('/list-appointment/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find appointment by ID
    const appointment = await Appointment.findOne({ where: { id } });

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    let imageUrl = null;
    if (appointment.imageUrl) {
      // If profilePicUrl exists, fetch the image URL from Firebase Storage
      const file = storage.file(appointment.imageUrl.split(storage.name + '/')[1]);
      const [exists] = await file.exists();
      if (exists) {
        imageUrl = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
      }
    }
    // Find group members for the appointment
    const groupMembers = await GroupMembers.findAll({ where: { appointmentId: appointment.id } });

    // Attach group members to the appointment object
    appointment.dataValues.groupMembers = groupMembers;

    // Respond with the appointment
    return res.status(200).json({ message: 'Fetching appointment', appointment:{
      ...appointment.toJSON(),
      imageUrl
    } });
  } catch (error) {
   // console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update-payment/:id', upload.single('appointmentImage'), async (req, res) => {

  console.log('update')
  const id = req.params.id;
  const appointmentData = req.body;
  const appointmentImageFile = req.file;

  try {
      // Check if the user is authenticated
      if (!id) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the appointment by id
      const appointment = await Appointment.findOne({ where: { id } }); // Corrected variable name

      // Update appointment details
      if (appointment) {
          // Update all fields provided in the request, excluding the appointmentImage field
          delete appointmentData.appointmentImage; // Remove appointmentImage from appointmentData
          await appointment.update(appointmentData);

          // Store or update appointment image
          let appointmentImageUrl = appointment.imageUrl; // Default to current URL
          if (appointmentImageFile) {
              const appointmentImagePath = `appointment_images/${id}/${appointmentImageFile.originalname}`;

              // Upload new appointment image to Firebase Storage
              await storage.upload(appointmentImageFile.path, {
                  destination: appointmentImagePath,
                  metadata: {
                      contentType: appointmentImageFile.mimetype
                  }
              });

              // Get the URL of the uploaded appointment image
              appointmentImageUrl = `gs://${storage.name}/${appointmentImagePath}`;
console.log(appointmentImageUrl);
              // Delete the current appointment image from Firebase Storage
              if (appointment.imageUrl) {
                  const currentAppointmentImagePath = appointment.imageUrl.split(storage.name + '/')[1];
                  await storage.file(currentAppointmentImagePath).delete();
              }
          }

          // Update appointment's imageUrl in appointment table
          await appointment.update({ imageUrl: appointmentImageUrl });

          return res.status(200).json({ message: 'Appointment details updated successfully' });
      } else {
          return res.status(404).json({ error: 'Appointment not found' });
      }
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/discount/:UId', async (req, res) => {
  const { UId } = req.params;
  const { coupon, id } = req.body;

  try {
    // Check if UId is a valid integer
    if (isNaN(parseInt(UId))) {
      return res.status(400).json({ error: 'Invalid User ID' });
    }

    // Check if coupon is numeric
    if (isNaN(parseInt(coupon))) {
      return res.status(400).json({ error: 'Coupon amount must be a number' });
    }

    const user = await Users.findOne({ where: { UId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalCoupons = user.coupons;
    if (coupon > totalCoupons) {
      return res.status(400).json({ error: 'Invalid coupon amount' });
    }

    const updatedTotalCoupons = totalCoupons - coupon;
    await Users.update({ coupons: updatedTotalCoupons }, { where: { UId } });

    // Assuming 'appointment' is a model with a proper 'where' condition for the update
    await Appointment.update({ discount: coupon * 2500 }, { where: { id } });

    return res.status(200).json({ message: 'Discount updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update-gurujidate', async (req, res) => {
  try {
    console.log('Updating');
    const id = 11;
    const {  values } = req.body;
    console.log(req.body.values)

    // Find the existing record by ID
    let config = await ApplicationConfig.findByPk(id);

    // If the record doesn't exist, create a new one
    if (!config) {
      config = await ApplicationConfig.create({ id });
    }

    // Convert the array of values to JSON format and update the record
    config.value = JSON.stringify(values);
    await config.save();

    return res.status(200).json({ message: 'Application config updated successfully' });
  } catch (error) {
    console.error('Error updating application config:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/appointment-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.appointments WHERE ";
    let sql = "SELECT * FROM thasmai.appointments WHERE ";

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const results = await sequelize.query(sql);
    console.log(results[0]);
    
    // Assuming sequelize returns an array of rows in the first element of the results array
    res.json({ results: results[0], totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/profiledetails/:UId', async (req, res) => {
  try {
    const { UId } = req.params;
//console.log(UId);
    const user = await reg.findOne({ where: { UId }, attributes: ['UId','first_name' ,'last_name' , 'email' ,'phone' , 'DOB' , 'gender' , 'address', 'district','state','pincode','profilePicUrl'] });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profilePic = [];
    if (user.profilePicUrl) {
        // If profilePicUrl exists, fetch the image URL from Firebase Storage
        const file = storage.file(user.profilePicUrl.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
            profilePic = await file.getSignedUrl({
                action: 'read',
                expires: '03-01-2500' // Adjust expiration date as needed
            });
            // Convert profilePicUrl from an array to a string
            profilePic = profilePic[0];
        }
    }
    
    let bankDetails = [];
    const foundBankDetails = await BankDetails.findOne({ where: { UId } });
    if (foundBankDetails) {
      bankDetails = foundBankDetails;
    }
    const cycle = await meditation.findOne({ where: { UId }, attributes: ['cycle', 'day', 'session_num'] });
    let meditationData = {};
    if (cycle) {
      meditationData = { ...cycle.dataValues };
    } else {
      meditationData = [];
    }
    const meditationlog= await timeTracking.findAll({
      where: { UId },
      order: [['createdAt', 'DESC']], 
      limit: 5, 
    });
    //console.log(meditationlog)
    
    

    const dekshinas = await dekshina.findAll({ where: { UId } });
    const donations = await donation.findAll({ where: { UId } });
    const meditationfees = await meditationFees.findAll({ where: { UId } });
    const maintenancefee = await maintenance.findAll({ where: { UId } });

    // Merge the results
    const transactions = dekshinas.concat(donations, meditationfees, maintenancefee);  

    // Sort by date in descending order 
    transactions.sort((a, b) => new Date(b.payment_date, ) - new Date(a.payment_date));

    const zoomrecord = await zoomRecord.findAll({
      where: { UId },
      order: [['id', 'DESC']],
      limit: 5
    });

    return res.status(200).json({
      user,
      profilePic,
      bankDetails,
      meditationData,
      meditationlog,
      transactions,
      zoomrecord
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/completeAppointment' , async(req,res) =>{
  try{
    const appointment = await Appointment.findAll({where: {appointment_status:'Completed'}});
    return res.status(200).json(appointment);
  } catch(error){
    return res.status(500).json('internal server error');
  }
});

///////////////////////////messages////////////////////////////////


router.post('/admin-messages', async (req, res) => {
  try {
    const { message, messageTime,isAdminMessage} = req.body;
    
    // Create a new message entry
    const newMessage = await gurujiMessage.create({
      
      message,
      messageTime,
      isAdminMessage,
    });

    res.status(201).json({ message: 'Message created successfully', data: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

///////////////get global messages////////////////////////////////

router.post('/adminglobalMessage', async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const limit = 10;

    const totalCount = await globalMessage.count();

    const totalPages = Math.ceil(totalCount / limit);

    const messages = await globalMessage.findAll({
      attributes: ['UId', 'id','message', 'messageTime','messageDate', 'isAdminMessage'],
      include: [], // No need for Sequelize include here
      order: [['id', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    });
   // console.log(".................",messages);

    // Fetch first_name and last_name from reg table for each message UId
    const messageData = await Promise.all(messages.map(async (message) => {
      const userData = await Users.findOne({ where: { UId: message.UId }, attributes: ['firstName', 'secondName'] });
      console.log("................",userData)
      const userName = `${userData.firstName} ${userData.secondName}`;
  
      return { 
        ...message.toJSON(), 
        userName 
      };
    }));

    return res.status(200).json({
      message: 'fetching messages',
      messages: messageData,
      totalPages
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/gurujimessage', async (req, res) => {
  try {
    
    const page = parseInt(req.body.page) || 1;
    const limit = 10;
    
    const offset = (page - 1) * limit;

    const totalCount = await gurujiMessage.count();
    const totalPages = Math.ceil(totalCount / limit);

    const messages = await gurujiMessage.findAll({ 
      order: [['id', 'DESC']],
      limit,
      offset
    });

    return res.status(200).json({ message: 'fetching messages', messages, totalPages });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/global-message', async (req, res) => {
  try {
    const {UId, message, messageTime, messageDate,isAdminMessage} = req.body;

    // Create a new message entry
    const newMessage = await globalMessage.create({
      UId,
      message,
      messageTime,
      messageDate,
      isAdminMessage
    });

    res.status(201).json({ message: 'Message created successfully', data: newMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-event/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch user details by UId from the reg table
    const user = await events.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let image = null;
    if (user.image) {
      // If profilePicUrl exists, fetch the image URL from Firebase Storage
      const file = storage.file(user.image.split(storage.name + '/')[1]);
      const [exists] = await file.exists();
      if (exists) {
        image = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
      }
    }

    // Send the response with user data including profilePicUrl
    return res.status(200).json({
      user: {
        ...user.toJSON(),
        image
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

//////////////////expense/////////////////////////////////


router.post('/expense', upload.array('invoice', 20), async (req, res) => {
  const { Expense_Date, expenseType, amount, description, emp_id, name } = req.body;
  const invoiceFiles = req.files;

  try {
      if (!Expense_Date || !expenseType || !amount || !emp_id) {
          return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create a new ashram expense
      const newExpense = await ashramexpense.create({
          Expense_Date,
          expenseType,
          amount,
          description,
          emp_id,
          name
      });

      let invoiceUrl = [];
      if (invoiceFiles && invoiceFiles.length > 0) {
          for (const file of invoiceFiles) {
              const invoicePath = `invoices/${newExpense.id}/${file.originalname}`;

              await storage.upload(file.path, {
                  destination: invoicePath,
                  metadata: {
                      contentType: file.mimetype
                  }
              });

              invoiceUrl.push(`gs://${storage.name}/${invoicePath}`);
          }
      }

      await newExpense.update({ invoiceUrl: JSON.stringify(invoiceUrl) });

      const adminRecord = await Admin.findOne({ where: { emp_Id: emp_id } });
      if (!adminRecord) {
          return res.status(404).json({ error: 'Admin record not found' });
      }

      const newBalance = parseFloat(adminRecord.balance_amount) - parseFloat(amount);
      await adminRecord.update({ balance_amount: newBalance });

      res.status(201).json({ message: 'Ashram expense created successfully', expense: newExpense });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/get-expense', async (req, res) => {
  try {
    
    const page = parseInt(req.body.page) || 1;
    const pageSize = 10;
    const offset = (page - 1) * pageSize;
    const count = await ashramexpense.count();

    const totalpages = Math.ceil(count/pageSize)

    const expenses = await ashramexpense.findAll({
      order: [['id', 'DESC']],
      offset: offset,
      limit: pageSize,
    
    });

  
    const upcomingEventsFormatted = await Promise.all(expenses.map(async expense => {
      let invoiceUrl = null;
      if (expense.invoiceUrl) {
        const file = storage.file(expense.invoiceUrl.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          invoiceUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
          });
          invoiceUrl = invoiceUrl[0];
        }
      }
      return {
        id: expense.id,
        Expense_Date: expense.Expense_Date,
        expenseType: expense.expenseType,
        amount: expense.amount,
        description: expense.description,
        emp_id:expense.emp_id,
        name:expense.name,
        invoiceUrl
      };
    }));

    return res.status(200).json({ expenses: upcomingEventsFormatted,totalpages });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-expensebyid/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch expense details by id from the ashramexpense table
    const expense = await ashramexpense.findOne({ where: { id } });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    let invoiceUrl = [];
    if (expense.invoiceUrl) {
      // If invoiceUrls exist, fetch the image URLs from Firebase Storage
      const urls = JSON.parse(expense.invoiceUrl);
      for (const url of urls) {
        const file = storage.file(url.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          const signedUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' 
          });
          invoiceUrl.push(signedUrl[0]);
        } else {
          invoiceUrl.push(null);
        }
      }
    }

    // Send the response with expense data including invoiceUrls
    return res.status(200).json({
      expense: {
        ...expense.toJSON(),
        invoiceUrl
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/expense-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.ashramexpenses WHERE ";
    let sql = "SELECT * FROM thasmai.ashramexpenses WHERE ";

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const results = await sequelize.query(sql);
    console.log(results[0]);
    
    // Assuming sequelize returns an array of rows in the first element of the results array
    res.json({ results: results[0], totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/filter', async (req, res) => {
  try {
    
    const page = parseInt(req.body.page) || 1;
    const pageSize = 10;

    const { month, year } = req.query;

  
    const formattedMonth = month.padStart(2, '0');
    const formattedYear = year;
    const searchString = `%/${formattedMonth}/${formattedYear}`;

    
    const totalCount = await ashramexpense.count({
      where: {
        Date: {
          [Op.like]: searchString
        }
      }
    });

    
    const totalPages = Math.ceil(totalCount / pageSize);

    
    const offset = (page - 1) * pageSize;

    
    const expenses = await ashramexpense.findAll({
      where: {
        Date: {
          [Op.like]: searchString
        }
      },
      offset: offset,
      limit: pageSize
    });

    
    const expensesWithImages = await Promise.all(expenses.map(async expense => {
      let invoiceUrl = null;
      if (expense.invoiceUrl) {
        const file = storage.file(expense.invoiceUrl.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          invoiceUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500'
          });
          invoiceUrl = invoiceUrl[0];
        }
      }
      return {
        id: expense.id,
        Date: expense.Date,
        expenseType: expense.expenseType,
        amount: expense.amount,
        description: expense.description,
        invoiceUrl
      };
    }));

    res.json({ expenses: expensesWithImages, totalPages: totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/expense-excel', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let sql = "SELECT * FROM thasmai.ashramexpenses WHERE ";
    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    console.log(sql);

    const [queryResults, metadata] = await sequelize.query(sql);

 
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expenses');

    if (queryResults.length > 0) {
      worksheet.columns = Object.keys(queryResults[0]).map(key => ({
        header: key,
        key: key,
        width: 20
      }));

      queryResults.forEach(result => {
        worksheet.addRow(result);
      });
    }

    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=expenses.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/////////////////operator creation//////////////////

router.post('/operatorCreation', async (req, res) => {
  try {
    const { username,name, role, location, dateOfJoining, password } = req.body;

    const existingUser = await Admin.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Operator already exists'});
    }

    // Get the last emp_Id
    const lastEmpIdResult = await Admin.findOne({
      order: [['emp_Id', 'DESC']],
      attributes: ['emp_Id'],
    });
    const lastEmpId = lastEmpIdResult ? lastEmpIdResult.emp_Id : 0; // Handle case of no existing employees

    const newEmpId = lastEmpId + 1;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new operator
    const operator = await Admin.create({
      username,
      name,
      role,
      emp_Id: newEmpId,
      location,
      dateOfJoining,
      password: hashedPassword,
    });

    return res.status(200).json({ message: 'Operator created successfully', operator });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/updateOperator/:emp_Id', async (req, res) => {
  try {
    const emp_Id = req.params.emp_Id;
    const data = req.body;

    if (!emp_Id) {
      return res.status(400).json({ message: 'id is required' });
    }

    const operator = await Admin.findOne({ where: { emp_Id: emp_Id } });
    if (!operator) {
      return res.status(404).json({ message: 'id not found' });
    }

    if (data.password) {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      data.password = hashedPassword;
    }

    await operator.update(data);

    return res.status(200).json({ message: 'data updated successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'internal server error' });
  }
});

router.get('/operatorList' , async(req,res) =>{
  try{
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit =10;
    const offset = (page - 1) * limit;
    
    
     const totalCount = await Admin.count({where:{role:'operator'}});
     const totalPages = Math.ceil(totalCount/limit);

     const list = await Admin.findAll({where: {role:'operator'},
    limit,
    offset});
    if(!list){
      return res.status(404).json({message:'operators not found'});
    }
    return res.status(200).json({message:'operators list' ,totalCount,totalPages, list});
  } catch(error){
    console.log(error);
    return res.status(500).json('internal server error');
  }
});

router.get('/operator/:emp_Id' , async(req,res) =>{
  try{
    const emp_Id = req.params.emp_Id;
    const operator = await Admin.findOne({where:{emp_Id:emp_Id}});
    if(!operator){
      return res.status(404).json('id not found');
    }
    return res.status(200).json({message:'operator details', operator});
  } catch(error){
    return res.status(500).json('internal server error');
  }
});

router.post('/search-operator', async(req,res) =>{
  try{
    const {search, value} = req.body;
    if(!search || !value){
      return res.status(404).json('missing values');
    }
    const operator = await Admin.findOne({where:{[search]: value}});
    if(!operator){
      return res.status(404).json('operator not found');
    }
    return res.status(200).json([operator]);
  } catch(error) {
    return res.status(500).json('internal server error');
  }
});

router.post('/search_users', async (req, res) => {
  try {
    console.log("searching users");

    const { search, page } = req.body;
    const pageSize = 10;
    
    const pageNumber = page || 1;

    console.log(`Listing users - Page: ${pageNumber}, PageSize: ${pageSize}`);

    if (!search) {
      return res.status(400).json({ message: 'Search input is required in the request body.' });
    }

    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    const query = {
      [Op.or]: [
        { first_name: search.toLowerCase() },
        { UId: { [Op.regexp]: `^${escapedSearch}` } },
      ],
    };

    const users = await reg.findAll({
      where: query,
      attributes: ['first_name', 'last_name', 'email', 'phone', 'UId'],
      offset: (pageNumber - 1) * pageSize,
      limit: pageSize,
    });

    const usersWithBase64Image = users.map(user => {
      return {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        UId: user.UId,
      };
    });

    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//////////////////////////blog//////////////////////////////


router.post('/add-blog', upload.single('image'), async (req, res) => {
  const { blog_name, blog_description,date} = req.body;
  const eventImageFile = req.file;
  console.log(eventImageFile)
 
  try {
 
 
    const newEvent = await blogs.create({
      blog_name,
      blog_description,
      date
    });
 
 
    let image = ''; 
    if (eventImageFile) {
      const eventImagePath = `blog_image/${newEvent.id}/${eventImageFile.originalname}`;
 
 
      await storage.upload(eventImageFile.path, {
        destination: eventImagePath,
        metadata: {
          contentType: eventImageFile.mimetype
        }
      });
 
      image = `gs://${storage.name}/${eventImagePath}`;
    }
 
    await newEvent.update({ image });
 
    res.status(201).json({ message: 'blog created successfully', blog: newEvent });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/listblogs', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Fetch total count of blogs
    const totalBlogs = await blogs.count();

    // Fetch blogs with pagination
    const upcomingEvents = await blogs.findAll({
      order: [['id', 'DESC']],
      offset: offset,
      limit: limit
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalBlogs / limit);

    // Map through each event and fetch image if available
    const upcomingEventsFormatted = await Promise.all(upcomingEvents.map(async event => {
      let image = null;
      if (event.image) {
        // If image URL exists, fetch the image URL from Firebase Storage
        const file = storage.file(event.image.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          image = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
          image = image[0];
        }
      }
      // Return formatted event data with image
      return {
        id: event.id,
        blog_name: event.blog_name,
        blog_description: event.blog_description,
        date: event.date,
        image
      };
    }));

    return res.status(200).json({
      blogs: upcomingEventsFormatted,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-blog/:id', async (req, res) => {
  try {
    const { id } = req.params;
 
    // Fetch user details by UId from the reg table
    const user = await blogs.findOne({ where: { id } });
 
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    let image = null;
    if (user.image) {
      // If profilePicUrl exists, fetch the image URL from Firebase Storage
      const file = storage.file(user.image.split(storage.name + '/')[1]);
      const [exists] = await file.exists();
      if (exists) {
        image = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
      }
    }
 
    // Send the response with user data including profilePicUrl
    return res.status(200).json({
      user: {
        ...user.toJSON(),
        image
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update-blog/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const userData = req.body;
  const eventImageFile = req.file;
  console.log(eventImageFile)
 
  try {
 
    if (!id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
 
    // Find the user by UId
    const user = await blogs.findOne({ where: { id } });
 
    // Update user details
    if (user) {
      // Update all fields provided in the request, excluding the profilePic field
      delete userData.image; // Remove profilePic from userData
      await user.update(userData);
 
      // Fetch current profile picture URL
      let currentProfilePicUrl = user.image;
 
      // Store or update profile picture in Firebase Storage
      let image = currentProfilePicUrl; // Default to current URL
      if (eventImageFile) {
        const profilePicPath = `blog_image/${id}/${eventImageFile.originalname}`;
        // Upload new profile picture to Firebase Storage
        await storage.upload(eventImageFile.path, {
          destination: profilePicPath,
          metadata: {
            contentType: eventImageFile.mimetype
          }
        });
 
        // Get the URL of the uploaded profile picture
        image = `gs://${storage.name}/${profilePicPath}`;
 
        // Delete the current profile picture from Firebase Storage
        if (currentProfilePicUrl) {
          const currentProfilePicPath = currentProfilePicUrl.split(storage.name + '/')[1];
          await storage.file(currentProfilePicPath).delete();
        }
      }
 
      // Update user's profilePicUrl in reg table
      await user.update({ image });
 
      return res.status(200).json({ message: 'blog details updated successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    //console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-blogs/:blogId', async (req, res) => {
  try {
      const eventId = req.params.blogId;
      const event = await blogs.findByPk(eventId);
 
      if (!event) {
          return res.status(404).json({ error: 'Event not found' });
      } if (event.image) {
        const imagePath = event.image.replace(`gs://thasmai-star-life.appspot.com/`, '');
        await storage.file(imagePath).delete();
      }
  
      await event.destroy();
 
      res.status(200).json({ message: 'blog deleted successfully' });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/blogs-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

    console.log(queryConditions);

    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }

    function isNumeric(num) {
      return !isNaN(num);
    }

    let countSql = "SELECT COUNT(*) AS total FROM thasmai.blogs WHERE ";
    let sql = "SELECT * FROM thasmai.blogs WHERE ";

    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }

    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;

    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;

    sql += `LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);

    const [queryResults, metadata] = await sequelize.query(sql);

    res.json({ queryResults, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

/////////////////////add play list ///////////////////////


router.post('/add-video', upload.single('playList_image'), async (req, res) => {
  const { playList_heading, Video_heading, videoLink, category } = req.body;
  const playListImageFile = req.file;

  try {
    // Parse JSON strings to arrays if they are provided
    const parsedVideoHeading = Video_heading ? JSON.parse(Video_heading) : [];
    const parsedVideoLink = videoLink ? JSON.parse(videoLink) : [];

    // Create a new video record
    const newVideo = await Video.create({
      playList_heading,
      Video_heading: parsedVideoHeading,
      videoLink: parsedVideoLink,
      category
    });

    let playList_image = ''; 
    if (playListImageFile) {
      const playListImagePath = `playlist_images/${newVideo.id}/${playListImageFile.originalname}`;

      // Upload the image to Firebase Storage
      await storage.upload(playListImageFile.path, {
        destination: playListImagePath,
        metadata: {
          contentType: playListImageFile.mimetype
        }
      });

      // Construct the URL for the uploaded image
      playList_image = `gs://${storage.name}/${playListImagePath}`;
    }

    // Update the video record with the image URL if an image was uploaded
    if (playList_image) {
      await newVideo.update({ playList_image });
    }

    res.status(201).json({ message: 'Video created successfully', video: newVideo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.put('/update-video/:id', upload.single('playList_image'), async (req, res) => {
  const { id } = req.params;
  const { playList_heading, Video_heading, videoLink, category } = req.body;
  const playListImageFile = req.file;
 
 
  try {
    // Parse JSON strings to arrays
    const parsedVideoHeading = JSON.parse(Video_heading);
    const parsedVideoLink = JSON.parse(videoLink);
 
    // Find the existing video record
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
 
    // Update the video fields
    video.playList_heading = playList_heading;
    video.Video_heading = parsedVideoHeading;
    video.videoLink = parsedVideoLink;
    video.category = category;
 
    let playList_image = video.playList_image;
    if (playListImageFile) {
      const playListImagePath = `playlist_images/${video.id}/${playListImageFile.originalname}`;
 
      // Delete the old image from Firebase Storage if it exists
      if (playList_image) {
        await storage.file(playList_image.replace(`gs://${storage.name}/`, '')).delete();
      }
 
      // Upload the new image to Firebase Storage
      await storage.upload(playListImageFile.path, {
        destination: playListImagePath,
        metadata: {
          contentType: playListImageFile.mimetype
        }
      });
 
      // Construct the URL for the uploaded image
      playList_image = `gs://${storage.name}/${playListImagePath}`;
      video.playList_image = playList_image;
    }
 
    // Save the updated video record
    await video.save();
 
    res.status(200).json({ message: 'Video updated successfully', video });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-video', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const totalBlogs = await Video.count();
    const upcomingEvents = await Video.findAll({
      offset: offset,
      limit: limit
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalBlogs / limit);

    // Map through each event and fetch image if available
    const upcomingEventsFormatted = await Promise.all(upcomingEvents.map(async event => {
      let playList_image = null;
      if (event.playList_image) {
        // If image URL exists, fetch the image URL from Firebase Storage
        const file = storage.file(event.playList_image.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          playList_image = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
          playList_image = playList_image[0];
        }
      }

      // Combine Video_heading and videoLink into an array of objects
      const videos = event.Video_heading.map((heading, index) => ({
        video_heading: heading,
        video_link: event.videoLink[index]
      }));

      // Return formatted event data with image and combined video data
      return {
        id: event.id,
        playList_heading: event.playList_heading,
        video: videos,
        category: event.category,
        playList_image
      };
    }));

    return res.status(200).json({
      videos: upcomingEventsFormatted,
      totalPages: totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-video/:id', async (req, res) => {
  const { id } = req.params;
 
  try {
    // Find the video record
    const video = await Video.findByPk(id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
 
    // Delete the image from Firebase Storage if it exists
    if (video.playList_image) {
      const imagePath = video.playList_image.replace(`gs://thasmai-star-life.appspot.com/`, '');
      await storage.file(imagePath).delete();
    }
 
    // Delete the video record from the database
    await video.destroy();
 
    res.status(200).json({ message: 'Video and associated image deleted successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/add-meditation-time', upload.fields([
 
  { name: 'morning_image', maxCount: 1 },
  { name: 'evening_image', maxCount: 1 },
  { name: 'general_image', maxCount: 1 }
]), async (req, res) => {
  const { country, general_video, morning_time_from, morning_time_to, evening_time_from, evening_time_to, morning_video, evening_video } = req.body;
 
  const existingCountry = await meditationTime.findOne({ where: { country } });
  if (existingCountry) {
    return res.status(400).json({ message: "Country already exists" });
  }
  const morningImageFile = req.files['morning_image'] ? req.files['morning_image'][0] : null;
  const eveningImageFile = req.files['evening_image'] ? req.files['evening_image'][0] : null;
  const generalImageFile = req.files['general_image'] ? req.files['general_image'][0] : null;
 
  try {
    // Create a new meditation time record
    const newMeditationTime = await meditationTime.create({
      country,
      general_video,
      morning_time_from,
      morning_time_to,
      evening_time_from,
      evening_time_to,
      morning_video,
      evening_video
    });
 
 
    let morning_image = '';
    let evening_image = '';
    let general_image = '';
 
    if (morningImageFile) {
      const morningImagePath = `meditation_images/${newMeditationTime.id}/morning/${morningImageFile.originalname}`;
      await storage.upload(morningImageFile.path, {
        destination: morningImagePath,
        metadata: {
          contentType: morningImageFile.mimetype
        }
      });
      morning_image = `gs://${storage.name}/${morningImagePath}`;
    }
 
    if (eveningImageFile) {
      const eveningImagePath = `meditation_images/${newMeditationTime.id}/evening/${eveningImageFile.originalname}`;
      await storage.upload(eveningImageFile.path, {
        destination: eveningImagePath,
        metadata: {
          contentType: eveningImageFile.mimetype
        }
      });
      evening_image = `gs://${storage.name}/${eveningImagePath}`;
    }
 
    if (generalImageFile) {
      const generalImagePath = `meditation_images/${newMeditationTime.id}/general/${generalImageFile.originalname}`;
      await storage.upload(generalImageFile.path, {
        destination: generalImagePath,
        metadata: {
          contentType: generalImageFile.mimetype
        }
      });
      general_image = `gs://${storage.name}/${generalImagePath}`;
    }
 
    // Update the new record with the image URLs
    await newMeditationTime.update({ morning_image, evening_image, general_image });
 
    res.status(201).json({ message: 'Meditation time added successfully', data: newMeditationTime });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/update-meditation-time/:id', upload.fields([
  { name: 'morning_image', maxCount: 1 },
  { name: 'evening_image', maxCount: 1 },
  { name: 'general_image', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const { country, general_video, morning_time_from, morning_time_to, evening_time_from, evening_time_to, morning_video, evening_video } = req.body;
  const morningImageFile = req.files['morning_image'] ? req.files['morning_image'][0] : null;
  const eveningImageFile = req.files['evening_image'] ? req.files['evening_image'][0] : null;
  const generalImageFile = req.files['general_image'] ? req.files['general_image'][0] : null;
 
  try {
    // Find the existing meditation time record
    const existingMeditationTime = await meditationTime.findByPk(id);
 
    if (!existingMeditationTime) {
      return res.status(404).json({ error: 'Meditation time record not found' });
    }
 
    // Update the text fields
    existingMeditationTime.country = country || existingMeditationTime.country;
    existingMeditationTime.general_video = general_video || existingMeditationTime.general_video;
    existingMeditationTime.morning_time_from = morning_time_from || existingMeditationTime.morning_time_from;
    existingMeditationTime.morning_time_to = morning_time_to || existingMeditationTime.morning_time_to;
    existingMeditationTime.evening_time_from = evening_time_from || existingMeditationTime.evening_time_from;
    existingMeditationTime.evening_time_to = evening_time_to || existingMeditationTime.evening_time_to;
    existingMeditationTime.morning_video = morning_video || existingMeditationTime.morning_video;
    existingMeditationTime.evening_video = evening_video || existingMeditationTime.evening_video;
 
    // Function to delete old image from Firebase Storage
    const deleteOldImage = async (imageUrl) => {
      if (imageUrl) {
        const filePath = imageUrl.replace(`gs://${storage.name}/`, '');
        await storage.file(filePath).delete().catch(() => {
          console.log(`Failed to delete old image at ${filePath}`);
        });
      }
    };
 
    // Upload new images to Firebase Storage and get the URLs
    if (morningImageFile) {
      await deleteOldImage(existingMeditationTime.morning_image);
 
      const morningImagePath = `meditation_images/${id}/morning/${morningImageFile.originalname}`;
      await storage.upload(morningImageFile.path, {
        destination: morningImagePath,
        metadata: {
          contentType: morningImageFile.mimetype
        }
      });
      existingMeditationTime.morning_image = `gs://${storage.name}/${morningImagePath}`;
    }
 
    if (eveningImageFile) {
      await deleteOldImage(existingMeditationTime.evening_image);
 
      const eveningImagePath = `meditation_images/${id}/evening/${eveningImageFile.originalname}`;
      await storage.upload(eveningImageFile.path, {
        destination: eveningImagePath,
        metadata: {
          contentType: eveningImageFile.mimetype
        }
      });
      existingMeditationTime.evening_image = `gs://${storage.name}/${eveningImagePath}`;
    }
 
    if (generalImageFile) {
      await deleteOldImage(existingMeditationTime.general_image);
 
      const generalImagePath = `meditation_images/${id}/general/${generalImageFile.originalname}`;
      await storage.upload(generalImageFile.path, {
        destination: generalImagePath,
        metadata: {
          contentType: generalImageFile.mimetype
        }
      });
      existingMeditationTime.general_image = `gs://${storage.name}/${generalImagePath}`;
    }
 
    // Save the updated record
    await existingMeditationTime.save();
 
    res.status(200).json({ message: 'Meditation time updated successfully', data: existingMeditationTime });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.get('/meditation-time', async (req, res) => {
  const {UId}  = req.session;
  const time = req.query.time;
 
  try {
    // Fetch the country from the reg table using UId
    const userRegDetails = await reg.findOne({ where: { UId } });
 
    if (!userRegDetails) {
      return res.status(404).json({ error: 'User registration details not found' });
    }
 
    const { country } = userRegDetails;
 
    // Find the meditation time details for the given country
    const meditationTimeDetails = await meditationTime.findOne({ where: { country } });
 
    if (!meditationTimeDetails) {
      return res.status(404).json({ error: 'Meditation time details not found for the specified country' });
    }
 
    // Function to get signed URL from Firebase Storage
    const getSignedUrl = async (gsUrl) => {
      if (!gsUrl) return null;
      const filePath = gsUrl.replace(`gs://${storage.name}/`, '');
      const file = storage.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
        return url;
      }
      return null;
    };
 
    // Determine which video and image to return based on the time
    let video, image;
    if (time >= meditationTimeDetails.morning_time_from && time <= meditationTimeDetails.morning_time_to) {
      video = meditationTimeDetails.morning_video;
      image = await getSignedUrl(meditationTimeDetails.morning_image);
    } else if (time >= meditationTimeDetails.evening_time_from && time <= meditationTimeDetails.evening_time_to) {
      video = meditationTimeDetails.evening_video;
      image = await getSignedUrl(meditationTimeDetails.evening_image);
    } else {
      video = meditationTimeDetails.general_video;
      image = await getSignedUrl(meditationTimeDetails.general_image);
    }
 
    res.json({ video, image });
 
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditationTimeList', async (req, res) => {
  try {
    // Fetch all meditation time details
    const meditationTimes = await meditationTime.findAll();

    // Function to get signed URL from Firebase Storage
    const getSignedUrl = async (gsUrl) => {
      if (!gsUrl) return null;
      const filePath = gsUrl.replace(`gs://${storage.name}/`, '');
      const file = storage.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
        return url;
      }
      return null;
    };

    // Map over all meditation time records to include signed URLs for images
    const result = await Promise.all(meditationTimes.map(async (record) => {
      return {
        ...record.toJSON(),
        morning_image: await getSignedUrl(record.morning_image),
        evening_image: await getSignedUrl(record.evening_image),
        general_image: await getSignedUrl(record.general_image)
      };
    }));

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditation-time/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the meditation time record by ID
    const meditationTimeRecord = await meditationTime.findByPk(id);

    if (!meditationTimeRecord) {
      return res.status(404).json({ error: 'Meditation time record not found' });
    }

    // Function to get signed URL from Firebase Storage
    const getSignedUrl = async (gsUrl) => {
      if (!gsUrl) return null;
      const filePath = gsUrl.replace(`gs://${storage.name}/`, '');
      const file = storage.file(filePath);
      const [exists] = await file.exists();
      if (exists) {
        const [url] = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
        return url;
      }
      return null;
    };

    // Include signed URLs for images
    const result = {
      ...meditationTimeRecord.toJSON(),
      morning_image: await getSignedUrl(meditationTimeRecord.morning_image),
      evening_image: await getSignedUrl(meditationTimeRecord.evening_image),
      general_image: await getSignedUrl(meditationTimeRecord.general_image)
    };

    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//////////////////////////zoom meeting/////////////////////////////

router.get('/get-zoomclass', async (req, res) => {
  try {
    // Fetch all records from the zoom table
    const zoomRecords = await zoom.findAll();

    // Check if any records are found
    if (zoomRecords.length > 0) {
      res.status(200).json(zoomRecords);
    } else {
      res.status(404).json({ message: 'No zoom records found' });
    }
  } catch (error) {
    console.error('Error fetching zoom records:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-zoom/:zoomId', async (req, res) => {
  try {
      const zoomId = req.params.zoomId;
      const event = await zoom.findByPk(zoomId);

      if (!event) {
          return res.status(404).json({ error: 'not found' });
      }
      await event.destroy();

      res.status(200).json({ message: 'deleted successfully' });
  } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/list-feedback', async (req, res) => {
  try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const offset = (page - 1) * pageSize;

      const feedbacks = await feedback.findAndCountAll({
          limit: pageSize,
          offset: offset
      });

      const totalItems = feedbacks.count;
      const totalPages = Math.ceil(totalItems / pageSize);

      const feedbackWithUsernames = await Promise.all(feedbacks.rows.map(async fb => {
          const user = await reg.findOne({ where: { UId: fb.UId } });
          const username = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';

          return {
              id:fb.id,
              feedback: fb.feedback,
              rating: fb.rating,
              UId: fb.UId,
              username: username
          };
      }));

      res.status(200).json({
          data: feedbackWithUsernames,
          currentPage: page,
          totalPages: totalPages,
          pageSize: pageSize,
          totalItems: totalItems
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/feedback-query', async (req, res) => {
  try {
    const queryConditions = req.body.queryConditions;
    const page = req.body.page || 1; // Default to page 1 if not provided
    const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided
 
    console.log(queryConditions);
 
    if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
      return res.status(400).json({ message: 'Invalid query conditions provided.' });
    }
 
    function isNumeric(num) {
      return !isNaN(num);
    }
 
    let countSql = "SELECT COUNT(*) AS total FROM thasmai.feedbacks WHERE ";
    let sql = "SELECT * FROM thasmai.feedbacks WHERE ";
 
    for (let i = 0; i < queryConditions.length; i++) {
      if (queryConditions[i].operator === "between") {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} "${queryConditions[i].value.split("/")[0]}" AND "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
      } else {
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'`} ${queryConditions[i].logicaloperator !== "null" ? queryConditions[i].logicaloperator : ""} `;
      }
    }
 
    const countResult = await sequelize.query(countSql, { type: sequelize.QueryTypes.SELECT });
    const totalCount = countResult[0].total;
 
    const totalPages = Math.ceil(totalCount / pageSize);
    const offset = (page - 1) * pageSize;
 
    sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
    console.log(sql);
 
    const queryResults = await sequelize.query(sql, { type: sequelize.QueryTypes.SELECT });
 
    const feedbackWithUsernames = await Promise.all(queryResults.map(async fb => {
      const user = await sequelize.query("SELECT first_name, last_name FROM thasmai.regs WHERE UId = :UId", {
        replacements: { UId: fb.UId },
        type: sequelize.QueryTypes.SELECT
      });
      const username = user.length > 0 ? `${user[0].first_name} ${user[0].last_name}` : 'Unknown User';
 
      return {
        ...fb,
        username: username
      };
    }));
 
    res.json({ queryResults: feedbackWithUsernames, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/impNotes' , async(req,res) =>{
  try{
    const notes = await globalMessage.findAll({
      order: [['id', 'DESC']],
      where: {
        message: {
          [Op.startsWith]: 'Meditation Note : imp:'
        }
      }
    });
    const messageData = await Promise.all(notes.map(async (message) => {
      const userData = await Users.findOne({ where: { UId: message.UId }, attributes: ['firstName', 'secondName'] });
      console.log("userData.............",userData);
      const userName = `${userData.firstName} ${userData.secondName}`;
      return { 
        ...message.toJSON(), 
        userName 
      };
 
    }));

    return res.status(200).json(messageData);
  } catch(error){
    return res.status(500).json('internal server error');
  }
});

router.get('/videos', async (req, res) => {
  try {
      const videos = await Video.findAll();

      // Initialize groupedVideos as an empty array
      let groupedVideos = [];

      await Promise.all(videos.map(async video => {
          let playList_image = null;
          if (video.playList_image) {
              // If playList_image URL exists, fetch the image URL from Firebase Storage
              const file = storage.file(video.playList_image.split(storage.name + '/')[1]);
              const [exists] = await file.exists();
              if (exists) {
                  playList_image = await file.getSignedUrl({
                      action: 'read',
                      expires: '03-01-2500' // Adjust expiration date as needed
                  });
                  playList_image = playList_image[0];
              }
          }

          const existingGroup = groupedVideos.find(group => group.playList_heading === video.playList_heading);
          if (existingGroup) {
              existingGroup.videos.push({
                  id: video.id,
                  Video_heading: video.Video_heading,
                  videoLink: video.videoLink
              });
          } else {
              groupedVideos.push({
                  playList_heading: video.playList_heading,
                  playList_image,
                  videos: [{
                      id: video.id,
                      Video_heading: video.Video_heading,
                      videoLink: video.videoLink
                  }]
              });
          }
      }));

      res.json(groupedVideos);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/app-feedback-by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
     const feedbacks = await feedback.findAndCountAll({ where: { id } });
 
    if (!feedbacks) {
      return res.status(404).json({ error: 'User not found' });
    }

    const feedbackWithUsernames = await Promise.all(feedbacks.rows.map(async fb => {
      const user = await reg.findOne({ where: { UId: fb.UId } });
      const username = user ? `${user.first_name} ${user.last_name}` : 'Unknown User';

      return {
          feedback: fb.feedback,
          rating: fb.rating,
          UId: fb.UId,
          username: username
      };
  }));
    
    return res.status(200).json({
      feedbackWithUsernames
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/get-fees-sum', async (req,res) => {
  try {
   
    const totalAmount = await Appointment.sum('payment');

    return res.status(200).json({totalAmount});
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/payOperator', upload.single('image'), async (req,res) => {
 
  const { emp_Id,emp_Name,amount,date} = req.body;
  console.log("amount", amount);
  const bill_image = req.file;
try{
  
  const newEntry = await operatorFund.create({
    emp_Id,
    emp_Name,
    amount,
    date
  });
  let bill_Image = '';
  if(bill_image){
  const billImagePath = `operatorFund/${newEntry.id}/${bill_image.originalname}`;

  await storage.upload(bill_image.path , {
    destination: billImagePath,
    metadata:{
      contentType : bill_image.mimetype
    }
  });

  bill_Image =`gs://${storage.name}/${billImagePath}`;
}
await newEntry.update({bill_Image});

const adminRecord = await Admin.findOne({ where: { emp_Id: emp_Id } });
    if (!adminRecord) {
      return res.status(404).json({ error: 'Admin record not found' });
    }

    const newBalance = parseFloat(adminRecord.balance_amount) + parseFloat(amount);
    await adminRecord.update({ balance_amount: newBalance });
  
res.status(200).json({message:'data uploaded successfully', payment: newEntry});

} catch(error){
  console.log(error);

  res.status(500).json({ error: 'Internal Server Error'});
}

});

router.get('/getFundById', async (req, res) => {
  try {
    const { emp_Id } = req.query;

    // Fetch user details by UId from the reg table
    const users = await operatorFund.findAll({ where: { emp_Id } });

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const usersWithBillImages = await Promise.all(users.map(async user => {
      let bill_Image = [];
      if (user.bill_Image) {
        // If bill_Image exists, fetch the image URL from Firebase Storage
        const file = storage.file(user.bill_Image.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          bill_Image = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
        }
      }
      return {
        ...user.toJSON(),
        bill_Image
      };
    }));

    // Send the response with user data including bill_Image
    return res.status(200).json({
      users: usersWithBillImages
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/list-admin',async(req,res) =>{
  try{
    const admins = await Admin.findAll({where:{
      id:{[Op.ne]:1}
    }});
    return res.status(200).json(admins)
  }
  catch(error){
    console.log(error)
    return res.status(500).json({message:'internal server error'})
  }
});

router.get('/get-balance', async (req, res) => {
  try {
      const { emp_Id } = req.query;


      if (!emp_Id) {
          return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await Admin.findOne({
          attributes: ['balance_amount'],
          where: { emp_Id },
      });

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json(user);
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/global-Delete/:id' , async (req, res) =>{
  try{
    
    const  id  = req.params.id;
    console.log(id);
    const message = await globalMessage.findOne({ where: { id }});
    if(!message){
      return res.status(404).json('message not found ');
    }
    await message.destroy();
    return res.status(200).json('message deleted successfully');
  }
  catch(error){
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/appointmentFeedback', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Changed to query parameters
    const limit = 10;

    const totalCount = await Appointment.count({
      where: {
        feedback: {
          [Op.ne]: null
        }
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    const appointmentFeedback = await Appointment.findAll({
      where: {
        feedback: {
          [Op.ne]: null
        }
      },
      order: [['id', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    });

    return res.status(200).json({
      feedback: appointmentFeedback,
      totalCount: totalCount,
      totalPages: totalPages
    });
  } catch (error) {
    console.error('Error fetching appointment feedback:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/check-payment-flag',async(req,res) =>{
  try{
    const UId = req.query.UId;

    const user = await meditationFees.findOne({
                   where:{UId},
                   attributes: ['fee_payment_status'],
                   order:[['id','DESC']]
                  });
      
     if(!user){
      res.status(404).json({message:"user has not done a payment yet"});
     }
     return res.status(200).json(user);

  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"server error",error});
  }
});

router.get('/waitingListDetails', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
 
    const { count, rows: waitingList } = await reg.findAndCountAll({
      where: {
        classAttended: false
      },
      order: [['UId', 'DESC']],
      offset,
      limit
    });
 
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      waitingListDetails: waitingList
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/thisMonthDetails', async (req, res) => {
  try {
      const currentDate = new Date();
      const startDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDateOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
 
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;
 
      const { count, rows: users } = await reg.findAndCountAll({
          where: {
              DOJ: {
                  [Op.between]: [startDateOfMonth.toISOString().slice(0, 10), endDateOfMonth.toISOString().slice(0, 10)]
              }
          },
          order: [['UId', 'DESC']],
          offset,
          limit
      });
 
      res.json({
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          users
      });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


// router.get('/beneficiariesDetails', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
 
//     const { count, rows: beneficiaries } = await Distribution.findAndCountAll({
//       offset,
//       limit
//     });
 
//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       beneficiariesDetails: beneficiaries
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// router.get('/paymentDetails', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
 
//     const userRecords = await Users.findAll();
//     const userUIds = userRecords.map(userRecords => userRecords.UId);
 
//     const { count, rows: list } = await reg.findAndCountAll({
//       where: {
//         UId: {
//           [Op.notIn]: userUIds
//         }
//       },
//       offset,
//       limit
//     });
 
//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       waitingListDetails: list
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


// router.get('/paymentDetails', async (req, res) => {
//   try {
//     const page = parseInt(req.query.page, 10) || 1;
//     const limit = parseInt(req.query.limit, 10) || 10;
//     const offset = (page - 1) * limit;

//     // Fetch all UIds from the Users table
//     const userRecords = await Users.findAll({
//       attributes: ['UId']
//     });
//     const userUIds = userRecords.map(user => user.UId);

//     // Fetch paginated records from reg table where UId is not in Users table
//     const { count, rows: list } = await reg.findAndCountAll({
//       where: {
//         UId: {
//           [Op.notIn]: userUIds
//         }
//       },
//       offset,
//       limit
//     });

//     if (!list.length) {
//       return res.status(404).json({ message: 'No records found' });
//     }

//     return res.status(200).json({
//       totalItems: count,
//       totalPages: Math.ceil(count / limit),
//       currentPage: page,
//       waitingListDetails: list
//     });
//   } catch (error) {
//     console.error('Error:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
// });


router.get('/beneficiariesDetails', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Fetching distinct UIds and the sum of distributed_coupon
    const { count, rows: beneficiaries } = await Distribution.findAndCountAll({
      attributes: [
        'UId',
        'firstName',
        'secondName',
        [sequelize.fn('SUM', sequelize.col('distributed_coupons')), 'totalDistributedCoupon']
      ],
      group: ['UId', 'firstName', 'secondName'],
      order: [['UId', 'DESC']],
      offset,
      limit
    });

    // Total count of distinct UIds
    const totalDistinctUIds = await Distribution.count({
      distinct: true,
      col: 'UId'
    });

    return res.status(200).json({
      totalItems: totalDistinctUIds,
      totalPages: Math.ceil(totalDistinctUIds / limit),
      currentPage: page,
      beneficiariesDetails: beneficiaries
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/paymentDetails', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
 
    const userRecords = await Users.findAll();
    const userUIds = userRecords.map(userRecords => userRecords.UId);
 
    const { count, rows: list } = await reg.findAndCountAll({
      where: {
        UId: {
          [Op.notIn]: userUIds
        },
        classAttended : true
      },
      order: [['UId', 'DESC']],
      offset,
      limit
    });
 
    return res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      waitingListDetails: list
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/searchUser', async (req, res) => {
  try {
    const field = req.query.field;
    const value = req.query.value; 
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided
    const offset = (page - 1) * limit;

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
      
    const lowerCaseValue = value.toLowerCase();

    // Fetch users avoiding the first 10 UserIds
    const { count, rows: userDetails } = await reg.findAndCountAll({
      where: {
        [field]: lowerCaseValue,
       
      },
      limit,
      offset,
    });

    if (userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Success',
      data: userDetails,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/update-user-status', async (req, res) => {
  try {
    // Update user_Status from null to 'ACTIVE'
    const [affectedRows] = await reg.update(
      { user_Status: 'ACTIVE' },
      {
        where: {
          user_Status: null,
        },
      }
    );
    const [affectedRow] = await Users.update(
      { user_Status: 'ACTIVE' },
      {
        where: {
          user_Status: null,
        },
      }
    );

    if (affectedRows > 0) {
      res.status(200).json({ message: 'User statuses updated successfully' });
    } else {
      res.status(404).json({ message: 'No users found with user_Status null' });
    }
  } catch (error) {
    console.error('Error updating user statuses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;



    