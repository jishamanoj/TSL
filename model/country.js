
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const country = sequelize.define('country', {
    name: { type: DataTypes.STRING },
    code: { type: DataTypes.STRING },
    phonecode: { type: DataTypes.STRING },
    flag: { type: DataTypes.STRING }
},
 {
    timestamps: false,
})
country.sync({alter: true}).then((data)=>{
    console.log("country table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = country;
