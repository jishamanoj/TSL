require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {

    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const zoom = sequelize.define('zoom',{
zoomdateto:{type:DataTypes.STRING},
zoomdatefrom:{type:DataTypes.STRING},
zoomStartTime:{type:DataTypes.STRING},
zoomStopTime:{type:DataTypes.STRING},
zoomLink:{type:DataTypes.STRING},
languages:{type:DataTypes.STRING},
daysOfWeek: {
    type: DataTypes.JSON 
  }
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