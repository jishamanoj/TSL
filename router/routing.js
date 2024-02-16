const express = require("express");
const router = express.Router();
//const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
//app.use(bodyParser())
app.use(cors())
app.use('/admin',require('../controller/AdminController'));
app.use('/superadmin',require('../controller/superAdminController'));
app.use('/User',require('../controller/User'));
//app.use('/payment',require('../controller/count'));
module.exports = app;