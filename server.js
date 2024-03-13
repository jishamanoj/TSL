require('dotenv').config();
const http = require('http');
const {Server} = require('socket.io')
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const broadcast = require('./model/broadcast')
const app = require('./index');
const private = require('./model/privatemsg');
const { Users } = require('./model/validUsers');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
        host: process.env.DB_HOST,
});

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
      origin: '*', // Adjust this to allow specific origins
      methods: ['GET', 'POST'] // Define the methods you wish to allow
    }
  });


  const chatIO = io.of('/'); // Define a new namespace for chat

  chatIO.on('connection', (socket) => {
   //   console.log('Chat connection established');
  
      // Handle chat events here...
      socket.on('chat_message', (message) => {
   //       console.log('Received chat message:', message);
  
          // Convert the message object to a string
          const messageString = JSON.stringify(message);
  
          // Save the message to the database
          broadcast.create({
            message: message.message,
            priority: message.priority,
            time: message.time
        })
              .then(() => {
                 // console.log('Chat message saved to database');
              })
              .catch(err => {
                 // console.error('Error saving chat message to database:', err);
              });
  
          // Broadcast the message to all clients in the chat namespace
          chatIO.emit('chat_message', message);
      });
    }); 

    const personalChatIO = io.of('/chat');

personalChatIO.on('connection', (socket) => {
  //  console.log('Personal chat connection established');

    socket.on('private_message', async ({ recipientUID, message }) => {
      //  console.log('Received private message:', message, 'for recipient UID:', recipientUID);

        if (!recipientUID) {
         //   console.error('Recipient UID is missing');
            return;
        }

        try {
            const recipientUser = await Users.findOne({ where: { UId: recipientUID } });

            if (recipientUser) {
                await private.create({ message, UId: recipientUser.id });
             //   console.log('Private message saved to database');
                socket.to(recipientUser.id).emit('private_message', message);
            } else {
             //   console.log('Recipient user not found with UID:', recipientUID);
            }
        } catch (err) {
           // console.error('Error handling private message:', err);
        }
        //chatIO.emit('private_message', message);
    });
});


  io.on('connection', (socket) => {
    //console.log('Connection established');
  
    socket.on('fetchusers', () => {
      sequelize.query("SELECT COUNT(UserId) AS count FROM regs", { type: QueryTypes.SELECT })
        .then((results) => {
          socket.emit('usersupdate', { results });
        })
        .catch((error) => {
       //   console.error('Error fetching users:', error);
          socket.emit('error', 'Failed to fetch users');
        });
   })
  
  })

//console.log('qwerty')
sequelize.authenticate()
    .then(() => {
        console.log('Connected to the database');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

    server.listen(process.env.SERVER_PORT, () => {
    console.log('Listening on port 5000');
});
