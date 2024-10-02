require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,
});

const healthDetail = sequelize.define('healthDetail', {
    UId: {
        type: DataTypes.STRING,
    },
    Dates: {
        type: DataTypes.STRING,
    },
    question: {
        type: DataTypes.TEXT, 
    },
    answers: {
        type: DataTypes.JSON, 
    },
    Rndprequestion: {
        type: DataTypes.BOOLEAN,  
    },
}, {
    timestamps: true, 
});

healthDetail.sync({ alter: true }).then(() => {
    console.log("healthDetail table created or updated");
}).catch((err) => {
    console.error("Error creating table: ", err);
});

module.exports = healthDetail;
