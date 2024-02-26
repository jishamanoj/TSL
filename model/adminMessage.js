
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const adminMessage = sequelize.define('adminMessage',{
    UId: { type: DataTypes.INTEGER},
    message: { type: DataTypes.TEXT},
    messageTime: { type: DataTypes.STRING},
    messageId: { type: DataTypes.STRING},
    isAdminMessage:{type: DataTypes.STRING},

});
sequelize.sync({alter:true})
    .then((data) => {
       // console.log(data);
        console.log('adminMessage table created');
    })
    .catch((err) => {
        console.log(err);
    });
    module.exports =adminMessage