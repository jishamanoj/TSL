require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});

const feedback = sequelize.define('feedback' , {
    UId :{type:DataTypes.INTEGER} , 
    feedback :{ type:DataTypes.STRING},
    rating :{type: DataTypes.STRING }
},
{timestamps: false})
sequelize.sync({alter: true})
    .then((data) => {
       // console.log(data);
        console.log('feedback table created');
    })
    .catch((err) => {
        console.log(err);
    });
module.exports = feedback