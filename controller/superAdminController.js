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

      if (month) {
          // If month is provided, get the count for each day in that month
          groupBy = [sequelize.fn('DAY', sequelize.col('DOJ'))];
          attributes = [
              [sequelize.fn('DAY', sequelize.col('DOJ')), 'day'],
              [sequelize.fn('COUNT', '*'), 'count'],
          ];
          additionalConditions = {
            DOJ: {
                [Op.between]: [`${year}-${month}-01`, `${year}-${month}-31`],
            },
        };
      } else if (year) {
          // If year is provided, get the count for each month in that specific year
          groupBy = [sequelize.fn('MONTH', sequelize.col('DOJ'))];
          attributes = [
              [sequelize.fn('MONTH', sequelize.col('DOJ')), 'month'],
              [sequelize.fn('COUNT', '*'), 'count'],
          ];

          // Filter results for the specified year
          additionalConditions = {
              DOJ: {
                  [Op.between]: [`${year}-01-01`, `${year}-12-31`],
              },
          };
      }

      const registerCounts = await reg.findAll({
          attributes: attributes,
          where: {
              ...additionalConditions, // Include additional conditions if provided
          },
          group: groupBy,
          order: groupBy, // Ensure order by the specified time unit
      });

      res.json(registerCounts);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
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

router.get('/meditation', async (req, res) => {
  try {
    const list = await meditation.count({});

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

router.get('/beneficiaries', async (req, res) => {
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
              coupons: {
                  [Op.ne]: 0,
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

// router.post('/events-query', async (req, res) => {
//   try {
//     const queryConditions = req.body.queryConditions;
//     const page = req.body.page || 1; // Default to page 1 if not provided
//     const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

//     console.log(queryConditions);

//     if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
//       return res.status(400).json({ message: 'Invalid query conditions provided.' });
//     }

//     function isNumeric(num) {
//       return !isNaN(num);
//     }

//     let sql = "SELECT * FROM sequel.events WHERE ";
//     for (let i = 0; i < queryConditions.length; i++) {
//       if(queryConditions[i].operator === "between"){

//       sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
        
//       }
//       else{
//       sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
//       }
//     }

//     // Apply pagination
//     const offset = (page - 1) * pageSize;
//      sql += `LIMIT ${pageSize} OFFSET ${offset}`;

//     console.log(sql);

//     const [queryResults, metadata] = await sequelize.query(sql);

    
//    const totalCount = queryResults.length;

 
//     const totalPages = Math.ceil(totalCount / pageSize);
    
//     // Assuming sequelize returns an array of rows in the first element of the results array
//     res.json({ queryResults ,totalPages});
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });


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
    const { totalCoupons, distributedIds, description } = req.body;
//console.log("------------------------totalCoupons, distributedIds, description.........",totalCoupons, distributedIds, description);
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
      order: [['coupons', 'DESC']], // Order by UserId in descending order
      limit: totalCoupons,
      where: {
        UserId: { [Op.gt]: 11 },
        coupons: { [Op.gt]: 0 }, // Start from UserId 11
      }, // Exclude the first 10 records
    });

   // console.log("........................................................", usersWithCoupons);

    // Check if enough coupons are available for distribution
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
    await Promise.all(distributedIds.map(async (UserId) => {
      const user = await Users.findByPk(UserId);
      if (user) {
        // Update coupons in the Users table by adding couponsPerUser
        await Users.update(
          { coupons: sequelize.literal(`coupons + ${couponsPerUser}`) },
          { where: { UserId: UserId } }
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
    const { coupons, UIds, description } = req.body;
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
        distribution_time: new Date().toISOString(),
      });

      //////////////////////////////////
      const latestDistributionRecord = await Distribution.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time'],
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
    console.log("UIds, couponsToDistribute",UIds, couponsToDistribute);

    const users = await Users.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Users not found' });
    }

    const insufficientCouponUsers = users.filter(user => user.coupons < couponsToDistribute);
    if (insufficientCouponUsers.length > 0) {
      return res.status(400).json({ error: 'Not enough coupons to distribute for some users' });
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/revoke-coupons', async (req, res) => {
  try {
    const { UIds } = req.body;

    // Retrieve coupon distribution details
    const couponDistributionRecords = await coupondistribution.findAll({ where: { UId: UIds } });

    if (!couponDistributionRecords || couponDistributionRecords.length === 0) {
      return res.status(404).json({ error: 'Coupon distribution records not found' });
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/distributetousers', async (req, res) => {
  try {
    const { UIds } = req.body;

    const users = await Users.findAll({ where: { UId: UIds } });

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'Users not found' });
    }

    const totalCouponsToDistribute = await coupondistribution.sum('coupons_to_distribute');

    if (totalCouponsToDistribute === null || totalCouponsToDistribute === 0) {
      return res.status(400).json({ error: 'No coupons to distribute' });
    }

    const couponsPerUser = totalCouponsToDistribute / UIds.length;

    if (!Number.isInteger(couponsPerUser)) {
      return res.status(400).json({ error: 'Cannot equally distribute coupons among the specified users' });
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
    return res.status(500).json({ error: 'Internal Server Error' });
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
      attributes: ['DOJ', 'firstName', 'secondName', 'UId', 'coupons', 'email', 'phone', 'ban'],
      order: [['userId', 'ASC']], // Order by UId in ascending order
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



////////////////////////////////////////mahadhanam///////////////////////////////////////


router.post('/simulation', async (req, res) => {
  try {
    const { coupons, UIds, description } = req.body;

    // Validate input
    if (!coupons || !UIds || !Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide coupons and a non-empty array of UIds.' });
    }

    // Check if coupons is a positive integer
    if (!Number.isInteger(coupons) || coupons <= 0) {
      return res.status(400).json({ message: 'Invalid input. Coupons should be a positive integer.' });
    }

    // Fetch users to update from the Users table based on UIds
    const usersToUpdate = await Users.findAll({
      where: {
        UId: UIds,
      },
    });

    // Check if enough coupons are available for all specified users
    if (usersToUpdate.length !== UIds.length) {
      return res.status(400).json({ message: 'Not enough coupons available for all specified users.' });
    }

    // Use Promise.all to asynchronously update multiple users and fetch related information
    const updatedUsers = await Promise.all(usersToUpdate.map(async (user) => {
      // Update the 'mahadhanam' table with distribution details
      await mahadhanam.create({
        firstName: user.firstName,
        secondName: user.secondName,
        UId: user.UId,
        distributed_coupons: coupons,
        description: description,
        distribution_time: new Date().toISOString(),
      });

      // Find the latest distribution record for the user from the 'Distribution' table
      const latestDistributionRecord = await mahadhanam.findOne({
        attributes: ['firstName', 'secondName', 'UId', 'distributed_coupons', 'description', 'distribution_time'],
        where: { UId: user.UId },
        order: [['distribution_time', 'DESC']], // Order by distribution_time in descending order to get the latest record
      });

      // Find bank details for the user from the 'BankDetails' table
      const bankDetails = await BankDetails.findOne({
        attributes: ['AadarNo', 'IFSCCode', 'branchName', 'accountName', 'accountNo'],
        where: { UId: user.UId },
      });

      // Return an object containing updated user details, distribution details, and bank details
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

    // Send a JSON response with a success message and updated user details
    res.json({ message: 'Coupons reduced successfully for specified users.', distributionDetails: updatedUsers });
  } catch (error) {
    // Handle errors by logging and sending a 500 Internal Server Error response
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/mahadhanam-download', async (req, res) => {
  try {
    const UIds = req.query.UIds;
 
    if (!Array.isArray(UIds) || UIds.length === 0) {
      return res.status(400).json({ message: 'Invalid input. Please provide a non-empty array of UIds.' });
    }

    // Fetch the distribution details for each user
    const userDistributionDetails = await Promise.all(UIds.map(async (UId) => {
      const latestDistributionRecord = await mahadhanam.findOne({
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
    let countSql = `SELECT COUNT(*) AS total FROM thasmai.Users WHERE ${baseCondition} AND `;
    let sql = `SELECT * FROM thasmai.Users WHERE ${baseCondition} AND `;

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


router.post('/save-token', async (req, res) => {
  try {
    const { UId, token } = req.body; 
    const newNotification = await notification.create({ UId, token });
    res.status(201).json({ message: 'Notification saved successfully', notification: newNotification });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
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

router.put('/update-configuration/:id', async (req, res) => {
  const id = req.params.id;
  const configdata = req.body;

  try {
      if (!id) {
          return res.status(400).json({ error: 'ID not found' });
      }

      // Find by id
      const data = await financialconfig.findOne({ where: { id } });

      // Update data
      if (data) {
         // console.log("finconfig data updated");
          await data.update(configdata);
          return res.status(200).json({ message: 'Data updated successfully' });
          
      } else {
          return res.status(404).json({ error: 'Data not found' });
      }
  } catch (error) {
      //console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/appconfig',async(req,res) =>{
  try{
      //console.log("get appconfig data");
      const appconfig = await applicationconfig.findAll();
      
      res.status(200).json({message:'Fetching data successfully',appconfig});
  } catch(error) {
      //console.log(error);
      res.status(500).json({message:'internal server error'});
  }
});

router.put('/update-appconfig/:id', async(req, res) =>{
  const id = req.params.id;
  const configdata = req.body;

  try{
      if(!id) {
          return res.status(400).json({error:'ID not found'});
      }
      // find by id
      const data = await applicationconfig.findOne({where:{id}});

      //updating
      if(data){
         // console.log("updating");
          await data.update(configdata);
          return res.status(200).json({message:'Data updated successfully'});
      } else {
          return res.status(404).json({ error:'Data not found'});
      }
  } catch(error) {
     // console.log(error);
      return res.status(500).json({error:'internal server error'});
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

////////////////////////////////// financial pages////////////////////////////////


router.get('/list-users', async (req, res) => {
  const pageSize = 10;
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

    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }

    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
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

    res.json({ message: 'Success', data: mergedResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/list-donation', async (req, res) => {
  const pageSize = 10;
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
 
    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
 
    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
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
        total_distributed_coupons: distributionResult ? distributionResult.dataValues.total_distributed_coupons : 0,
        latest_donation: latestDonation ? latestDonation.amount : 0,
      };
    });
 
    res.json({ message: 'Success', data: mergedResults });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/list-fees', async (req, res) => {
  const pageSize = 10;
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
 
    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
 
    const userDetails = await Users.findAll({
      where: {
        [field]: value,
      },
    });
 
    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
 
    // Step 2: Extract UIds from the search results
    const UIds = userDetails.map(user => user.UId);
 
    // Step 3: Fetch the total sum of distributed_coupons for each UId
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
 
    res.json({ message: 'Success', data: mergedResults });
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
 
    if (!field || !value) {
      return res.status(400).json({ message: 'Please provide both field and value parameters' });
    }
 
    const lowerCaseValue = value.toLowerCase();
 
    // Search the database for appointments matching the field and value
    const userDetails = await Appointment.findAll({
      where: {
        [field]: lowerCaseValue,
      },
    });
 
    if (!userDetails || userDetails.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
 
    // Fetch the coupons field from the Users table for each appointment
    const resultsWithCoupons = await Promise.all(userDetails.map(async appointment => {
      const user = await Users.findOne({ where: { UId: appointment.UId } });
      return {
        ...appointment.dataValues,
        coupons: user ? user.coupons : null,
      };
    }));
 
    res.json({ message: 'Success', data: resultsWithCoupons });
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

    // Find group members for the appointment
    const groupMembers = await GroupMembers.findAll({ where: { appointmentId: appointment.id } });

    // Attach group members to the appointment object
    appointment.dataValues.groupMembers = groupMembers;

    // Respond with the appointment
    return res.status(200).json({ message: 'Fetching appointment', appointment });
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

// router.post('/appointment-query', async (req, res) => {
//   try {
//     const queryConditions = req.body.queryConditions;
//     const page = req.body.page || 1; // Default to page 1 if not provided
//     const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

//     console.log(queryConditions);

//     if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
//       return res.status(400).json({ message: 'Invalid query conditions provided.' });
//     }

//     function isNumeric(num) {
//       return !isNaN(num);
//     }

//     let sql = "SELECT * FROM thasmai.appointments WHERE ";
//     for (let i = 0; i < queryConditions.length; i++) {
//       if(queryConditions[i].operator === "between"){

//       sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("-")[0]}" and "${queryConditions[i].value.split("-")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
        
//       }
//       else{
//       sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
//       }
//     }

//     // Apply pagination
//     const offset = (page - 1) * pageSize;
//     // sql += `LIMIT ${pageSize} OFFSET ${offset}`;

//     console.log(sql);

//     const results = await sequelize.query(sql);
//     console.log(results[0]);
    
//     // Assuming sequelize returns an array of rows in the first element of the results array
//     res.json({ results: results[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });


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
        countSql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("-")[0]}" and "${queryConditions[i].value.split("-")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
        sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("-")[0]}" and "${queryConditions[i].value.split("-")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : ""} `;
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

    let profilePic = null;
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

    const bankDetails = await BankDetails.findOne({ where: { UId } });
    const cycle = await meditation.findOne({ where: { UId }, attributes: ['cycle', 'day', 'session_num'] });

    const meditationlog= await timeTracking.findAll({
      where: { UId },
      order: [['createdAt', 'DESC']], 
      limit: 5, 
    });
    console.log(meditationlog)
    const meditationData = { ...cycle.dataValues  };
    
    return res.status(200).json({
      user,
      profilePic,
      bankDetails,
      meditationData,
      meditationlog
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
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
      attributes: ['UId', 'message', 'messageTime','messageDate', 'isAdminMessage'],
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


router.post('/expense', upload.single('invoice'), async (req, res) => {
  const { Expense_Date, expenseType, amount, description,emp_id } = req.body;
  const invoiceFile = req.file;

  try {
    if (!Expense_Date || !expenseType || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create a new ashram expense
    const newExpense = await ashramexpense.create({
      Expense_Date,
      expenseType,
      amount,
      description,
      emp_id
    });

    let invoiceUrl = '';
    if (invoiceFile) {
      const invoicePath = `invoices/${newExpense.id}/${invoiceFile.originalname}`;

      await storage.upload(invoiceFile.path, {
        destination: invoicePath,
        metadata: {
          contentType: invoiceFile.mimetype
        }
      });

      invoiceUrl = `gs://${storage.name}/${invoicePath}`;
    }

    await newExpense.update({ invoiceUrl });

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
      offset: offset,
      limit: pageSize
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

    // Fetch user details by UId from the reg table
    const user = await ashramexpense.findOne({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let invoiceUrl = null;
    if (user.invoiceUrl) {
      // If profilePicUrl exists, fetch the image URL from Firebase Storage
      const file = storage.file(user.invoiceUrl.split(storage.name + '/')[1]);
      const [exists] = await file.exists();
      if (exists) {
        invoiceUrl = await file.getSignedUrl({
          action: 'read',
          expires: '03-01-2500' // Adjust expiration date as needed
        });
      }
    }

    // Send the response with user data including profilePicUrl
    return res.status(200).json({
      user: {
        ...user.toJSON(),
        invoiceUrl
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// router.post('/expense-query', async (req, res) => {
//   try {
//     const queryConditions = req.body.queryConditions;
//     const page = req.body.page || 1; // Default to page 1 if not provided
//     const pageSize = req.body.pageSize || 10; // Default page size to 10 if not provided

//     console.log(queryConditions);

//     if (!queryConditions || !Array.isArray(queryConditions) || queryConditions.length === 0) {
//       return res.status(400).json({ message: 'Invalid query conditions provided.' });
//     }

//     function isNumeric(num) {
//       return !isNaN(num);
//     }

//     let sql = "SELECT * FROM sequel.ashramexpenses WHERE ";
//     for (let i = 0; i < queryConditions.length; i++) {
//       if(queryConditions[i].operator === "between"){

//       sql += `${queryConditions[i].field} ${queryConditions[i].operator}  "${queryConditions[i].value.split("/")[0]}" and "${queryConditions[i].value.split("/")[1]}" ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
        
//       }
//       else{
//       sql += `${queryConditions[i].field} ${queryConditions[i].operator} ${isNumeric(queryConditions[i].value) ? queryConditions[i].value : `'${queryConditions[i].value}'` } ${queryConditions[i].logicaloperator != "null" ? queryConditions[i].logicaloperator : "" } `;
//       }
//     }

//     // Apply pagination
//     const offset = (page - 1) * pageSize;
//     // sql += `LIMIT ${pageSize} OFFSET ${offset}`;

//     console.log(sql);

//     const results = await sequelize.query(sql);
//     console.log(results[0]);
    
//     // Assuming sequelize returns an array of rows in the first element of the results array
//     res.json({ results: results[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Internal server error.' });
//   }
// });

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

    
    // Get the last emp_id
    const lastEmpIdResult = await Admin.findOne({ order: [['emp_Id', 'DESC']] });
    const lastEmpId = lastEmpIdResult ? lastEmpIdResult.emp_Id : 0; // Handle case of no existing employees

    const newEmpId = lastEmpId + 1;

    const hashedPassword = await bcrypt.hash(password, 10); 
    const operator = await Admin.create({
      username,
      name,
      role,
      emp_Id: newEmpId,
      location,
      dateOfJoining,
      password : hashedPassword
    });

    return res.status(200).json({ message: 'operator created successfully' ,operator});
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'internal server error' });
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
    return res.status(200).json(operator);
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
    // Create a new video record
    const newVideo = await Video.create({
      playList_heading,
      Video_heading,
      videoLink,
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

    // Update the video record with the image URL
    await newVideo.update({ playList_image });

    res.status(201).json({ message: 'Video created successfully', video: newVideo });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/add-meditation-time', async (req, res) => {
  const { country, general_video, morning_time_from,morning_time_to, evening_time_from,evening_time_to, morning_video, evening_video } = req.body;

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

    res.status(201).json({ message: 'Meditation time added successfully', data: newMeditationTime });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

//////////////////////////zoom meeting/////////////////////////////





module.exports = router;



