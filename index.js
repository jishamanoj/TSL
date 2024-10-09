const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io')
const session = require('express-session');

app.use(cors());

app.use(express.json())
const sessionMiddleware = session({
    secret: '8be00e304a7ab94f27b5e5172cc0f3b2c575e87d',
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    },
  });
 
  app.use(sessionMiddleware);
app.use('/api/v1', require('./router/routing')); // Corrected the router path

const httpServer = http.createServer(app)



const io = new Server(httpServer,{cors:{origin: "*"}})



module.exports = app