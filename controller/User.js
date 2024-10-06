const express = require('express');
const {reg} = require('../model/registration');
const BankDetails =require('../model/bankdetails');
const router = express.Router();
const { Op } = require("sequelize");
const axios = require('axios');
const Country =require('../model/country');
const Redis = require('ioredis');
const redis = new Redis();
const questions =require("../model/question");
const {Users,sequelize} = require('../model/validUsers');
const Meditation =require('../model/meditation');
const moment = require('moment');
const bcrypt = require('bcrypt');
const timeTracking = require('../model/timeTracking');
const Messages = require('../model/gurujiMessage');
const Appointment = require("../model/appointment");
const nodemailer = require('nodemailer');
const meditation = require('../model/meditation');
const message = require('../model/gurujiMessage');
const applicationconfig = require('../model/applicationConfig');
const multer = require('multer');
const admin = require('firebase-admin');
  const privateMsg = require("../model/privatemsg");
const distribution = require('../model/distribution');
const storage = admin.storage().bucket();
const GroupMembers = require('../model/groupmembers');
// Multer configuration for handling file uploads
const upload = multer({ dest: 'uploads/' });
const ApplicationConfig = require('../model/applicationConfig');
const globalMessage = require('../model/globalMessage');
const feedBack = require('../model/feedback');
const gurujiMessage = require('../model/gurujiMessage');
const events = require('../model/events');
const meditationFees = require('../model/meditationFees');
const maintenance = require('../model/maintenance'); 
const Video = require('../model/videos');
const Broadcast =require('../model/broadcast');
const dekshina = require('../model/dekshina');
const donation = require('../model/donation');
const meditationTime = require('../model/medtitationTime')
const ZoomRecord = require('../model/zoomRecorder'); 
const zoom = require('../model/zoom');
const blogs = require('../model/blogs');

router.get('/getAllUsers', async (req, res) => {
  try {
    console.log(".............................getAllUsers...................................");
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
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/countries', async (req, res) => {
  try{
    console.log(".............................countries...................................");

    const data = req.body; // Assuming req.body is an array of objects
 
    if (Array.isArray(data)) {
        try {
            // Use Sequelize to bulk create the data in the database
            await Country.bulkCreate(data);
 
            res.status(200).send({ message: "Countries added to the database successfully" });
        } catch (error) {
            console.log(error);
            res.status(500).send({ message: "An error occurred while adding countries to the database" });
        }
    } else {
        res.status(400).send({ message: "Invalid data format. Please send an array of objects." });
    }}
    catch (error) {
      console.log(error);
      res.status(500).send({ message: "internal server error"});
    }
});
 
router.get('/countrieslist', async (req, res) => {
    try {
      console.log(".............................countrieslist...................................");

      const countries = await Country.findAll({
        order: [['name', 'ASC']], // Order by the 'name' field in ascending order
      });
 
      res.json(countries);
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: 'An error occurred while fetching countries' });
    }
  });

const { v4: uuidv4 } = require('uuid');
const { verify } = require('crypto');

router.post('/registerUser', async (req, res) => { 
  try {
  console.log("..................registerUser...................");
  const { email, phone, country } = req.body;
  console.log(email, phone, country);

    const existingUser = await reg.findAll({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      // Check if the email exists and user is active or banned
      if (existingUser.email === email) {
        if (existingUser.user_Status === 'ACTIVE' || existingUser.user_Status === 'BANNED') {
          return res.status(400).json({ message: "Email already exists", status: 'false', flag: 'email' });
        } else {
          // If the user is not active or banned, send OTP
          sendOTP(email, phone, country, res);
          return;
        }
      }
    
      // Check if the phone number exists and user is active or banned
      if (existingUser.phone === phone) {
        if (existingUser.user_Status === 'ACTIVE' || existingUser.user_Status === 'BANNED') {
          return res.status(400).json({ message: "Phone number already exists", status: 'false', flag: 'phone' });
        } else {
          // If the user is not active or banned, send OTP
          sendOTP(email, phone, country, res);
          return;
        }
      }
    }
    
  else{
    sendOTP(email,phone,country,res)
  }
   
  } catch (error) {
    // Log error details for debugging
    console.log("Error registering user:", error.message);
    return res.status(500).json({ message: "Internal Server Error", status: 'false' });
  }
});

async function sendOTP(email,phone,country,res) {
  console.log('send otp')
  try{
  if (country === 'India') {
  console.log('send otp if india ')

    // Send OTP via the external service
    const otpRequest = {
      method: 'post',
      url: `https://control.msg91.com/api/v5/otp?otp_expiry=1&template_id=66cdab06d6fc0538413b7392&mobile=91${phone}&authkey=${process.env.MSG91_AUTH_KEY}&realTimeResponse=`,
      headers: {
        Accept: 'application/json',
      },
      
    };

    // Await OTP response
    const otpResponse = await axios(otpRequest);

    // Check if the OTP was sent successfully based on the response from the API
    if (otpResponse.data.type === 'success') {
      return res.status(200).json({ message: "OTP sent successfully", status: 'true',verify: true });
    } else {
      // Log the reason if OTP was not successful (msg91 provides a response message)
      console.log('OTP sending failed:', otpResponse.data);
      return res.status(400).json({ message: "Failed to send OTP", status: 'false', details: otpResponse.data.message });
    }
  } else {

  console.log('send otp else india')

    // For other countries, generate a random OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const redisKey = `otp:${phone}`;
    await redis.setex(redisKey, 600, otp); // Store OTP in Redis with an expiry time of 10 minutes

    // Setup Nodemailer to send the OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'thasmai2016@gmail.com', // Use environment variables for sensitive data
        pass: 'bwaz sgbn oalp heik', // Securely manage this via environment variables
      },
    });

    // Email options
    const mailOptions = {
      from: 'thasmai2016@gmail.com',
      to: email, // User's email address
      subject: 'Thasmai Star Life: OTP for Registration',
      html: `
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); }
            .header { text-align: center; padding: 20px; background-color: #2c3e50; border-radius: 8px 8px 0 0; color: #ffffff; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 20px; text-align: center; }
            .content h2 { color: #333333; font-size: 20px; margin-bottom: 10px; }
            .content p { color: #666666; font-size: 16px; margin-bottom: 20px; }
            .otp { display: inline-block; background-color: #27ae60; color: white !important; font-size: 24px; padding: 10px 20px; border-radius: 5px; text-decoration: none; margin-bottom: 20px; }
            .footer { text-align: center; padding: 20px; color: #999999; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="email-container">
            <div class="header">
                <h1>Thasmai Starlife Registration</h1>
            </div>
            <div class="content">
                <h2>Your OTP for Registration</h2>
                <p>Thank you for registering with Thasmai Starlife. Please use the following OTP to confirm your registration:</p>
                <p class="otp">${otp}</p>
                <p>If you did not request this OTP, please ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; 2024 Thasmai Starlife. All rights reserved.</p>
            </div>
        </div>
      </body>
      `,
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Failed to send email', status: 'false' });
      } else {
        console.log('Email sent:', info.response);
        return res.status(200).json({ message: 'OTP sent successfully via email', status: 'true',verify: true, redisKey });
      }
    });
  }
}
catch (error) {
  console.log(error);
  return res.status(500).json({ message:"something failed"});
}
}

function generateOTP() {
    // Generate a random 4-digit OTP
    return Math.floor(1000 + Math.random() * 9000).toString();
}


 
router.get('/displayDataFromRedis/:key', async (req, res) => {
  
  try {
    console.log("..................displayDataFromRedis...................");

    const key = req.params.key;
 
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
        console.log('Error retrieving data from Redis:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


router.post("/verify_otp", upload.single('profilePic'), async (req, res) => {
  console.log("<........verify OTP user........>");
  
  try {
    const { first_name, last_name, email, DOB, gender, country, phone, reference, ref_id, languages, remark, OTP } = req.body;
   console.log("first_name: " + first_name, "last_name: " + last_name, "email: "+ email, "DOB: "+ DOB, "gender: "+ gender, "country: "+ country, "phone: "+ phone, "reference:"+reference, "ref_id: "+ ref_id, "languages:"+languages, "remark:"+ remark, "OTP:"+ OTP);

    if (country === "India") {
      // Verify OTP with the external API
      const otpOptions = {
        method: 'GET',
        url: 'https://control.msg91.com/api/v5/otp/verify',
        params: {
          otp: OTP,
          mobile: `91${phone}` // Prefix country code as required
        },
        headers: {
          authkey: process.env.MSG91_AUTH_KEY // Use environment variable for authkey
        }
      };

      // Call the OTP verification API
      const otpResponse = await axios(otpOptions);

      // Check response status from OTP verification
      if (otpResponse.data.type !== 'success') {
        console.log('Invalid OTP:', otpResponse.data);
        return res.status(400).send("Invalid OTP");
      }
    
      
      else{
        verifyOTP(first_name, last_name, email, DOB, gender, country, phone, reference, ref_id, languages, remark, OTP,req,res);
      }
  

    } else {
      // Retrieve the stored OTP from Redis
      const redisKey = `otp:${phone}`;
      const storedOTP = await redis.get(redisKey);

      if (!storedOTP) {
        return res.status(401).send("OTP not found in Redis");
      }
      if(storedOTP === OTP){
        verifyOTP(first_name, last_name, email, DOB, gender, country, phone, reference, ref_id, languages, remark, OTP,req,res)
      }
      else{
      return res.status(400).send("Invalid OTP");

      }
   
  }

  } catch (err) {
    // Log the error and send an appropriate response
    console.log("<........error........>", err);
    return res.status(500).send(err.message || "An error occurred during OTP verification");
  }
});

async function verifyOTP(first_name, last_name, email, DOB, gender, country, phone, reference, ref_id, languages, remark, OTP,req,res){
  
try{
        
    const hashedPassword = await bcrypt.hash(phone, 10);

    // Get the next User ID
    const maxUserId = await reg.max('UId');
    const UId = maxUserId + 1;
    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in "YYYY-MM-DD" format

    let profilePicUrl = '';

    // Handle profile picture upload if provided
    if (req.file) {
      const profilePicPath = `profile_pictures/${UId}/${req.file.originalname}`;

      // Upload the profile picture to your storage service
      await storage.upload(req.file.path, {
        destination: profilePicPath,
        metadata: {
          contentType: req.file.mimetype
        }
      });

      profilePicUrl = `gs://${storage.name}/${profilePicPath}`;

      // Optionally, delete the temporary file after upload
      fs.unlink(req.file.path, (err) => {
        if (err) console.log("Error deleting temporary file:", err);
      });
    }

    // Create the user record in the database
    const user = await reg.create({
      first_name,
      last_name,
      email,
      DOB,
      gender,
      phone,
      country,
      reference,
      ref_id,
      languages,
      remark,
      UId,
      DOJ: currentDate,
      expiredDate: calculateExpirationDate(),
      password: hashedPassword,
      verify: 'true',
      user_Status: 'ACTIVE',
      profilePicUrl
    });

    // Create a record in the BankDetails table for the new user
    await BankDetails.create({
      AadarNo: "",
      IFSCCode: "",
      branchName: "",
      accountName: "",
      accountNo: "",
      UId: user.UId
    });

  
  const responseData = {
    message: "Success",
    data: {
      id: user.UserId,
      first_name: user.first_name,
      last_name: user.last_name,
      DOJ: user.DOJ,
      expiredDate: user.expiredDate,
      UId: user.UId
    }
  }
  return res.status(200).json(responseData);

} catch (error) {
  console.log("Error during user creation:", error);
  return res.status(500).json({ message: "An error occurred during user creation" });
}
}

function calculateExpirationDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 5);
    return d;
}
 
router.get('/listName/:UId', async (req, res) => {
  try {
    console.log(".............................listName...................................");

    const { UId } = req.params;
    console.log("UId: " + UId)
 
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
    console.log(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

/////////////////////////////////// USER     \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
 
 

 
router.get('/rulesAndConditions', async (req, res) => {
  try {
    console.log(".............................rulesAndConditions...................................");
    const  questionId  = 1;
 
    // Fetch the question from the database by questionId
    const question = await questions.findByPk(questionId);
 
    // Check if the question exists
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
 
    // Extract the value from the condition field
    const conditionValue = question.conditions;
 
    // Return the condition value in the API response
    return res.status(200).json({ message: 'Condition value retrieved successfully', condition: conditionValue });
  } catch (error) {
    console.log('Error retrieving condition value:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/send-otp', async (req, res) => {
  try {
    console.log(".............................send-otp...................................");

  const { email,phone,country} = req.body;
console.log("email:"+email);

    // Find the user with the provided email
    const user = await reg.findOne({
      where: {
        [Op.or]: [
          { email: email }, // Check by email
          { phone: phone }  // Check by phone
        ]
      },
      order: [['createdAt', 'DESC']], 
    });

    if (!user) {
      return res.status(201).json({ message: 'You are not registered', status: 'false',verify: false });
    }
else{

  if(user.user_Status === 'DELETED') {
   // sendOTP(email,phone,country,res);
    return res.status(202).json({ message:'account is deleted ! register again',verify: false });

  }
}
    if (!phone) {
      return res.status(400).json({ message: 'Phone number not available for this user', status: 'false' });
    }
sendOTP(email,phone,country,res);

  } catch (error) {
    // Log error details for debugging
    console.log('Error during OTP request:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', status: 'false' });
  }
});


router.post('/verify-userotp', async (req, res) => {
  try {
    console.log(".............................verify-userotp...................................");

    const { otp, email,phone,country } = req.body;
    console.log('otp:'+otp,"email:"+email);

    // Fetch user from the database using email
    const regUser = await reg.findAll({
      where: {
        [Op.or]: [
          { email: email }, // Check by email
          { phone: phone }  // Check by phone
        ]
      }
    });

    if (regUser) {
    if (country === 'India') {
    
      const otpOptions = {
        method: 'GET',
        url: 'https://control.msg91.com/api/v5/otp/verify',
        params: {
          otp: otp,
          mobile: `91${phone}` // Prefix country code as required
        },
        headers: {
          authkey: process.env.MSG91_AUTH_KEY // Use environment variable for authkey
        }
      };

      try {
        // Make the request to MSG91 to verify the OTP
        const response = await axios.request(otpOptions);

        // Check if OTP verification was successful
        if (response.data.type === 'success') {
          await reg.update(
            { classAttended: true },
            { where: { phone: phone } } // Ensure you update only the specific user
          );
      
          // Create session and store user ID
          req.session.UId = regUser.UId;
          console.log(req.session.UId);
      
          // Respond with success message and user information
          return res.status(200).json({
            message: 'Login successful',
            user: {
              UserId: regUser.UserId,
              email: regUser.email,
              first_name: regUser.first_name,
              last_name: regUser.last_name,
              UId: regUser.UId,
              DOJ: regUser.DOJ,
              isans: regUser.isans,
              expiredDate: regUser.expiredDate
              // Don't send sensitive information like password
            },
            status: 'True',
            verify: true
          });
        
        } else {
          return res.status(401).json({ message: 'Invalid OTP' });
        }
      } catch (error) {
        console.log('Error during OTP verification via MSG91:', error);
        return res.status(500).json({ message: 'Failed to verify OTP' });
      }
    } else {
      // Handle OTP verification for countries other than India
      const redisKey = `otp:${phone}`;
      const storedOTP = await redis.get(redisKey);

      if (!storedOTP) {
        return res.status(401).json({ message: "OTP not found" });
      }

      if (storedOTP === otp) {
        await reg.update(
          { classAttended: true },
          { where: { email: email } } // Ensure you update only the specific user
        );
    
        // Create session and store user ID
        req.session.UId = regUser.UId;
        console.log(req.session.UId);
    
        // Respond with success message and user information
        return res.status(200).json({
          message: 'Login successful',
          user: {
            UserId: regUser.UserId,
            email: regUser.email,
            first_name: regUser.first_name,
            last_name: regUser.last_name,
            UId: regUser.UId,
            DOJ: regUser.DOJ,
            isans: regUser.isans,
            expiredDate: regUser.expiredDate
          },
          status: 'True',
          verify: true
        });
      } else {
        return res.status(401).json({ message: 'Invalid OTP' });
      }
    }
  }

  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post("/register", upload.single('profilePic'), async (req, res) => {
  try{
    console.log("..................register...................");

    const { first_name, last_name, email, DOB, gender, country, phone, reference, ref_id, languages, remark} = req.body;
    console.log("first_name: " + first_name, "last_name: " + last_name, "email: "+ email, "DOB: "+ DOB, "gender: "+ gender, "country: "+ country, "phone: "+ phone, "reference:"+reference, "ref_id: "+ ref_id, "languages:"+languages, "remark:"+ remark);
    
    const existingUser = await reg.findOne({
      where: {
        [Op.or]: [{ email }, { phone }],
      },
      order: [['createdAt', 'DESC']],
    });

    if (existingUser) {
      if (existingUser.email === email && existingUser.user_Status === 'ACTIVE') {
        return res.status(400).json({ message: "Email already exists", status: 'false', flag: 'email' });
      }

      if (existingUser.phone === phone && existingUser.user_Status === 'ACTIVE') {
        return res.status(400).json({ message: "Phone number already exists", status: 'false', flag: 'phone' });
      }
    }
        
    const hashedPassword = await bcrypt.hash(phone, 10);

    // Get the next User ID
    const maxUserId = await reg.max('UId');
    const UId = maxUserId + 1;
    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in "YYYY-MM-DD" format

    let profilePicUrl = '';

    // Handle profile picture upload if provided
    if (req.file) {
      const profilePicPath = `profile_pictures/${UId}/${req.file.originalname}`;
try{
      // Upload the profile picture to your storage service
      await storage.upload(req.file.path, {
        destination: profilePicPath,
        metadata: {
          contentType: req.file.mimetype
        }
      });

      profilePicUrl = `gs://${storage.name}/${profilePicPath}`;

      // Optionally, delete the temporary file after upload
      fs.unlink(req.file.path, (err) => {
        if (err) console.log("Error deleting temporary file:", err);
      });
    }
    catch (uploadError) {
      console.log("Error uploading profile picture:", uploadError);
      return res.status(500).json({ message: "Profile picture upload failed" });
    }
  }
    // Create the user record in the database
    const user = await reg.create({
      first_name,
      last_name,
      email,
      DOB,
      gender,
      phone,
      country,
      reference,
      ref_id,
      languages,
      remark,
      UId,
      DOJ: currentDate,
      expiredDate: calculateExpirationDate(),
      password: hashedPassword,
      verify: 'true',
      user_Status: 'ACTIVE',
      profilePicUrl
    });

    // Create a record in the BankDetails table for the new user
    await BankDetails.create({
      AadarNo: "",
      IFSCCode: "",
      branchName: "",
      accountName: "",
      accountNo: "",
      UId: user.UId
    });
    sendOTP(email,phone,country,res);
  
    return res.status(200).json({
      message: "Success",
      data: {
        id: user.UserId,
        first_name: user.first_name,
        last_name: user.last_name,
        DOJ: user.DOJ,
        expiredDate: user.expiredDate,
        UId: user.UId
      }
    });
} catch (error) {
  console.log("Error during user creation:", error);
  return res.status(500).json({ message: "An error occurred during user creation" });
}
});

  router.post('/logout', (req, res) => {
    try{
      console.log("..................logout...................");

    req.session.destroy(err => {
      if (err) {
        console.log('Error destroying session:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      return res.status(200).json({ message: 'Logout successful' });
    });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error'});
  }
  });
  
router.get('/getUserById', async (req, res) => {
  try {
    console.log("..................getUserById...................");

    if(req.session.UId) {
      console.log("session is..............", req.session.UId);
  
    }
      const { UId } = req.session;
      console.log("UId is..........", UId);

 
      // Fetch user details by UId from the reg table
      const user = await reg.findOne({ where: { UId }, attributes: ['first_name', 'last_name' , 'DOB' , 'gender' , 'email', 'address','pincode', 'state', 'district' , 'country', 'phone' ,'reference' , 'languages' ,'UId', 'DOJ' ,'expiredDate', 'classAttended', 'isans','profilePicUrl', 'maintanance_fee' ] });
 
      if (!user) {
          return res.status(401).json({ error: 'User not found' });
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
              // Convert profilePicUrl from an array to a string
              profilePicUrl = profilePicUrl[0];
          }
      }
 
      // Fetch only 'cycle' and 'day' fields from the meditation table based on the UId
      const meditationData = await meditation.findOne({
          where: { UId },
          attributes: ['cycle', 'day' , 'session_num']
      });
 
      // Merge meditationData properties directly into the user object
      const mergedUser = {
          ...user.toJSON(),
          profilePicUrl,
          ...meditationData?.toJSON() // Use optional chaining to avoid errors if meditationData is null
      };
 
      // Remove null or undefined values from mergedUser
      Object.keys(mergedUser).forEach(key => {
          if (mergedUser[key] === null || mergedUser[key] === undefined) {
              delete mergedUser[key];
          }
      });
 
      // Send the response with merged user data
      return res.status(200).json({ user: mergedUser });
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/flag', async (req, res) => {
  try {
    console.log("..................flag...................");
    const UId = req.session.UId;
    console.log(UId);

    // Check if UId exists in the session
    if (!UId) {
      return res.status(401).json({ error: 'Invalid UId' });
    }

    // Find the user by UId
    const user = await reg.findOne({ where: { UId } });

    // Check if user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch related data
    const payment = await maintenance.findOne({
      where: { UId },
      order: [['payment_date', 'DESC']], // Ensure the latest payment record is fetched
    });
    const meditation = await meditationFees.findOne({ where: { UId } });
    const buttonBlock = await Meditation.findOne({ where: { UId } });

    // Prepare the response object
    let response = {
      isans: user.isans,
      maintenance_payment_status: payment ? payment.maintenance_payment_status : null,
      meditation_fee_payment_status: meditation ? meditation.fee_payment_status : null,
      morning_meditation: buttonBlock ? buttonBlock.morning_meditation : null,
      evening_meditation: buttonBlock ? buttonBlock.evening_meditation : null,
    };

    // Filter out null values
    response = Object.fromEntries(Object.entries(response).filter(([_, v]) => v !== null));

    // Return the filtered response
    return res.status(200).json({message:response});

  } catch (error) {
    console.log('Error fetching flag data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/meditation-data', async (req, res) => {
    try {
      console.log("..................meditation-data...................");

      if(req.session.UId) {
          console.log("session is..............", req.session.UId);

        }
      const UId = req.session.UId;
      console.log(".......................",req.session);
      const ans = req.body.ans;
      const isans = req.body.isans;
 
      // Check if the user is authenticated
      if (!UId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
 
      // Fetch the user record by UId
      const user = await reg.findOne({ where: { UId: UId } });
 
      // Handle case where user record is not found
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
 
      // Check if ansList is an array
      if (!Array.isArray(ans)) {
        return res.status(400).json({ error: 'ans must be an array of strings' });
      }
 
      // Serialize the ansList array into a string
      const serializedAns = ans.join(',');
 
      // Update the user's ans field with the serializedAns string
      await user.update({ ans: serializedAns, isans});
 
      return res.status(200).json({ message: 'Meditation data updated successfully' });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  });

router.get('/reference', async (req, res) => {
  try {
    console.log("..................reference...................");

  const UId = req.session.UId;
  console.log(req.session.UId);
 
 
      const user = await reg.findOne({
          where: { UId },
          attributes: ['first_name', 'last_name'],
      });
 
      if (!user) {
          return res.status(401).json({ message: 'User not found' });
      }
 
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      res.json({ full_name: fullName });
  } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});
 
router.get('/list-questions', async (req, res) => {
    try {
      console.log("..................list-questions...................");

      const Questions = await questions.findAll();
      res.json(Questions);
    } catch (error) {
      console.log('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
 
router.get('/user-details', async (req, res) => {
  try {
    console.log("..................user-details...................");

  if(req.session.UId) {
    console.log("session is..............", req.session.UId);

  }
  const UId = req.session.UId;
  console.log(req.session.UId)
 
 
      // Fetch details from reg table
      const userDetails = await reg.findOne({
          where: { UId },
      });
 
      if (!userDetails) {
          return res.status(401).json({ message: 'User not found' });
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
      console.log('Error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
  }
});
 
router.delete('/delete-user/:phone', async (req, res) => {
  try {
    console.log("..................user-details...................");

    const phone = req.params.phone;
    console.log(req.params.phone)
 
  
        // Find the user based on the phone number
        const user = await reg.findOne({ where: { phone } });
 
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
 
        // Delete the user
        await user.destroy();
 
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.log('Error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
 
// router.delete('/deleteuser/:phone', async (req, res) => {
//     const phone = req.params.phone;
//     try {
//         // Find the user based on the phone number
//         const user = await reg.findOne({ where: { phone } });
//             if (!user) {
//                 return res.status(401).json({ message: 'User not found' });
//             }
// const bank = await bankDetails.findOne({ where: {regId: user.id} });
// await user.destroy();
// if (bank) {
//     await bank.destroy();
// }
// return res.status(200).json({ message: 'User deleted successfully' });
 
//     } catch (error) {
//         console.log('Error:', error);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// });



router.post('/meditation', async (req, res) => {
  try {
    console.log("..................meditation...................");

    const { UId } = req.session;
    const { startdatetime, stopdatetime, morning_meditation, evening_meditation } = req.body;

    console.log("........................", UId, morning_meditation, evening_meditation)
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

    const difference = refStopDate.diff(refStartDate, 'minutes');
    let ismeditated;

    if (difference >= 45) {
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
      existingMeditationRecord.morning_meditation = morning_meditation;
      existingMeditationRecord.evening_meditation = evening_meditation;

      if (difference >= 45) {
        existingMeditationRecord.session_num += 1;
        if (existingMeditationRecord.session_num > 2) {
          existingMeditationRecord.session_num = 1;
        }
      }

      if (existingMeditationRecord.session_num === 2) {
        existingMeditationRecord.day += 1;
        // existingMeditationRecord.session_num = 0;
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
        morning_meditation,
        evening_meditation
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
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/guruji-date', async (req, res) => {
  try {
    console.log("..................guruji-date...................");

    const  id  = 11;
 
    // Find the application config record by ID
    const config = await ApplicationConfig.findByPk(id);
 
    // If the record exists, parse the JSON value and send it in the response
    if (config) {
      const values = JSON.parse(config.value);
      return res.status(200).json({ message: 'Application config retrieved successfully', values });
    } else {
      return res.status(404).json({ error: 'Application config not found' });
    }
  } catch (error) {
    console.log('Error retrieving application config:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

 router.post("/appointment", async (req, res) => {
  try {
    console.log("..................appointment...................");

   const UId = req.session.UId;
   console.log('UId: ', UId);
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    const {
 
      appointmentDate,
      num_of_people,
      pickup,
 
      from,
      days,
      emergencyNumber,
      appointment_time,
      appointment_reason,
      register_date,
      groupmembers,
      externalUser
    } = req.body;
    console.log(UId);
 
    const existingUser = await Users.findOne({ where: { UId } });
 
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
 
    const newAppointment = await Appointment.create({
      UId: existingUser.UId,
      phone: existingUser.phone,
      appointmentDate,
      num_of_people,
      pickup,
      from,
      days,
      emergencyNumber,
      appointment_time,
      appointment_reason,
      register_date,
      user_name: existingUser.firstName + " " + existingUser.secondName,
      appointment_status: "Not Arrived",
      externalUser
    });
 
    if (Array.isArray(groupmembers) && groupmembers.length > 0) {
      const groupMembersData = groupmembers.map(groupMember => ({
        name: groupMember.name,
        relation: groupMember.relation,
        age: groupMember.age,
        appointmentId: newAppointment.id,
      }));
      console.log(groupMembersData)
      await GroupMembers.bulkCreate(groupMembersData); // Fixed the function call
    }
 
    return res.status(200).json({
      message: 'Appointment has been allocated successfully! We will notify guruji soon.',
    });
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.put('/rating', async (req, res) => {
  try {
    console.log("..................rating...................");

  const id = req.body.id;
  console.log(id);
  const {rating , feedback}= req.body;
  console.log(rating, feedback);
 

    const appointment = await Appointment.findOne({ where: { id: id } });
    if (!appointment) {
      return res.status(401).json({ error: 'Appointment not found' });
    }
 
    await Appointment.update({ rating: rating ,feedback :feedback}, { where: { id: id } });
 
    return res.status(200).json({ message: 'Rating updated successfully' });
  } catch (error) {
    console.log('Error updating rating:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/list-appointment', async (req, res) => {
  try {
    console.log("..................list-appointment...................");

    const  UId = req.session.UId;
    console.log(req.session.UId);
 
    // Check if the user is authenticated
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
 
    // Find appointments for the authenticated user
    const appointments = await Appointment.findAll({ where: { UId },
      attributes: [ 'id','UId','phone','appointmentDate','num_of_people','pickup','from','days','emergencyNumber','appointment_reason','user_name','register_date','appointment_status','externalUser','check_out' ] });
 
    // Fetch group members for each appointment
    for (const appointment of appointments) {
      if(appointment.id){
      const groupMembers = await GroupMembers.findAll({ where: { appointmentId: appointment.id } });
      appointment.dataValues.groupMembers = groupMembers; // Attach group members to each appointment
    }
  }
 
    // Respond with the list of appointments
    return res.status(200).json({ message: 'Fetching appointments', appointments });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.put('/updateAppointment/:id', async (req, res) => {
  try {
    console.log(".................updateAppointmen..............");
    const { id } = req.params;
    console.log(id);
    const updateFields = req.body;
    console.log(updateFields);
 
    // Check if appointment exists
    const appointment = await Appointment.findOne({ where: { id } });
    if (!appointment) {
      return res.status(401).json({ error: 'Appointment not found' });
    }
 
    // Update Appointment
    const [appointmentResult] = await Appointment.update(updateFields, {
      where: { id },
    });
   // console.log(".......................",[appointmentResult]);
 
    // Update or create GroupMembers
    if (updateFields.groupmembers && Array.isArray(updateFields.groupmembers)) {
 
      const groupMembersUpdates = updateFields.groupmembers.map(async (groupMember) => {
        console.log(groupMember.id);
        if (groupMember.id) {
         //console.log("enter");
          // Update existing group member if ID exists
          await GroupMembers.update(groupMember, {
            where: { id: groupMember.id },
          });
        } else {
         // console.log("................else........")
          // Create new group member if ID does not exist
          await GroupMembers.create({
            name: groupMember.name,
            relation: groupMember.relation,
            age: groupMember.age,
            appointmentId: id,
          });
        }
      });
      await Promise.all(groupMembersUpdates);
    }
 
    return res.status(200).json({ message: 'Appointment and GroupMembers updated successfully' });
  } catch (error) {
    console.log('Error updating appointment and group members:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.delete('/delete-appointment', async (req, res) => {
  try {
    console.log(".................delete-appointment..............");

  const { id } = req.query;
  console.log(id)
  const UId = req.session.UId; // Assuming UId is stored in req.session
  console.log(req.session.UId);
 

    // Check if the user is authenticated
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
 
    // Start a transaction
    await sequelize.transaction(async (t) => {
      // Find the appointment
      const appointmentData = await Appointment.findOne({ where: { id }, transaction: t });
 
      // Check if the appointment exists
      if (!appointmentData) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
 
      // Delete associated group members
      await GroupMembers.destroy({ where: { appointmentId: id }, transaction: t });
 
      // Delete the appointment
      await appointmentData.destroy({ transaction: t });
    });
 
    // Respond with a success message
    return res.status(200).json({ message: 'Appointment and associated group members deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/group-members/:id', async (req, res) => {
  try {
    console.log(".................group-members..............");

  const { id } = req.params;
 
  
    // Find the group member by ID
    const groupMember = await GroupMembers.findByPk(id);
 
    // Check if the group member exists
    if (!groupMember) {
      return res.status(401).json({ error: 'Group member not found' });
    }
 
    // Delete the group member
    await groupMember.destroy();
 
    // Respond with a success message
    return res.status(200).json({ message: 'Group member deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/send-email', async (req, res) => {
  try {
    console.log("................send-email..............");

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
 
        user: 'thasmai2016@gmail.com',
        pass: 'bwaz sgbn oalp heik',
      },
    });
 
    // Define email options
    const mailOptions = {
      from: 'thasmai2016@gmail.com',
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
              height: 35px;
              width: 35px;
              border-radius: 100%;
         }
 
          .whatsapp-link {
              margin-top: 20px;
              color: rgb(37, 61, 183);
              font-weight: 600;
              font-size: 1rem;
              vertical-align: super;
          } 
 
      .card-container{
 
        text-align: center;
 
      }
 
 
      .reg-success-card {
        background-image: url('https://firebasestorage.googleapis.com/v0/b/thasmai-star-life.appspot.com/o/general_images%2Freg-success-card-img.png?alt=media&token=ab56e564-3eb8-497d-8a14-a2b78e92e53e');
        background-repeat: no-repeat;
        background-color: rgb(62, 61, 91);
        background-size: cover;
        border-radius: 19px;
        height: 240px;
        width: 400px;
        text-align: center;
        margin: 20px auto;
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
      <p style="margin: 5px 0; font-weight: bold;">Sathyam Vada || Dharmam Chara</p>
  </div>
  <div class="message" style="color: #4F4539;">
      <p>Hi ${first_name} ${last_name},</p>
      <p>Congratulations! Registration complete. Your register number: TSL${UId}.</p>
      <p>To receive further details about the introduction class (zoom session): Please send a “hi” to number ‘+91 9900829007’. Thank you for taking the first step.</p>
 
      <p class="whatsapp-link">
      <img class="whatsapp-icon" src="https://firebasestorage.googleapis.com/v0/b/thasmai-star-life.appspot.com/o/general_images%2Fwhatsappicon.gif?alt=media&token=d8742a63-d2dd-4835-b26c-d0234124b770" alt="">
 
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
        <h1>TSL${UId}</h1>
      </td>
         <td class="logo-container">
      <img class="reg-card-logo" src="https://firebasestorage.googleapis.com/v0/b/thasmai-star-life.appspot.com/o/general_images%2Fthasmai%20(1).png?alt=media&token=5ffa5d93-caeb-4802-a8be-d92459766004" alt="Thasmai logo" />
    </td> 
    </tr>
    </table>
 
    <table class="reg-success-card-content">
      <tr>
        <td class="content-chip">
      <img class="chip" src="https://firebasestorage.googleapis.com/v0/b/thasmai-star-life.appspot.com/o/general_images%2Fchip%20(1).png?alt=media&token=8934f00c-57e8-4c4c-8ea8-d8d2dc55d591" alt="chip" />
    </td>
    <td class="center-content">
      <div>
        <img class="reg-card-star-life-logo" src="https://firebasestorage.googleapis.com/v0/b/thasmai-star-life.appspot.com/o/general_images%2Fstar-life-logo-gold.png?alt=media&token=3e4ffde3-aca0-4332-bdaf-1621aac5e5f7" alt="star-life-img" />
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
  <p>Please click the link below to download our app</p>
  <a href="https://drive.google.com/file/d/1qmVCROV6XJW0jv_O3mDg_6E9ximhYW3t/view?usp=sharing" target = "_blank" style = "width:100px; height:20px; padding :10px; background-color: #FFB94D; text-decoration: none; color:black;">Download</a>
 </div>
</body>`,
    };
 
    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    return res.status(200).json({ message: 'Email sent successfully' });
    });
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditation-detail', async (req, res) => {
  try {
    console.log("................meditation-detail..............");

       const { UId } = req.session;
       console.log(UId);
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
      console.log('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.get('/get-messages', async (req, res) => {
  try {
    console.log("................get-messages..............");

      const  { UId } = req.session;
      console.log(UId);
 
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
      console.log('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.get('/meditation-date', async (req, res) => {
  try {
    console.log("................meditation-date..............");

    const { UId } = req.session;
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate and parse page query parameter
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = 25;
    const offset = (page - 1) * limit;

    // Fetch all meditation entries for the user
    const allEntries = await timeTracking.findAll({
      attributes: ['UId', 'med_starttime', 'timeEstimate', 'ismeditated'],
      where: { UId },
      raw: true
    });

    // Group entries by the date of 'med_starttime' and sum the 'timeEstimate' for each date
    const groupedData = allEntries.reduce((acc, entry) => {
      const date = new Date(entry.med_starttime).toISOString().split('T')[0]; // Extract the date part (YYYY-MM-DD)
      if (!acc[date]) {
        acc[date] = { totalTimeEstimate: 0, UId: entry.UId, ismeditated: entry.ismeditated, date };
      }
      acc[date].totalTimeEstimate += parseInt(entry.timeEstimate, 10); // Sum up the timeEstimate
      return acc;
    }, {});

    // Filter the grouped data based on the condition (totalTimeEstimate >= 90)
    const filteredData = Object.values(groupedData).filter(data => data.totalTimeEstimate >= 90);

    // Paginate the filtered data
    const paginatedData = filteredData.slice(offset, offset + limit);
    const totalCount = filteredData.length;
    const totalPages = Math.ceil(totalCount / limit);

    // Format response data and send it
    const responseData = {
      totalPages,
      currentPage: page,
      totalCount,
      data: paginatedData.map(({ date, UId, ismeditated }) => ({
        date,
        UId,
        ismeditated
      }))
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.post('/addBankDetails', async (req, res) => {
  try {
    console.log("................addBankDetails..............");

    const UId = req.session.UId;
    console.log(req.session.UId);
    const { AadarNo, bankName, IFSCCode, branchName, accountName, accountNo } = req.body;
    console.log(AadarNo, bankName, IFSCCode, branchName, accountName, accountNo);

    if (!UId) {
      return res.status(401).json({ error: 'User not authorized' });
    }

    // Basic validation for the input fields
    if (!AadarNo || !bankName || !IFSCCode || !branchName || !accountName || !accountNo) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await Users.findOne({ where: { UId } });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bankDetails = await BankDetails.create({
      UId: existingUser.UId,
      AadarNo,
      bankName,
      IFSCCode,
      branchName,
      accountName,
      accountNo
    });

    return res.status(200).json({ message: 'Bank details added successfully' });
  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/getBankDetails', async (req, res) => {
  try {
    console.log("................getBankDetails..............");

    const { UId } = req.session;
    console.log(UId);
 
    if (!UId) {
      return res.status(401).json({ message: 'User not found' });
    }
    const userBankDetails = await BankDetails.findOne({where: {UId}}); // assuming you've defined it as "BankDetail" in the reg model
    return res.status(200).json(userBankDetails);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});
 
router.put('/updteBankDetails', async (req, res) => {
  try {
    console.log("................updteBankDetails..............");

    const { UId } = req.session;
    console.log(UId)
    const bankdetails = req.body;
    console.log(bankdetails);
 
    if (!UId) {
      return res.status(401).json('unauthenticated');
    }
 
    const existingUser = await reg.findOne({ where: { UId } });
 
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    } else {
      // Assuming BankDetails is your Sequelize model for bank details
      await BankDetails.update(bankdetails, { where: { UId } });
      // Optionally, you can fetch and return the updated bank details
      const updatedBankDetails = await BankDetails.findOne({ where: { UId } });
      return res.status(200).json('bank details updated');
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json('internal server error');
  }
});

router.get('/reg-confiq', async (req, res) => {
try{
  console.log("................reg-confiq..............");

const config = await applicationconfig.findAll();
res.json({ config });
}
catch (error) {
  console.log(error);
  return res.status(500).json({ error: 'Internal server error' });
  
}
});
 
router.get('/show', async (req, res) => {
try {
 
  console.log("................show..............");

    const config = await applicationconfig.findOne(); // Retrieve a single row from the table
    const prompt = config ? config.reg_email_prompt : null; // Access the reg_email_prompt property
    console.log(prompt);
    return res.status(200).json({ prompt });
} catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
}
});

router.get('/fetch-details', async (req, res) => {
  try {
    console.log("................fetch-details..............");

      const { UId } = req.session;
      console.log(UId);
 
      // Validate UId
      if (!UId) {
          return res.status(401).json({ error: 'UId parameter is required' });
      }
 
      // Fetch details from both tables
      const Messages = await message.findAll({
          attributes: ['id', 'UId', 'message', 'messageTime', 'isAdminMessage', 'messagetype'],
          where: { UId },
          order: [
              ['messageTime', 'ASC'] // Order by time in ascending order
          ]
      });
 
      const adminMessages = await AdminMessage.findAll({
          attributes: ['id', 'UId', 'message', 'messageTime', 'isAdminMessage'],
          where: { UId },
          order: [
              ['messageTime', 'ASC'] // Order by time in ascending order
          ]
      });
 
      // Merge the results
      const mergedDetails = [...Messages, ...adminMessages];
 
      // Sort the merged details by messageTime
      mergedDetails.sort((a, b) => new Date(a.messageTime) - new Date(b.messageTime));
 
      return res.status(200).json(mergedDetails);
  } catch (error) {
      console.log('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/appointment-feedback/:id', async (req, res) => {
  try {
    console.log("................appointment-feedback..............");

  const id = req.params.id;  // Corrected to access the ID from the parameters
  console.log(req.params.id);
  const feedback = req.body.feedback;
  console.log(feedback);
 
  
      if (!id) {
          return res.status(401).json({ error: 'ID not found' });
      }
 
      const dataToUpdate = {
        feedback
      };
 
      const updatedAppointment = await Appointment.update(dataToUpdate, {
          where: { id: id } // Corrected to specify the appointment ID to update
      });
 
      if (updatedAppointment[0] === 1) {
          return res.status(200).json({ message: 'Appointment updated successfully' });
      } else {
          return res.status(404).json({ error: 'Appointment not found' });
      }
  } catch (error) {
      console.log('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/maintances-fee', async (req, res) => {
  try {
    console.log("................maintances-fee..............");

  const UId = req.session.UId;
  console.log(req.session.UId);
  const maintanance_fee = req.body.maintanance_fee;
  console.log(maintanance_fee);
 
 
      if (!UId) {
          return res.status(401).json({ message: 'UId is not found' });
      }
 
      const dataToUpdate = {
          maintanance_fee
      };
 
      const [updatedRowsCount, updatedFee] = await reg.update(dataToUpdate, {
          where: { UId: UId },
          returning: true // This ensures the updated record is returned
      });
 
      if (updatedRowsCount === 0) {
          return res.status(404).json({ message: 'User not found or no changes applied' });
      }
 
      // You can decide what to return upon successful update
      return res.status(200).json({ message: 'Maintenance fee updated successfully', updatedFee });
 
  } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/messages', async (req, res) => {
  try {
    console.log("................messages..............");

      const UId = req.session.UId
      console.log(req.session.UId);
      const { message, messageTime,isAdminMessage, messagetype,messageDate} = req.body;
      console.log(message, messageTime, isAdminMessage, messagetype, messageDate);
      const regUser = await maintenance.findOne({ where: { UId, maintenance_payment_status: true } });

      // Check if the user exists in the User table
      const user = await Users.findOne({ where: { UId } });

      // Check if either condition is met
      if (!regUser && !user) {
          return res.status(404).json({ error: 'User not found or maintenance fee not paid' });
      }

      if (messagetype == 'private') {
        // Assuming privatemsg is the model for private messages
        const privatemsg = await privateMsg.create({
          UId,
          message,
          messageTime,
          isAdminMessage,
          messagetype,
          messageDate
        });

        await privatemsg.save();
      } 
else{
      // Create a new message record
      const newMessage = await globalMessage.create({
          UId,
          message,
          messageTime,
          isAdminMessage,
          messageDate,
          messagetype
      });

      const privatemsg = await privateMsg.create({
        UId,
        message,
        messageTime,
        isAdminMessage,
        messageDate,
        messagetype
      });
    }
      
      return res.status(200).json({ message: 'Message created successfully' });
  } catch (error) {
      console.log('Error:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/validate-session', async (req, res) => {
    try{
      console.log("................validate-session..............");

      const { UId } = req.session;
      console.log(UId);
      if(!UId) {
        return res.status(401).json('session invalid');
      }
      else{
        return res.status(200).json('session is valid');
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ error: 'Internal Server Error'}); 
      
    }
  })

router.get('/privateMessage/:page' , async(req, res) =>{
  try{
    console.log("................privateMessage..............");

    const { UId } = req.session;
    console.log(UId)
   // const UId = req.query.UId;
    const page = parseInt(req.params.page) || 1;
    const limit = 100;
    if(!UId) {
      return res.status(401).json('User not Authenticated');
    }
    else{
 
 
      const totalCount = await privateMsg.count();
 
      const totalPages = Math.ceil(totalCount / limit);
 
      const messages = await privateMsg.findAll({ 
        where: {UId},
        attributes: ['id', 'UId' , 'message' , 'messageTime', 'messageDate','isAdminMessage'],
        include:[],
        order:[['id' , 'DESC']],
        limit: limit,
        offset:(page - 1) * limit
      });
 
      return res.status(200).json({messages: 'fetching messages', messages , totalPages});
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.get('/globalMessage/:page', async (req, res) => {
  try {

  console.log("................globalMessage..............");


    const page = parseInt(req.params.page) || 1;
    const limit = 100;
 
    const totalCount = await globalMessage.count();
 
    const totalPages = Math.ceil(totalCount / limit);
 
    const messages = await globalMessage.findAll({
      attributes: [ 'id','UId', 'message', 'messageTime','messageDate', 'isAdminMessage'],
      include: [], 
      order: [['id', 'DESC']],
      limit: limit,
      offset: (page - 1) * limit
    });
 
    // Fetch first_name and last_name from reg table for each message UId
    const messageData = await Promise.all(messages.map(async (message) => {
      const userData = await Users.findOne({ where: { UId: message.UId }, 
        attributes: ['firstName', 'secondName'] });
     // console.log("userData.............",userData);
     let userName;
     if(userData){
       userName = `${userData.firstName} ${userData.secondName}`;
     }
     else{
      userName = 'Meditation fee is pending'
     }
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
    console.log("................................",error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/gurujimessage/:page', async (req, res) => {
  try {
    console.log(".............................gurujimessage...................................");

    const page = parseInt(req.params.page) || 1;
    const limit = 100;
    
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
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.put('/updateUserDetails', async (req, res) => {
  try {
    console.log(".............................updateUserDetails...................................");

  const UId = req.session.UId
  console.log(req.session.UId);
  const userData = req.body;
  console.log(userData);
 

    // Check if the user is authenticated
    if (!UId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
 
    // Find the user by UId
    const user = await reg.findOne({ where: { UId } });
 
    // Update user details
    if (user) {
      // Update all fields provided in the request, excluding the profilePic field
      await user.update(userData);
 
      // Fetch current profile picture URL
 
      return res.status(200).json({ message: 'User details updated successfully' });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/updateUser', upload.single('profilePic'), async (req, res) => {
  try {
    console.log(".............................updateUser...................................");

  const UId = req.session.UId
  console.log(req.body.UId);
//  const userData = req.body;
  const profilePicFile = req.file;

 
    // Check if the user is authenticated
    if (!UId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find the user by UId
    const user = await reg.findOne({ where: { UId } });

    // Update user details
    if (user) {
      // Update all fields provided in the request, excluding the profilePic field
      // delete userData.profilePic; // Remove profilePic from userData
      // await user.update(userData);

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
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/appFeedback' , async( req, res) => {
  try{
    console.log("..................appFeedback...................");

  const UId = req.session.UId;
  console.log(req.session.UId);
  const { feedback, rating } = req.body;
  console.log(feedback, rating);
 
    if(!UId) {
      return res.status(401).json({error:'invalid UId'});
    }
    const User = await Users.findOne({where: {UId}});
    if(!User) {
      return res.status(401).json({error:'user not found'});
 
    }
    const FeedBack = await feedBack.create({
      UId :User.UId,
      feedback,
      rating
    });
    return res.status(200).json('Feedback created');
  } catch(error) {
    return res.status(500).json({error:'internal server error'});
  }
});
 
router.get('/listevents', async (req, res) => {
  try {
    console.log("..................listevents...................");

    const currentDate = new Date();

    currentDate.setHours(0, 0, 0, 0);
    const upcomingEvents = await events.findAll({
      where: {
        date: {
          [Op.gte]: currentDate // Filter events with dates greater than or equal to the current date
        }
      }
    });
 
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
        event_name: event.event_name,
        event_description: event.event_description,
        priority: event.priority,
        place: event.place,
        date: event.date,
        event_time: event.event_time,
        image
      };
    }));
 
    return res.status(200).json({ events: upcomingEventsFormatted });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
 
router.get('/rewardList', async (req, res) => {
  try {
    console.log("..................rewardList...................");

    const { UId } = req.session;
    console.log(UId);
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const user = await distribution.findAll({
      attributes: ['UId', 'distributed_coupons', 'description', 'distribution_time'],
      where: { UId },
    });

    if (user.length === 0) {
      return res.status(402).json({ message: 'No rewards received' });
    }

    // Calculate the reward for each record
    const userWithRewards = user.map(record => {
      return {
        ...record.dataValues,
        reward: record.distributed_coupons * 2500
      };
    });

    return res.status(200).json(userWithRewards);

  } catch (error) {
    //console.log(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/transaction_summary', async (req, res) => {
  try {
    console.log("..................transaction_summary...................");

    const { UId } = req.session;
    console.log(UId);
    if (!UId) {
      return res.status(401).json('UId is required');
    }

    // Fetching the sum and count of dekshinas.amount
    const totalDekshinasAmount = await dekshina.sum('amount', { where: { UId } });
    const totalDekshinasCount = await dekshina.count({ where: { UId } });

    // Fetching the sum and count of meditationFees.amount
    const totalMeditationAmount = await meditationFees.sum('amount', { where: { UId } });
    const totalMeditationCount = await meditationFees.count({ where: { UId } });

     // Fetching the sum and count of meditationFees.amount
     const totalMaintenanceAmount = await maintenance.sum('amount', { where: { UId } });
     const totalMaintenanceCount = await maintenance.count({ where: { UId } });
 
    // Fetching the sum and count of guruji.amount
    const totaltrust = await donation.sum('amount', { where: { UId } });
    const totaltrustCount = await donation.count({ where: { UId } });

    // Calculate the total amount and total transaction count
    const totalguru = (totalDekshinasAmount || 0) + (totalMeditationAmount || 0) + (totalMaintenanceAmount || 0)
    const totalTransactionCount = totalDekshinasCount + totalMeditationCount + totalMaintenanceCount + totaltrustCount;
    const total = totalguru + totaltrust ;
    return res.status(200).json({
      message: 'Transaction summary',
      totaltrust,
      totalguru,
      total,
      totalTransactionCount
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json('Internal server error');
  }
});

router.get('/transaction_list', async (req, res) => {
  try {
    console.log("..................transaction_list...................");

    const { UId } = req.session;
    console.log(UId);
    if (!UId) {
      return res.status(401).json('UId is required');
    }
    const dekshinas = await dekshina.findAll({ where: { UId } });
    const donations = await donation.findAll({ where: { UId } });
    const meditation = await meditationFees.findAll({ where: { UId } });
    const maintenancefee = await maintenance.findAll({ where: { UId } });

    // Merge the results
    const transactions = [
      ...dekshinas.map(d => ({ ...d.dataValues, type: 'dekshina' })),
      ...donations.map(d => ({ ...d.dataValues, type: 'donation' })),
      ...meditation.map(m => ({ ...m.dataValues, type: 'meditation' })),
      ...maintenancefee.map(m => ({ ...m.dataValues, type: 'maintenance' }))
    ];

    // Sort by date in descending order
    transactions.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

    return res.status(200).json({
      message: 'Transaction list',
      transactions
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json('Internal server error');
  }
});
 
router.get('/broadcasts', async (req, res) => {
  try {
    console.log("..................broadcasts...................");

      const broadcasts = await Broadcast.findAll();
      return res.status(200).json(broadcasts);
  } catch (error) {
      console.log('Error fetching broadcasts:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/playlists', async (req, res) => {
  try {
    console.log("..................playlists...................");

    // Fetch distinct playList_headings
    const playLists = await Video.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('playList_heading')), 'playList_heading']
      ]
    });

    // Prepare a response list
    const playListList = await Promise.all(playLists.map(async (playList) => {
      const playList_heading = playList.get('playList_heading');

      // Fetch all videoLink arrays for the current playList_heading
      const videos = await Video.findAll({
        where: { playList_heading },
        attributes: ['videoLink']
      });

      // Calculate the total number of links in the videoLink arrays
      const totalLinks = videos.reduce((acc, video) => {
        if (Array.isArray(video.videoLink)) {
          return acc + video.videoLink.length;
        }
        return acc;
      }, 0);

      // Fetch playList_image for the current playList_heading
      const video = await Video.findOne({
        where: {
          playList_heading: playList_heading,
          playList_image: {
            [Op.ne]: null
          }
        },
        attributes: ['playList_image']
      });

      let playList_image = null;

      if (video && video.playList_image) {
        const file = storage.file(video.playList_image.split(`${storage.name}/`)[1]);
        const [exists] = await file.exists();
        if (exists) {
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Adjust expiration date as needed
          });
          playList_image = url;
        }
      }

      return {
        playList_heading: playList_heading,
        playList_image,
        videoLinkCount: totalLinks
      };
    }));

    return res.status(200).json({ playlists: playListList });
  } catch (error) {
    console.log('Error fetching playlists:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/videos-by-playlist', async (req, res) => {
  try {
    console.log("..................videos-by-playlist...................");

  const playList_heading = req.query.playList_heading;

  console.log(playList_heading);
  if (!playList_heading) {
    return res.status(400).json({ error: 'playList_heading query parameter is required' });
  }

 
    const videos = await Video.findAll({
      where: { playList_heading },
      attributes: ['Video_heading', 'videoLink']
    });

    if (!videos.length) {
      return res.status(404).json({ error: 'No videos found for the provided playList_heading' });
    }

    const response = [];
    
    videos.forEach(video => {
      const headings = video.Video_heading;
      const links = video.videoLink;
      
      // Assuming both headings and links arrays have the same length
      for (let i = 0; i < headings.length; i++) {
        response.push({
          Video_heading: headings[i],
          videoLink: links[i]
        });
      }
    });

    return res.status(200).json(response);
  } catch (error) {
    console.log('Error fetching videos:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditation-time', async (req, res) => {
  try {
    console.log("..................registerUser...................");

  const { UId} = req.session;
  const { time } = req.query;
  console.log(time, UId);
  
  
    // Fetch the country from the reg table using UId
    const userRegDetails = await reg.findOne({ where: { UId } });

    if (!userRegDetails) {
      return res.status(404).json({ error: 'User registration details not found' });
    }

    const { country } = userRegDetails;

    // Find the meditation time details for the given country
    const meditationTimeDetails = await meditationTime.findOne({ where: { country } });

    if (!meditationTimeDetails) {
      return res.status(404).json({ error: 'Meditation time details not found' });
    }

    const { morning_time_from, morning_time_to, evening_time_from, evening_time_to, morning_video, evening_video, general_video } = meditationTimeDetails.dataValues;

    if (time >= morning_time_from && time <= morning_time_to) {
      return res.json({
        video: morning_video,
        fromTime: morning_time_from,
        toTime: morning_time_to
      });
    } else if (time >= evening_time_from && time <= evening_time_to) {
      return res.json({
        video: evening_video,
        fromTime: evening_time_from,
        toTime: evening_time_to
      });
    } else {
      return res.json({
        video: general_video
      });
    }
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/meditationTimeDetails', async (req, res) => {
  try {
    console.log("..................meditationTimeDetails...................");

  const { UId } = req.session;
  console.log( UId);
  

    // Fetch the country from the reg table using UId
    const userRegDetails = await reg.findOne({ where: { UId } });

    if (!userRegDetails) {
      return res.status(404).json({ error: 'User registration details not found' });
    }

    const { country } = userRegDetails;

    // Find the meditation time details for the given country
    const meditationTimeDetails = await meditationTime.findOne({ where: { country } });

    if (!meditationTimeDetails) {
      return res.status(404).json({ error: 'Meditation time details not found' });
    }

    return res.status(200).json({message:'meditation time details' , meditationTimeDetails});
 
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/zoom_Records', async(req,res)=>{
  try{
    console.log(".............................zoom_Records...................................");

    const {UId} = req.session;
    const {zoom_date,zoom_time} = req.body;
    console.log(UId, zoom_date, zoom_time);

    if(!UId){
      return res.status(401).json({message: 'UId is required'});
    }
     const user = await Users.findOne({where:{UId}});
     if(!user){
      return res.status(404).json({message:'user not found'});
     }
     const zoom = await ZoomRecord.create(
       { UId:user.UId,
        zoom_date,
        zoom_time
       });
      return res.status(200).json({message:'zoom record created successfully'}); 
  } catch(error){
    console.log(error);
    return res.status(500).json('internal server error' , error);
  }
});

router.post('/zoom', async (req, res) => {
  try {
    console.log("..................zoom...................");

  const { zoomdateto,zoomdatefrom, zoomStartTime, zoomStopTime, zoomLink,languages,daysOfWeek } = req.body;
  console.log(zoomdateto,zoomdatefrom, zoomStartTime, zoomStopTime, zoomLink,languages);

  
    const newZoom = await zoom.create({
      zoomdateto,
      zoomdatefrom,
      zoomStartTime,
      zoomStopTime,
      zoomLink,
      languages,
      daysOfWeek
    });

    return res.status(201).json({ message: 'Zoom record created successfully', newZoom });
  } catch (error) {
    console.log('Error creating zoom record:', error);
    return res.status(400).json({ error: 'Error creating zoom record', details: error.message });
  }
});


router.get('/get-zoomclass', async (req, res) => {
  try {
    console.log(".............................get-zoomclass...................................");

    const { UId } = req.session;
    console.log(`UId: ${UId}`);
    const { currentDate, currentDay } = req.query;
    console.log(`currentDate: ${currentDate}, currentDay: ${currentDay}`);

    // Check if required parameters are provided
    if (!UId || !currentDate || !currentDay) {
      return res.status(400).json({ message: 'UId, currentDay, and currentDate are required' });
    }

    // Fetch user data
    const data = await reg.findAll({
      where: {
        UId: UId
      }
    });

    if (data.length === 0) {
      return res.status(404).json({ message: 'User data not found' });
    }
    const userLanguages = data[0]?.languages;
    console.log("language",userLanguages)
    
    const zoomRecords = await zoom.findAll({
      where: {
        zoomdatefrom: {
          [Op.lte]: currentDate // currentDate is greater than or equal to zoomdatefrom
        },
        zoomdateto: {
          [Op.gte]: currentDate // currentDate is less than or equal to zoomdateto
        },
        languages: data[0]?.languages, // Ensure this value is defined
        [Op.and]: sequelize.where(
          sequelize.fn('JSON_CONTAINS', sequelize.col('daysOfWeek'), JSON.stringify(currentDay)),
          1 // Check if currentDay is in daysOfWeek array
        )
      }
    });
    console.log("zoom records",zoomRecords);
    
    // Return Zoom records if found, otherwise send a 404 response
    if (zoomRecords.length > 0) {
      return res.status(200).json(zoomRecords);
    } else {
      return res.status(404).json({ message: 'No zoom records found for the specified date' });
    }
  } catch (error) {
    console.log('Error fetching zoom records:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/button-block', async (req, res) => {
  try {
    console.log("..................button-block...................");

    const { date } = req.body;
    console.log(date);

    // Validate input
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    // Retrieve UId from the session
    const UId = req.session.UId;

    // Check if UId exists in the session
    if (!UId) {
      return res.status(401).json({ message: 'Invalid UId' });
    }

    // Parse the provided date and time
    const providedDate = new Date(date);

    // Extract only the date part (without time)
    const providedDateOnly = new Date(providedDate);
    providedDateOnly.setHours(0, 0, 0, 0);

    // Find the entry with the same UId and date in the timeTracking table
    const existingEntry = await timeTracking.findOne({
      where: {
        UId: UId,
        med_stoptime: {
          [Op.gte]: providedDateOnly, // Ensure med_starttime is on or after the provided date
          [Op.lt]: new Date(providedDateOnly.getTime() + 24 * 60 * 60 * 1000) // Ensure med_starttime is before the next day
        }
      }
    });

    if (existingEntry) {
      // Compare the provided time with the existing med_starttime
      const medStartTime = new Date(existingEntry.med_starttime);

      if (providedDate <= medStartTime) {
        return res.status(200).json({ key: true, message: 'Provided date and time are valid', date });
      } else {
        return res.status(200).json({ key: false, message: 'Provided time is not less than or equal to the existing med_starttime', date });
      }
    } else {
      return res.status(404).json({ key: false, message: 'UId not found or date does not match in timeTracking', UId, date });
    }
  } catch (error) {
    console.log('Error checking date:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/meditation-date', async (req, res) => {
  try {
    console.log("..................meditation-date...................");

    const { UId } = req.body;
    console.log(UId);
    if (!UId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate and parse page query parameter
    
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;
    const limit = 25;

    const offset = (page - 1) * limit;

    const totalCount = await timeTracking.count({ where: { UId } });
    const totalPages = Math.ceil(totalCount / limit);
    const date = await timeTracking.findAll({
      attributes:['med_starttime'],
    where: { UId: UId}});
    //console.log(date);
    const FormatData = date.format('YYYY-MM-DD HH:mm:ss');
    console.log(FormatData);
    const user = await timeTracking.findAll({
      attributes: ['UId', 'med_starttime','ismeditated'],
      where: {
        UId: UId,
        ismeditated:1
      },
      limit,
      offset
    });
   
console.log(user);
    // Format response data and send it
    const responseData = {
      totalPages,
      currentPage: page,
      totalCount,
      data: user
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/listblogs', async (req, res) => {
  try {
    console.log("..................listblogs...................");

    const upcomingEvents = await blogs.findAll({
      order: [['id', 'DESC']],
    });


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
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/global' , async(req,res)=>{
  try{
    console.log("..................global...................");

    const UId = req.session.UId;
    console.log(req.session.UId);
    const { message, messageTime,isAdminMessage,messageDate} = req.body;
    console.log(message, messageTime, isAdminMessage, messageDate);

    if(!UId){
      return res.status(401).json('UId is required');
    }

    const regUser = await maintenance.findOne({ where: { UId, maintenance_payment_status: true } });

    // Check if the user exists in the User table
    const user = await Users.findOne({ where: { UId } });

    // Check if either condition is met
    if (!regUser && !user) {
        return res.status(404).json({ error: 'User not found or maintenance fee not paid' });
    }
    const newMessage = await globalMessage.create({
      UId,
      message,
      messageTime,
      isAdminMessage,
      messageDate,
      messagetype : 'global'
  });
  return res.status(200).json({ message: 'Message created successfully' });
} catch (error) {
    console.log('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
}
});

router.delete('/deleteMsg/:id' , async (req, res) =>{
  try{
    console.log("..................deleteMsg...................");
 
    const  id  = req.params.id;
    console.log(id);
    const message = await globalMessage.findOne({
       where: { 
        id ,
      isAdminMessage: false
    }});
    if(!message){
      return res.status(404).json('user not authenticated ');
    }
    await message.destroy();
    return res.status(200).json('message deleted successfully');
  }
  catch(error){
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/delete-user', async (req, res) => {
  try {
    console.log("..................delete-user...................");

  const { UId } = req.session;
  console.log(UId);
  if (!UId) {
    return res.status(401).json({ message: 'UId is required' });
  }

 
    const user = await reg.findOne({ where: { UId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.user_Status = 'DELETED';
    await user.save();

    const validUser = await Users.findOne({ where: { UId } });
    if (!validUser) {
      return res.status(404).json({ message: 'User not found in Users table' });
    }

    // Update the user's ban status before deleting
    validUser.ban = true;
    validUser.user_Status = 'DELETED';
    await validUser.save();

    const userWithIdOne = await Users.findOne({ where: { UserId: 1 } });
    if (userWithIdOne) {
      userWithIdOne.coupons += validUser.coupons;
      await userWithIdOne.save();
    }

    validUser.coupons = 0;
    await validUser.save();

    await BankDetails.destroy({ where: { UId } });
   //await user.destroy();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Error deleting user' });
  }
});


router.get('/recent-videos', async (req, res) => {
  try {
    const videos = await Video.findAll({
      attributes: ['Video_heading', 'videoLink'],
      order: [['id', 'DESC']],
    });

    if (!videos.length) {
      return res.status(404).json({ error: 'No videos found for the provided playList_heading' });
    }

    const response = [];

    videos.forEach(video => {
      const headings = video.Video_heading;
      const links = video.videoLink;

      // Reverse the order of headings and links arrays for each video object
      for (let i = headings.length - 1; i >= 0; i--) {
        response.push({
          Video_heading: headings[i],
          videoLink: links[i]
        });
      }
    });

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
