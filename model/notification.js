
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const notification = sequelize.define('notification', {
    UId: { type: DataTypes.STRING },
    token: { type: DataTypes.STRING },
   
},
 {
    timestamps: false,
})
notification.sync({alter: true}).then((data)=>{
    console.log("notification table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = notification;