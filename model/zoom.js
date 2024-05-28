require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {

    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const zoom = sequelize.define('zoom',{
zoomdate:{type:DataTypes.STRING},
zoomStartTime:{type:DataTypes.TIME},
zoomStopTime:{type:DataTypes.TIME},
zoomLink:{type:DataTypes.STRING},
},
{
    timestamps: false, 
});
sequelize.sync({alter:true})
    .then((data) => {
        console.log('zoom table created');
    })
    .catch((err) =>{
        console.log(err);
    });
    module.exports =zoom