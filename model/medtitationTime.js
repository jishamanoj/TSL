
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const meditationTime = sequelize.define('meditationTime',{
    country: { type: DataTypes.STRING},
    general_video: { type: DataTypes.STRING},
    morning_time_from: { type: DataTypes.STRING},
    morning_time_to: { type: DataTypes.STRING},
    evening_time_from: { type: DataTypes.STRING},
    evening_time_to: { type: DataTypes.STRING},
    morning_video:{type: DataTypes.STRING},
    evening_video:{type: DataTypes.STRING},

});

sequelize.sync({alter:true})
    .then((data) => {
       // console.log(data);
        console.log('meditationTime table created');
    })
    .catch((err) => {
        console.log(err);
    });
    module.exports =meditationTime