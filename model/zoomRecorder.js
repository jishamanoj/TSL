require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const zoomRecord = sequelize.define('zoomRecord', {
    UId: { type: DataTypes.INTEGER},
    zoom_date: { type: DataTypes.STRING},
    zoom_time: { type: DataTypes.STRING},   
 },{timestamps:false});


 zoomRecord.sync({alter:true})
    .then((data) => {
       
        console.log('zoomRecord table created');
    })
    .catch((err) => {
        console.log(err);
    });


    


module.exports = zoomRecord;