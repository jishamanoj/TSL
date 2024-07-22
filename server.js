

const http = require('http');
const {Server} = require('socket.io')
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');

const app = require('./index');




const sequelize = new Sequelize('sequel', 'root', 'pass@123', {
    dialect: 'mysql'
});


const httpServer = http.createServer(app)

const io = new Server(httpServer, { cors : { origin : "*"}});


io.on('connection', function(soc){
    console.log('connection');
soc.on('fetchusers',()=>{
   
    sequelize.query("SELECT COUNT(id) AS count FROM `regs`", { type: QueryTypes.SELECT }).then(function  (results) {  soc.emit('usersupdate',{results} ); 

})
})
    
})

console.log('qwerty')
sequelize.authenticate()
    .then(() => {
        console.log('Connected to the database');
    })
    .catch((err) => {
        console.error('Unable to connect to the database:', err);
    });

httpServer.listen(3000, () => {
    console.log('Listening on port 3000');
});