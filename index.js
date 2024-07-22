const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http');
const { Server } = require('socket.io')


app.use(cors());

app.use(express.json())

app.use('/api', require('./router/routing')); // Corrected the router path





const httpServer = http.createServer(app)



const io = new Server(httpServer,{cors:{origin: "*"}})



module.exports = app