require('dotenv').config();
const { DataTypes , Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging:false,
});
const departments = sequelize.define('Departments',{
    departments:{type:DataTypes.STRING},
 
 
},
{
    timestamps: false,
});
sequelize.sync({alter:true})
    .then((data) =>{
        console.log('departmets table created');
    })
    .catch((err) =>{
        console.log('error',err);
    });
    module.exports = departments;