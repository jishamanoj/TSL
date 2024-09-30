
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const rndUserresponse = sequelize.define('rndUserresponse', {
    UId:{type:DataTypes.STRING},
    Name: { type: DataTypes.STRING},
    question: { type: DataTypes.TEXT },
    ans: { type: DataTypes.STRING},
    count: { type: DataTypes.STRING},
    dateOfJoining: { type: DataTypes.STRING},
    dateOfStarting: { type: DataTypes.STRING},
    date:{ type: DataTypes.STRING},
    category:{type:DataTypes.STRING},
    score:{type:DataTypes.STRING}
},
{
    timestamps: false,
})
rndUserresponse.sync({alter: true}).then((data)=>{
    console.log("rndUserresponse table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = rndUserresponse;