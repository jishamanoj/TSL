require('dotenv').config();
const { DataTypes , Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging:false,
});
const supportcontact = sequelize.define('Supportcontact',{
  Name:{type:DataTypes.STRING},
  Role:{type:DataTypes.STRING},
  PhoneNo:{type:DataTypes.STRING}

},
{
    timestamps: false,
});
sequelize.sync({alter:true})
    .then((data) =>{
        console.log('supportcontact table created');
    })
    .catch((err) =>{
        console.log('error',err);
    });
    module.exports = supportcontact;