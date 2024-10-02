
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const rnd = sequelize.define('rnd', {
    category:{type:DataTypes.STRING},
    type: { type: DataTypes.STRING},
    question: { type: DataTypes.TEXT },
    ans1: { type: DataTypes.STRING},
    ans2: { type: DataTypes.STRING},
    ans3: { type: DataTypes.STRING},
    ans4: { type: DataTypes.STRING},
    ans5:{ type: DataTypes.STRING},
    ans6:{ type: DataTypes.STRING},
    ans7:{ type: DataTypes.STRING},
    ans8:{ type: DataTypes.STRING},
    ans9:{ type: DataTypes.STRING},
    ans10:{ type: DataTypes.STRING},
    ans1_score:{ type: DataTypes.INTEGER},
    ans2_score:{ type: DataTypes.INTEGER},
    ans3_score:{ type: DataTypes.INTEGER},
    ans4_score:{ type: DataTypes.INTEGER},
    ans5_score:{ type: DataTypes.INTEGER},
    ans6_score:{ type: DataTypes.INTEGER},
    ans7_score:{ type: DataTypes.INTEGER},
    ans8_score:{ type: DataTypes.INTEGER},
    ans9_score:{ type: DataTypes.INTEGER},
    ans10_score:{ type: DataTypes.INTEGER}   

},
 {
    timestamps: false,
})
rnd.sync({alter: true}).then((data)=>{
    console.log("rnd table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = rnd;