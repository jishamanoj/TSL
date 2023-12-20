require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
        host: process.env.DB_HOST,
    logging: false,

});
const questions = sequelize.define('questions', {
    question: { type: DataTypes.TEXT },
},
 {
    timestamps: false,
})
questions.sync({alter: true}).then((data)=>{
    console.log("questions table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = questions;
