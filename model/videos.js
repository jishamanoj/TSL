

require('dotenv').config();
const { database } = require('firebase-admin');
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,
});

const Video = sequelize.define('video', {
    playList_heading:{
        type: DataTypes.STRING,
        allowNull: false 
    },
    Video_heading:{
        type: DataTypes.STRING,
        allowNull: false 
    },
    videoLink: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    category: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    playList_image: {
        type:DataTypes.STRING
    }   
}, {
    timestamps: false,
});

Video.sync({ alter: true })
    .then(() => {
        console.log("Video table created");
    })
    .catch((err) => {
        console.log(err);
    });

module.exports = Video;
