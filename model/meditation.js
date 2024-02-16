
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});

const meditation = sequelize.define('meditation',{
    UId: { type: DataTypes.INTEGER},
    session_num: { type: DataTypes.INTEGER,defaultValue:0},
    day : { type: DataTypes.INTEGER,defaultValue:0  },
    cycle : { type: DataTypes.INTEGER,defaultValue: 0   },
    med_starttime : { type: DataTypes.STRING},
    med_stoptime : { type: DataTypes.STRING},
    med_endtime : { type: DataTypes.STRING},

   // message : { type: DataTypes.TEXT}
});

sequelize.sync({alter:true})
    .then((data) => {
       // console.log(data);
        console.log('meditation table created');
    })
    .catch((err) => {
        console.log(err);
    });
module.exports = meditation