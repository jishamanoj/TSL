require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const admin = sequelize.define('admin', {
    username: { type: DataTypes.STRING},
    role: { type: DataTypes.STRING},
    password: { type: DataTypes.STRING},   
 },{timestamps:false});


admin.sync({alter:true})
    .then((data) => {
       
        console.log('admin table created');
    })
    .catch((err) => {
        console.log(err);
    });


    


module.exports = admin;
