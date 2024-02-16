require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const broadcast = sequelize.define('broadcast', {

    Broadcast_message: { type: DataTypes.STRING },
    priority:{type: DataTypes.STRING},
    time:{type: DataTypes.STRING},
   
},
 {
    timestamps: false,
})
broadcast.sync({alter: true}).then((data)=>{
    console.log("broadcast table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = broadcast;