const express = require('express');
const {reg} = require('../model/registration');
const BankDetails =require('../model/bankdetails');
const router = express.Router();
const { Op } = require("sequelize");
const axios = require('axios');
const Country =require('../model/country');
const session = require('express-session');
const Redis = require('ioredis');
const redis = new Redis();
const questions =require("../model/question");
const {Users,sequelize} = require('../model/validUsers');
const Meditation =require('../model/meditation');
const moment = require('moment');
const bcrypt = require('bcrypt');
const timeTracking = require('../model/timeTracking');
const Messages = require('../model/message');
const appointment = require("../model/appointment");
const nodemailer = require('nodemailer');
const meditation = require('../model/meditation');
const message = require('../model/message');
const Broadcast = require('../model/broadcast');
const applicationconfig = require('../model/applicationConfig');
const multer = require('multer');
const admin = require('firebase-admin');
const serviceAccount = require("../serviceAccountKey.json");

const storage = admin.storage().bucket();

// Multer configuration for handling file uploads
const upload = multer({ dest: 'uploads/' });


router.get('/getAllUsers', async (req, res) => {
  try {
    // Fetch all users from the reg table
    const users = await reg.findAll();

    // Map users to include profilePicUrl field
    const usersWithProfilePicUrl = await Promise.all(users.map(async user => {
      let profilePicUrl = null;
      if (user.profilePicUrl) {
        // If profilePicUrl exists, fetch the image URL from Firebase Storage
        const file = storage.file(user.profilePicUrl.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          profilePicUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
        }
      }
      // Return user details with profilePicUrl
      return {
        ...user.toJSON(),
        profilePicUrl
      };
    }));

    // Send the response with users data including profilePicUrl
    return res.status(200).json({ users: usersWithProfilePicUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



router.post('/countries', async (req, res) => {
    const data = req.body; // Assuming req.body is an array of objects

    if (Array.isArray(data)) {
        try {
            // Use Sequelize to bulk create the data in the database
            await Country.bulkCreate(data);

            res.status(200).send({ message: "Countries added to the database successfully" });
        } catch (error) {
            console.error(error);
            res.status(500).send({ message: "An error occurred while adding countries to the database" });
        }
    } else {
        res.status(400).send({ message: "Invalid data format. Please send an array of objects." });
    }
});

router.get('/countrieslist', async (req, res) => {
    try {
      const countries = await Country.findAll({
        order: [['name', 'ASC']], // Order by the 'name' field in ascending order
      });
  
      res.json(countries);
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred while fetching countries' });
    }
  });


// router.post('/registerUser', async (req, res) => {
//     const { email, phone } = req.body;

//     try {
//         const existingUser = await reg.findOne({
//             where: {
//                 [Op.or]: [
//                     { email: email },
//                     { phone: phone }
//                 ]
//             }
//         });

//         if (existingUser) {

//             if (existingUser.email === email) {
//                 return res.status(400).json({ message: "Email already exists" , status:'false',flag :'email'});
//             } else {
//                 return res.status(400).json({ message: "Phone number already exists",status:'false',flag :'phone' });
//             }
//         } else {
//             // User does not exist, generate a new OTP
//             const otp = generateOTP();
//             console.log(otp);

//             // Save the OTP in Redis with a key that includes the user's phone number
//             const redisKey = `otp:${phone}`;
//             await redis.setex(redisKey, 600, otp);

//             // Send OTP to the user via SMS
//             const otpRequest = {
//                 method: 'get',
//                 url: `https://www.fast2sms.com/dev/bulkV2?authorization=aKVbUigWHc8CBXFA9rRQ17YjD4xhz5ovJGd6Ite3k0mnSNuZPMolFREdzJGqw8YVAD7HU1OatPTS6uiK&variables_values=${otp}&route=otp&numbers=${phone}`,
//                 headers: {
//                     Accept: 'application/json'
//                 }
//             };

//             await axios(otpRequest);

//             return res.status(200).json({ message: "OTP sent successfully" });
//         }
//     } catch (error) {
//         console.error("Error registering user:", error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// });


router.post('/registerUser', async (req, res) => {
    const { email, phone } = req.body;

    try {
        const existingUser = await reg.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { phone: phone }
                ]
            }
        });

        if (existingUser) {

            if (existingUser.email === email) {
                return res.status(400).json({ message: "Email already exists" , status:'false',flag :'email'});
            } else {
                return res.status(400).json({ message: "Phone number already exists",status:'false',flag :'phone' });
            }
        } 
        else{
            return res.status(200).json({ message: "OTP sent successfully" });
        }
    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



function generateOTP() {
    // Generate a random 4-digit OTP
    return Math.floor(1000 + Math.random() * 9000).toString();
}

router.get('/displayDataFromRedis/:key', async (req, res) => {
    const key = req.params.key;

    try {
        // Retrieve data from Redis using the provided key
        const data = await redis.get(key);

        if (data) {
            // If data exists, parse it and send it in the response
            const parsedData = JSON.parse(data);
            res.status(200).json(parsedData);
        } else {
            res.status(404).json({ message: 'Data not found in Redis' });
        }
    } catch (error) {
        console.error('Error retrieving data from Redis:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// router.post("/verify_otp", async (req, res) => {
//     console.log("<........verify OTP user........>");

//     const { first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP } = req.body;
//     console.log(first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP)

//     console.log("Phone: " + phone);
//     console.log("OTP: " + OTP);

//     try {
//         // Retrieve the stored OTP from Redis
//         const redisKey = `otp:${phone}`;
//         const storedOTP = await redis.get(redisKey);

//         if (!storedOTP) {
//             return res.status(401).send("OTP not found in Redis");
//         }

//         // Verify the OTP
//         if (storedOTP === OTP) {
//             const hashedPassword = await bcrypt.hash(phone, 10);
//             const maxUserId = await reg.max('userId');
//             const userId = maxUserId + 1;
//             // Update the user record
//          //   const user = await reg.findOne({ where: { phone } });

//             // if (!user) {
//             //     return res.status(404).send("User not found");
//             // }

//             // Update user data
//             const user = await reg.create({
//             first_name,
//             last_name,
//             email,
//             DOB,
//             gender,
//             phone,
//             country,
//             reference,
//             languages,
//             remark,
//             userId,
//             DOJ : new Date(),
//             expiredDate : calculateExpirationDate(),
//             password : hashedPassword, // Store the hashed password
//             verify : 'true'
//         });
//             // Save the updated user data
//             await user.save();

//             // Create a record in the BankDetails table
//             await BankDetails.create({
//                 AadarNo: 0,
//                 IFSCCode: "",
//                 branchName: "",
//                 accountName: "",
//                 accountNo: 0,
//                 regId: user.id // Assuming regId is the foreign key in BankDetails
//             });

//             // Delete the OTP from Redis after successful verification
//             await redis.del(redisKey);

//             const responseData = {
//                 message: "Success",
//                 data: {
//                     id: user.id,
//                     first_name: user.first_name,
//                     last_name: user.last_name,
//                     DOJ: user.DOJ,
//                     expiredDate: user.expiredDate,
//                     userId: user.userId
//                 }
//             };

//             return res.status(200).json(responseData);
//         } else {
//             // Respond with an error message if OTP is invalid
//             return res.status(400).send("Invalid OTP");
//         }
//     } catch (err) {
//         console.error("<........error........>", err);
//         return res.status(500).send(err.message || "An error occurred during OTP verification");
//     }
// });

// router.post("/verify_otp", async (req, res) => {
//     console.log("<........verify OTP user........>");
//     try {
//     const { first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP } = req.body;
//     //console.log(first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP)

//     console.log("Phone: " + phone);
//     console.log("OTP: " + OTP);
//     const storedOTP = "1111"
//     console.log(first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP,storedOTP)

//     if(storedOTP == OTP){
//         console.log(".......");
//         const hashedPassword = await bcrypt.hash(phone, 10);
//             const maxUserId = await reg.max('userId');
//             const userId = maxUserId + 1;
//             const user = await reg.create({
//                 first_name,
//                 last_name,
//                 email,
//                 DOB,
//                 gender,
//                 phone,
//                 country,
//                 reference,
//                 languages,
//                 remark,
//                 userId,
//                 DOJ : new Date(),
//                 expiredDate : calculateExpirationDate(),
//                 password : hashedPassword, // Store the hashed password
//                 verify : 'true'
//             });
//                 // Save the updated user data
//                 await user.save();

//                 // Create a record in the BankDetails table
//                 await BankDetails.create({
//                     AadarNo: 0,
//                     IFSCCode: "",
//                     branchName: "",
//                     accountName: "",
//                     accountNo: 0,
//                     regId: user.id // Assuming regId is the foreign key in BankDetails
//                 });
//                 const responseData = {
//                     message: "Success",
//                     data: {
//                         id: user.id,
//                         first_name: user.first_name,
//                         last_name: user.last_name,
//                         DOJ: user.DOJ,
//                         expiredDate: user.expiredDate,
//                         userId: user.userId
//                     }
//                 };
  
//                 return res.status(200).json(responseData);
//             } else {
//                 // Respond with an error message if OTP is invalid
//                 return res.status(400).send("Invalid OTP");
//             }
//         } catch (err) {
//             console.error("<........error........>", err);
//             return res.status(500).send(err.message || "An error occurred during OTP verification");
//         }
//     });


router.post("/verify_otp", async (req, res) => {
  console.log("<........verify OTP user........>");
  try {
    const { first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP } = req.body;

    console.log("Phone: " + phone);
    console.log("OTP: " + OTP);
    const storedOTP = "1111";
    console.log(first_name, last_name, email, DOB, gender, country, phone, reference, languages, remark, OTP, storedOTP);

    if (storedOTP == OTP) {
      console.log(".......");

      const hashedPassword = await bcrypt.hash(phone, 10);
      const maxUserId = await reg.max('UId');
      const UId = maxUserId + 1;
      const currentDate = new Date().toJSON().split('T')[0]; // Get the current date in "YYYY-MM-DD" format
console.log("..................currentDate.",currentDate)
      const user = await reg.create({
        first_name,
        last_name,
        email,
        DOB,
        gender,
        phone,
        country,
        reference,
        languages,
        remark,
        UId,
        DOJ: currentDate, // Set only the date portion
        expiredDate: calculateExpirationDate(),
        password: hashedPassword, // Store the hashed password
        verify: 'true'
      });

   
            // console.log("UIds.dataValues.UId",[0].reg);
       
   // })();

      // Create a record in the BankDetails table
      await BankDetails.create({
        AadarNo: "",
        IFSCCode: "",
        branchName: "",
        accountName: "",
        accountNo: "",
        UId: user.UId // Assuming regId is the foreign key in BankDetails
      });

      const responseData = {
        message: "Success",
        data: {
          id: user.UserId,
          first_name: user.first_name,
          last_name: user.last_name,
          DOJ: user.DOJ, // The stored date without the time component
          expiredDate: user.expiredDate,
          UId: user.UId 
        }
      };

      return res.status(200).json(responseData);
    } else {
      // Respond with an error message if OTP is invalid
      return res.status(400).send("Invalid OTP");
    }
  } catch (err) {
    console.error("<........error........>", err);
    return res.status(500).send(err.message || "An error occurred during OTP verification");
  }
});



function calculateExpirationDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d;
}

router.get('/listName/:UId', async (req, res) => {
  try {
    const { UId } = req.params;

    // Find the member with the provided UId
    const selectedMember = await reg.findOne({
      where: {
        UId: UId,
      },
    });

    if (!selectedMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    // Fetch the next 4 members including the selected member based on the UId in descending order
    const members = await reg.findAll({
      where: {
        UId: {
          [Op.lte]: selectedMember.UId, // Less than or equal to the selected member's UId
        },
        // Add additional conditions here
        // Example: status: 'active', age: { [Op.gt]: 18 }
      },
      order: [['UId', 'DESC']], // Order by UId in descending order
      limit: 5, // Limit to 5 members
      attributes: ['first_name', 'last_name'], // Include only these attributes in the result
    });

    const processedData = members.map(user => ({
      name: `${user.first_name} ${user.last_name}`,
    }));

    res.status(200).json(processedData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});



// router.get('/listName/:UId', async (req, res) => {
//   try {
//       const { UId } = req.params;

//       // Find the member with the provided id
//       const selectedMember = await reg.findByPk(UId);

//       if (!selectedMember) {
//           return res.status(404).json({ error: 'Member not found' });
//       }

//       // Fetch the next 4 members including the selected member based on the id in ascending order
//       const members = await reg.findAll({
//           where: {
//             UId: {
//                   [Op.gte]: selectedMember.UserId, // Greater than or equal to the selected member's id
//               },
//           },
//           order: [['UId', 'DESC']], 
//           limit: 5, 
//           attributes: ['first_name', 'last_name'], 
//       });

//       const processedData = members.map(user => ({
//           name: `${user.first_name} ${user.last_name}`,
//       }));

//       res.status(200).json(processedData);
//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: 'An error occurred' });
//   }
// });

/////////////////////////////////// USER APP \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

// router.post('/requestPasswordReset', async (req, res) => {
//         const { email } = req.body;
    
//         try {
//             // Find the user with the provided email
//             const user = await reg.findOne({ where: { email: email } });
    
//             if (!user) {
//                 return res.status(404).json({ message: "User not found" });
//             } else {
//             // User does not exist, generate a new OTP
//             const otp = generateOTP();

//             // Save the OTP in Redis with a key that includes the user's phone number
//             const redisKey = `reqotp:${user.phone}`;
//             await redis.setex(redisKey, 600, otp);

//             // Send OTP to the user via SMS
//             const otpRequest = {
//                 method: 'get',
//                 url: `https://www.fast2sms.com/dev/bulkV2?authorization=aKVbUigWHc8CBXFA9rRQ17YjD4xhz5ovJGd6Ite3k0mnSNuZPMolFREdzJGqw8YVAD7HU1OatPTS6uiK&variables_values=${otp}&route=otp&numbers=${user.phone}`,
//                 headers: {
//                     Accept: 'application/json'
//                 }
//             };

//             await axios(otpRequest);

//             return res.status(200).json({ message: "OTP sent successfully",otp : otp });
//         }
//     } catch (error) {
//         console.error("Error registering user:", error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// });





router.post('/requestPasswordReset', async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user with the provided email
        const user = await reg.findOne({ where: { email: email } });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        } else {
        // // User does not exist, generate a new OTP
        // const otp = generateOTP();

        // // Save the OTP in Redis with a key that includes the user's phone number
        // const redisKey = `reqotp:${user.phone}`;
        // await redis.setex(redisKey, 600, otp);

        // // Send OTP to the user via SMS
        // const otpRequest = {
        //     method: 'get',
        //     url: `https://www.fast2sms.com/dev/bulkV2?authorization=aKVbUigWHc8CBXFA9rRQ17YjD4xhz5ovJGd6Ite3k0mnSNuZPMolFREdzJGqw8YVAD7HU1OatPTS6uiK&variables_values=${otp}&route=otp&numbers=${user.phone}`,
        //     headers: {
        //         Accept: 'application/json'
        //     }
        // };

        // await axios(otpRequest);

        return res.status(200).json({ message: "OTP sent successfully"});
    }
} catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
}
});

// router.post('/resetPassword', async (req, res) => {
//     const { email, otp, new_password } = req.body;

//     try {
//         // Find the user with the provided email in the 'reg' schema
//         const regUser = await reg.findOne({ where: { email: email } });

//         if (!regUser) {
//             return res.status(404).json({ message: "User not found" });
//         }

//         // Retrieve the stored OTP from Redis
//         const redisKey = `reqotp:${regUser.phone}`;
//         const storedOTP = await redis.get(redisKey);

//         if (!storedOTP) {
//             return res.status(401).json({message:"Otp has expired" });``
//         }

//         if (storedOTP === otp) {
//             const hashedPassword = await bcrypt.hash(new_password, 10);

//             // Update password and set classAttended to true in the 'reg' table
//             await reg.update({
//                 password: hashedPassword,
//                 classAttended: true,
//             }, {
//                 where: { email: regUser.email },
//             });

//             // Delete the OTP from Redis after successful verification
//             await redis.del(redisKey);

//             return res.status(200).json({ message: "Password reset successfully" });
//         } else {
//             // Respond with an error message if OTP is invalid
//             return res.status(400).send("Invalid OTP");
//         }
//     } catch (err) {
//         console.error("Error resetting password:", err);
//         return res.status(500).send(err.message || "An error occurred during password reset");
//     }
// });



router.post('/resetPassword', async (req, res) => {
    const { email, otp, new_password } = req.body;

    try {
        // Find the user with the provided email in the 'reg' schema
        const regUser = await reg.findOne({ where: { email: email } });

        if (!regUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const storedOTP = "1234";
        if (storedOTP === otp) {
            const hashedPassword = await bcrypt.hash(new_password, 10);

            // Update password and set classAttended to true in the 'reg' table
            await reg.update({
                password: hashedPassword,
                classAttended: true,
            }, {
                where: { email: regUser.email },
            });


            return res.status(200).json({ message: "Password reset successfully" });
        } else {
            // Respond with an error message if OTP is invalid
            return res.status(400).json({message:"Invalid OTP"});
        }
    } catch (err) {
        console.error("Error resetting password:", err);
        return res.status(500).send(err.message || "An error occurred during password reset");
    }
});


const sessionMiddleware = session({
    secret: '8be00e304a7ab94f27b5e5172cc0f3b2c575e87d',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  });
  
  router.use(sessionMiddleware);

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // Validate email and password
  
    
  if (!email || !password) {
      return res.status(400).json({ message:'Email and password are required' });
    }
  
    try {
        const user = await reg.findOne({
            where: {
                email: email,
                classAttended: true, // Check if classAttended is true
            },
        });
      if (!user) {
        return res.status(404).json({ message: 'Invalid email !' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect password !' });
      }
  
      // Create session and store user ID
      req.session.UId = user.UId;
      //xconsole.log(res)
      res.json({
        message: 'Login successful',
        user: {
          UserId: user.UserId,
          email: user.email,
          first_name: user.first_name,
          last_name : user.last_name,
          UId : user.UId,
          DOJ : user.DOJ,
          expiredDate :user.expiredDate
          // Don't send sensitive information like password
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  router.get('/getUserById/:UId', async (req, res) => {
    try {
      const { UId } = req.params;
  
      // Fetch user details by UId from the reg table
      const user = await reg.findOne({ where: { UId } });
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      let profilePicUrl = null;
      if (user.profilePicUrl) {
        // If profilePicUrl exists, fetch the image URL from Firebase Storage
        const file = storage.file(user.profilePicUrl.split(storage.name + '/')[1]);
        const [exists] = await file.exists();
        if (exists) {
          profilePicUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
        }
      }
  
      // Send the response with user data including profilePicUrl
      return res.status(200).json({
        user: {
          ...user.toJSON(),
          profilePicUrl
        }
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  router.put('/updateUser/:UId', upload.single('profilePic'), async (req, res) => {
    const UId = req.params.UId;
    const userData = req.body;
    const profilePicFile = req.file;
  
    try {
      // Check if the user is authenticated
      if (!UId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      // Find the user by UId
      const user = await reg.findOne({ where: { UId } });
  
      // Update user details
      if (user) {
        // Update all fields provided in the request, excluding the profilePic field
        delete userData.profilePic; // Remove profilePic from userData
        await user.update(userData);
  
        // Fetch current profile picture URL
        let currentProfilePicUrl = user.profilePicUrl;
  
        // Store or update profile picture in Firebase Storage
        let profilePicUrl = currentProfilePicUrl; // Default to current URL
        if (profilePicFile) {
          const profilePicPath = `profile_pictures/${UId}/${profilePicFile.originalname}`;
  
          // Upload new profile picture to Firebase Storage
          await storage.upload(profilePicFile.path, {
            destination: profilePicPath,
            metadata: {
              contentType: profilePicFile.mimetype
            }
          });
  
          // Get the URL of the uploaded profile picture
          profilePicUrl = `gs://${storage.name}/${profilePicPath}`;
  
          // Delete the current profile picture from Firebase Storage
          if (currentProfilePicUrl) {
            const currentProfilePicPath = currentProfilePicUrl.split(storage.name + '/')[1];
            await storage.file(currentProfilePicPath).delete();
          }
        }
  
        // Update user's profilePicUrl in reg table
        await user.update({ profilePicUrl });
  
        return res.status(200).json({ message: 'User details updated successfully' });
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  


router.get('/reference/:UId', async (req, res) => {
  const UId = req.params.UId;

  try {
      const user = await reg.findOne({
          where: { UId },
          attributes: ['first_name', 'last_name'],
      });

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      const fullName = `${user.first_name} ${user.last_name}`.trim();
      res.json({ full_name: fullName });
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/list-questions', async (req, res) => {
    try {
      const Questions = await questions.findAll();
      res.json(Questions);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });

router.get('/user-details/:userId', async (req, res) => {
  const UId = req.params.userId;

  try {
      // Fetch details from reg table
      const userDetails = await reg.findOne({
          where: { UId },
      });

      if (!userDetails) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Fetch details from BankDetails table
      const bankDetails = await BankDetails.findOne({
          where: { UId },
      });

      // Combine the data from both tables
      const combinedData = {
          userDetails: userDetails.toJSON(),
          bankDetails: bankDetails ? bankDetails.toJSON() : null,
      };

      res.json(combinedData);
  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.delete('/delete-user/:phone', async (req, res) => {
    const phone = req.params.phone;

    try {
        // Find the user based on the phone number
        const user = await reg.findOne({ where: { phone } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete the user
        await user.destroy();

        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.delete('/deleteuser/:phone', async (req, res) => {
    const phone = req.params.phone;
    try {
        // Find the user based on the phone number
        const user = await reg.findOne({ where: { phone } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
const bank = await bankDetails.findOne({ where: {regId: user.id} });
await user.destroy();
if (bank) {
    await bank.destroy();
}
return res.status(200).json({ message: 'User deleted successfully' });
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});

// router.post('/meditation', async (req, res) => {
//     try {
//       const { userId } = req.session;
//         const {startdatetime, stopdatetime } = req.body;

//         console.log('Received userId:', userId);
//         console.log('Received startdatetime:', startdatetime);
//         console.log('Received stopdatetime:', stopdatetime);

//         // Check if userId exists in the reg table
//         const userExists = await Users.findOne({ where: { UId : userId } });
//         if (!userExists) {
//             return res.status(404).json({ error: 'User not found in reg table' });
//         }

//         const refStartDate = moment(`${startdatetime}`, "YYYY-MM-DD HH:mm:ss", true);
//         const refFutureDate = refStartDate.clone().add(45, "minutes");
//         const refStopDate = moment(`${stopdatetime}`, "YYYY-MM-DD HH:mm:ss", true);

//         console.log('Parsed startdatetime:', refStartDate.format('YYYY-MM-DD HH:mm:ss'));
//         console.log('Parsed stopdatetime:', refStopDate.format('YYYY-MM-DD HH:mm:ss'));

//         const difference = refStopDate.diff(refStartDate, 'minutes');
//         if(difference>=90){
//           ismeditated = 1
//         }
//         else{
//           ismeditated = 2
//         }

//         console.log('Difference:', difference);
//         const TimeTracking = await timeTracking.create({
//             userId,
//             med_starttime: refStartDate.format('YYYY-MM-DD HH:mm:ss'),
//             med_stoptime:refStopDate.format('YYYY-MM-DD HH:mm:ss'),
//             timeEstimate:difference,
//             ismeditated
//         });
//         await TimeTracking.save();

//         // Check if there is an existing record for the userId
//         const existingMeditationRecord = await Meditation.findOne({ where: { userId } });

//         if (existingMeditationRecord) {
//             // Update the existing record
//             existingMeditationRecord.med_starttime = refStartDate.format('YYYY-MM-DD HH:mm:ss');
//             existingMeditationRecord.med_stoptime = refStopDate.format('YYYY-MM-DD HH:mm:ss');
//             existingMeditationRecord.med_endtime = refFutureDate.format('YYYY-MM-DD HH:mm:ss');

//             if (difference >= 45) {
//                 existingMeditationRecord.session_num += 1 ;
//                 if(existingMeditationRecord.session_num > 2) {
//                     existingMeditationRecord.session_num = 1; 
//             }}

//             if (existingMeditationRecord.session_num === 2) {
//                 existingMeditationRecord.day += 1;
//                 //existingMeditationRecord.session_num = 0;
//             }

//             if (existingMeditationRecord.day === 15) {
//                 existingMeditationRecord.cycle += 1;
//                 existingMeditationRecord.day = 0;
//             }

//             await existingMeditationRecord.save();
//             return res.status(200).json({ message: 'Meditation time updated successfully' });
//         } else {
//             // Create a new record if there is no existing record
//             const meditationRecord = await Meditation.create({
//                 userId,
//                 med_starttime: refStartDate.format('YYYY-MM-DD HH:mm:ss'),
//                 med_stoptime: refStopDate.format('YYYY-MM-DD HH:mm:ss'),
//                 med_endtime: refFutureDate.format('YYYY-MM-DD HH:mm:ss'),
//                 session_num: 0,
//                 day: 0,
//                 cycle: 0,
//             });

//             if (difference >= 45) {
//                 meditationRecord.session_num += 1;
//             }

//             if (meditationRecord.session_num === 2) {
//                 meditationRecord.day += 1;
//                 meditationRecord.session_num = 0;
//             }

//             if (meditationRecord.day === 41) {
//                 meditationRecord.cycle += 1;
//                 meditationRecord.day = 0;
//             }

//             await meditationRecord.save();
//             return res.status(200).json({ message: 'Meditation time inserted successfully' });

//         }

//     } catch (error) {
//         console.error('Error:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });
 
router.post('/meditation', async (req, res) => {
  try {
   // const { UId } = req.body;
      const { UId } = req.session;
      const { startdatetime, stopdatetime } = req.body;

      console.log('Received UId:', UId);
      console.log('Received startdatetime:', startdatetime);
      console.log('Received stopdatetime:', stopdatetime);

      // Check if UId exists in the reg table
      const userExists = await Users.findOne({ where: { UId } });
      if (!userExists) {
          return res.status(404).json({ error: 'User not found in reg table' });
      }

      const refStartDate = moment(`${startdatetime}`, "YYYY-MM-DD HH:mm:ss", true);
      const refFutureDate = refStartDate.clone().add(45, "minutes");
      const refStopDate = moment(`${stopdatetime}`, "YYYY-MM-DD HH:mm:ss", true);

      console.log('Parsed startdatetime:', refStartDate.format('YYYY-MM-DD HH:mm:ss'));
      console.log('Parsed stopdatetime:', refStopDate.format('YYYY-MM-DD HH:mm:ss'));

      const difference = refStopDate.diff(refStartDate, 'minutes');
      let ismeditated;

      if (difference >= 90) {
          ismeditated = 1;
      } else {
          ismeditated = 2;
      }

      console.log('Difference:', difference);
      const TimeTracking = await timeTracking.create({
          UId,
          med_starttime: refStartDate.format('YYYY-MM-DD HH:mm:ss'),
          med_stoptime: refStopDate.format('YYYY-MM-DD HH:mm:ss'),
          timeEstimate: difference,
          ismeditated
      });
      await TimeTracking.save();

      // Check if there is an existing record for the UId
      const existingMeditationRecord = await Meditation.findOne({ where: { UId } });

      if (existingMeditationRecord) {
          // Update the existing record
          existingMeditationRecord.med_starttime = refStartDate.format('YYYY-MM-DD HH:mm:ss');
          existingMeditationRecord.med_stoptime = refStopDate.format('YYYY-MM-DD HH:mm:ss');
          existingMeditationRecord.med_endtime = refFutureDate.format('YYYY-MM-DD HH:mm:ss');

          if (difference >= 45) {
              existingMeditationRecord.session_num += 1;
              if (existingMeditationRecord.session_num > 2) {
                  existingMeditationRecord.session_num = 1;
              }
          }

          if (existingMeditationRecord.session_num === 2) {
              existingMeditationRecord.day += 1;
              //existingMeditationRecord.session_num = 0;
          }

          if (existingMeditationRecord.day === 41) {
              existingMeditationRecord.cycle += 1;
              existingMeditationRecord.day = 0;
          }

          await existingMeditationRecord.save();
          return res.status(200).json({ message: 'Meditation time updated successfully' });
      } else {
          // Create a new record if there is no existing record
          const meditationRecord = await Meditation.create({
              UId,
              med_starttime: refStartDate.format('YYYY-MM-DD HH:mm:ss'),
              med_stoptime: refStopDate.format('YYYY-MM-DD HH:mm:ss'),
              med_endtime: refFutureDate.format('YYYY-MM-DD HH:mm:ss'),
              session_num: 0,
              day: 0,
              cycle: 0,
          });

          if (difference >= 45) {
              meditationRecord.session_num += 1;
          }

          if (meditationRecord.session_num === 2) {
              meditationRecord.day += 1;
              meditationRecord.session_num = 0;
          }

          if (meditationRecord.day === 41) {
              meditationRecord.cycle += 1;
              meditationRecord.day = 0;
          }

          await meditationRecord.save();
          return res.status(200).json({ message: 'Meditation time inserted successfully' });

      }

  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// router.post('/messages', async (req, res) => {
//     try {
//       const { userId } = req.session;
//         const { message,messageTime} = req.body;

//         // Check if the user exists
//         const existingUser = await Users.findOne({ where: {UId : userId } });
//         if (!existingUser) {
//             return res.status(404).json({ error: 'User not found' });
//         }

//         // Create a new message record
//         const newMessage = await Messages.create({
     
//             userId,
//             message,
//             messageTime
//         });

//         // Save the new message record
//         await newMessage.save();

//         return res.status(200).json({ message: 'Message created successfully' });
//     } catch (error) {
//         console.error('Error:', error);
//         return res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


router.post('/messages', async (req, res) => {
  try {
      const { UId } = req.session;
      const { message, messageTime,message_priority,isAdminMessage } = req.body;

      // Check if the user exists
      const existingUser = await Users.findOne({ where: { UId } });
      if (!existingUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Create a new message record
      const newMessage = await Messages.create({
          UId,
          message,
          messageTime,
          message_priority,
          isAdminMessage
      });

      // Save the new message record
      await newMessage.save();

      return res.status(200).json({ message: 'Message created successfully' });
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post("/appointment", async (req, res) => {
  try {
      
      const {phone, appointmentDate, num_of_people, pickup, room, from, emergencyNumber, appointment_time, appointment_reason , register_date } = req.body;

      const existingUser = await reg.findOne({ where: { phone } });
      if (!existingUser) {
          return res.status(404).json({ error: 'User not found' });
      }

      const newappointment = await appointment.create({
          UId : existingUser.UId,
          phone,
          appointmentDate,
          num_of_people,
          pickup,
          room,
          from,
          emergencyNumber,
          appointment_time,
          appointment_reason,
          register_date,
          user_name : existingUser.first_name +" "+ existingUser.last_name,
          appointment_status:"pending",

      });

      await newappointment.save();

      return res.status(200).json({ message: 'Appointment has been allocated successfully! We will notify guruji soon.' });
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/send-email', async (req, res) => {
  try {
    const {first_name,last_name,UId,DOJ,expiredDate} = req.body
    const to = req.body.to
    const config = await applicationconfig.findOne(); // Retrieve a single row from the table
    const prompt = config ? config.reg_email_prompt : null;
    // const reg_email_prompt = applicationconfig.reg_email_prompt;
    console.log(prompt)
    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.forwardemail.net',
      port: 465,
      secure: true,
      service: 'gmail',
      auth: {
 
        user: 'thasmaistarlife@gmail.com',
        pass: 'ndkj dxdq kxca zplg',
      },
    });
 
    // Define email options
    const mailOptions = {
      from: 'thasmaistarlife@gmail.com',
      to,
      subject: 'Thasmai Star Life : Registration Success Email',
      text: 'Your registration is complete!',
      html: `
 
      <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Kalnia:wght@100;200;300;400;500;600;700&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
      <style>
          .headers {
              text-align: center;
              height: auto;
              padding: 20px 0;
          }
          .message {
              text-align: justify;
              width: 90%;
              max-width: 400px;
              margin: 0 auto;
              padding: 10px;
              box-sizing: border-box;
          }
          .message p {
              margin: 5px 0;
          }
 
          .whatsapp-icon {
              height: 40px;
              width: 40px;
              border-radius: 100%;
         }
 
          .whatsapp-link {
              margin-top: 20px;
              color: rgb(37, 61, 183);
              font-weight: 600;
              font-size: 1rem;
          } 
 
      .card-container{
 
        text-align: center;
 
      }
 
 
      .reg-success-card {
        background-image: url('https://lh3.googleusercontent.com/u/0/drive-viewer/AEYmBYTWA0bZqZRaGcd2yXoQu_AzBPv36ZDRHbeYm7rcVap0nQ1Dk16LUmtFnuWfmfdMGGkrVmZpw2Hg37ay2o6qgG-WAV6D=w1920-h922');
        background-repeat: no-repeat;
        background-color: rgb(62, 61, 91);
        background-size: cover;
        border-radius: 19px;
        height: 240px;
        width: 400px;
        text-align: center;
        margin:50px auto;
      }
 
      .reg-success-card-head {
        margin: 0;
        padding: 3% 0 0;
        height: 30%;
        width: 100%;
      }
 
      .reg-card-number {
        text-align: left;
        color: white;
        padding-left: 25px;
      }
 
      .reg-card-number p {
        font-size: 0.6rem;
        margin: 0;
        text-wrap: nowrap;
      }
 
      .reg-card-number h1 {
        font-size: 1.1rem;
        font-weight: bold;
        margin: 0;
      }
 
      .reg-card-logo {
        width: 12%;
        padding-right: 25px;
      }
 
      .logo-container{
        text-align: right;
      }
 
      .reg-success-card-content {
        height: 30%;
      }
 
      .content-chip{
        width: 20%;
      }
 
      .chip {
        width: 40%;
      }
 
      .center-content{
        text-align: left;
        width: 60%;
      }
 
      .reg-success-card-content div {
        margin: 0;
        padding: 0;
        text-align: center;
      }
 
      .reg-card-star-life-logo {
        width: 35%;
        margin: 0;
        padding: 0;
      }
 
      .reg-card-contact-number {
        font-size: 0.8rem;
        font-weight: bold;
        margin: 0;
        color: #fff;
      }
 
      .reg-card-success-message {
        color: #f4e893;
        font-size: 1.1rem;
        margin: 3px 0;
      }
 
      .empty-cell{
        width: 20%;
      }
 
      .reg-success-card-footer {
        margin: 0;
        padding: 0 0 3%;
        width: 100%;
        height: 40%;
      }
 
      .card-holder-group {
        text-align: left;
        color: white;
        padding-left: 25px;
      }
 
      .card-holder-name p {
        font-size: 0.6rem;
        margin: 0;
      }
 
      .card-holder-name h2 {
        font-size: 1.1rem;
        font-weight: bold;
        margin: 0;
      }
 
      .reg-card-validity{
       padding-right: 25px;
       text-align: right;
      }
 
      .reg-card-validity p {
        font-size: 0.6rem;
        margin: auto;
        color: #ffffff;
      }
 
 
 
 
      </style>
  </head>
 
  <body>
  <div class="headers">
      <h1 style="margin: 0;">Welcome to Thasmai</h1>
      <p style="margin: 5px 0;">Sathyam Vada || Dharmam Chara</p>
  </div>
  <div class="message" style="color: #4F4539;">
      <p>Hi ${first_name} ${last_name},</p>
      <p>Congratulations! Registration complete. Your register number: ${UId}.</p>
      <p>To receive further details about the introduction class (zoom session): Please send a “hi” to number ‘+91 9900829007’. Thank you for taking the first step.</p>
 
      <p class="whatsapp-link"></p>
      <img class="whatsapp-icon" src="https://lh3.googleusercontent.com/u/0/drive-viewer/AEYmBYSnIUgsI2fYvK6_gntrPiT71yOQNKVBOjFaRj6IBkTqFB6XeOj2ucTd_zVvb8P_mCNQTc44g-MWkvmQctQ0q9-7WXEzyw=w1920-h922" alt="">
 
          <a class="whatsapp-link" href="https://wa.me/+919008290027">Click here to Join Whatsapp Group</a>
      </p>
  </div>
 
 <!-- ertyu--------------------------------------------------------------------------- -->
 <div class="card-container">
 
 
 
  <div class="reg-success-card">
    <table  class="reg-success-card-head">
      <tr>
      <td class="reg-card-number">
        <p>Card Number</p>
        <!-- <h1>{data.userId}</h1> -->
        <h1>${UId}</h1>
      </td>
         <td class="logo-container">
      <img class="reg-card-logo" src="https://lh3.googleusercontent.com/u/0/drive-viewer/AEYmBYSV8OQTMueB3tVPRLnS4G7ogutUDfJ8bxG0aSVEgoCF4ULoC0kMv1jqRjuwX-39JSXFw34gAhoiARJ444BG7wiyiaW4=w1227-h922" alt="Thasmai logo" />
    </td> 
    </tr>
    </table>
 
    <table class="reg-success-card-content">
      <tr>
        <td class="content-chip">
      <img class="chip" src="https://lh3.googleusercontent.com/u/0/drive-viewer/AEYmBYSDv_6wQFPu6a321tH8lrNiPqVRhyOKOiWiTwK4dFhf7LqPyqu3JHwoUjeeZK4Lf2PwKqhcMHATBrJ7i_uVzbNcNpbZHQ=w1920-h922" alt="chip" />
    </td>
    <td class="center-content">
      <div>
        <img class="reg-card-star-life-logo" src="https://lh3.googleusercontent.com/u/0/drive-viewer/AEYmBYQNvO2hAP--VETE3_IPAsKI5McAw4EhsbXPVCbTbvfbN9k_jLs4lHTJWhWJwweNuRdxERjL5p8PfXPfO4X28PS_IYVF_g=w1920-h922" alt="star-life-img" />
        <h3 class="reg-card-success-message">Registration Successful</h3>
        <p class="reg-card-contact-number">
          <span>Contact: +91 9008290027</span>
        </p>
        <!-- <a class="success-page-link" href="/registrationSuccess">OK</a> -->
      </div>
    </td>
    <td class="empty-cell"></td>
    </tr>
 
    </table>
 
    <table class="reg-success-card-footer">
      <tr>
      <td class="card-holder-group">
        <div class="card-holder-name">
          <p>Cardholder Name</p>
          <!-- <h2>{data.first_name} {data.last_name}</h2> -->
          <h2>${first_name} ${last_name}</h2>
          <!-- <p>DOJ: {dayOfJoining + "/" + monthOfJoining + "/" + yearOfJoining}</p> -->
          <p>DOJ:${DOJ}</p>
        </div>
      </td>
 
      <td class="reg-card-validity">
        <!-- <p>VALID: {expiry.day}/{expiry.month}/{expiry.year}</p> -->
        <p>VALID:${expiredDate}</p>
      </td>
    </tr>
    </table>
  </div>
   <!--end of card container--> 
 
 
   <div>
  <p>Click the link below to download our app</p>
  <a href="https://drive.google.com/file/d/1QkYpKY_v6epzn9SmkP7stkhKFp4to_DZ/view" target = "_blank" style = "width:100px; height:20px; padding :10px; background-color:  #219cc9; text-decoration: none; color:white;">Download</a>
 </div>
</body>`,
    };
 
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    return res.status(200).json({ message: 'Email sent successfully' });
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


  router.get('/user-details', async (req, res) => {
    try {
        const { UId } = req.session;
//const UId = req.body.UId;
console.log('UId:', UId);
        if (!UId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const user = await reg.findOne({
            attributes: ['first_name', 'last_name', 'UId', 'DOJ', 'expiredDate'],
            where: { UId },
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

  
router.get('/meditation-detail', async (req, res) => {
  try {
       const { UId } = req.session;
      //const UId = req.body.UId;
      if (!UId) {
          return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await meditation.findOne({
          attributes: ['UId', 'med_starttime', 'med_stoptime', 'med_endtime', 'session_num', 'day', 'cycle'],
          where: { UId: UId },
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


router.get('/get-messages', async (req, res) => {
  try {
      const  { UId } = req.session;
      //console.log('UId', UId);
     // const { UId } = req.body;

      if (!UId) {
          return res.status(401).json({ error: 'User not authenticated' });
      }

      const messages = await Messages.findAll({
          attributes: ['UId', 'message', 'messageTime','isAdminMessage','messagetype'],
          where: { UId: UId },
      });

      if (!messages || messages.length === 0) {
          return res.status(404).json({ error: 'Messages not found for the user' });
      }

      return res.status(200).json(messages);
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditation-date', async (req, res) => {
  try {
      const { UId } = req.session;

     // const { UId } = req.body;


      if (!UId) {
          return res.status(401).json({ error: 'User not authenticated' });
      }

      const user = await timeTracking.findAll({
          attributes: ['UId', 'med_starttime', 'timeEstimate', 'ismeditated'],
          where: {
            UId: UId,
          },
      });

      if (!user || user.length === 0) {
          return res.status(404).json({ error: 'No records found with timeEstimate >= 90' });
      }

      // Modify the med_starttime in each record
      const formattedUser = user.map(record => {
          const parsedDate = moment(record.med_starttime, "YYYY-MM-DD HH:mm:ss");
          const formattedDate = parsedDate.format("YYYY-MM-DD HH:mm:ss");
          const replacedDate = formattedDate.replace(/-/g, ',');

          // Add the formatted date to the record
          return { ...record.dataValues, med_starttime: replacedDate };
      });

      return res.status(200).json(formattedUser);
  } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/getBankDetails/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.UId);

    // Fetch the 'reg' record with associated 'BankDetails'
    const userData = await reg.findOne({
      where: { userId },
      include: [BankDetails], // Include the associated BankDetails
    });

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Access the BankDetails from the retrieved data
    const userBankDetails = userData.BankDetail; // assuming you've defined it as "BankDetail" in the reg model

    res.json({ userData, userBankDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
router.get('/getbroadcast-message', async (req, res) => {
  try {
    const messages = await Broadcast.findAll();
    res.json({ messages });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/reg-confiq', async (req, res) => {
try{
const config = await applicationconfig.findAll();
res.json({ config });
}
catch (error) {
  res.status(500).json({ error: 'Internal server error' });
}
});

router.get('/list-appointment', async(req,res) =>{
try{
  const { phone } = req.query;

  if(!phone) {
     
    return res.status(401).json({error:'User not authenticated'});
  }
  //console.log('get appointment list');
  // find the appointment
  const list = await appointment.findAll({where:{phone},});
  res.status(200).json({message:'Fetching appointments',list });
} catch(error) {
  console.log(error);
  res.status(500).json({message:'internal server error'});
}
});

router.delete('/appointment/:id', async(req,res) =>{
const { phone} = req.body;
const id = req.params.id;
try{

  //console.log('delete appointment');
 // find the appointment
  const data = await appointment.findOne({ where:{id}});

  if(!phone) {
    return res.status(404).json({error:'User not authenticated'});
  }
  // delete appointment
  await data.destroy();
  return res.status(200).json('delete appointment');

} catch(error){
  return res.status(500).json({message:'internal server error'});
}
});

router.get('/show', async (req, res) => {
try {
    
    const config = await applicationconfig.findOne(); // Retrieve a single row from the table
    const prompt = config ? config.reg_email_prompt : null; // Access the reg_email_prompt property
    console.log(prompt);
    res.status(200).json({ prompt });
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/list-all-appointment' , async(req, res) =>{
try{
  const data = await appointment.findAll();
  res.json(data);
} catch ( error){
  res.status(500).json({ message:' internal server error'});
}
});


module.exports = router;