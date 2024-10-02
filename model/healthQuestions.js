require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const questions = require('./question');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,
});

const healthQuestion = sequelize.define('healthQuestion', {
    questions: { type: DataTypes.TEXT }, 
    answers: { type: DataTypes.JSON }, 
}, {
    timestamps: false,
});

healthQuestion.sync({ alter: true })
    .then(() => {
        console.log("healthQuestion table created or updated");
    })
    .catch((err) => {
        console.log("Error creating table: ", err);
    });

module.exports = healthQuestion;
