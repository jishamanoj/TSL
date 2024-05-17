require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const blogs = sequelize.define('blogs', {
    blog_name: { type: DataTypes.STRING},
    blog_description: { type: DataTypes.TEXT},
    date: {type: DataTypes.STRING},
    image: {
        type:DataTypes.STRING
    }    
 });


blogs.sync({alter: true})
    .then((data) => {
       
        console.log('blogs table created');
    })
    .catch((err) => {
        console.log(err);
    });


    


module.exports = blogs;