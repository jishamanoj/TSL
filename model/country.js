const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize('sequel', 'root', 'pass@123', {
    dialect: 'mysql'
});
const country = sequelize.define('country', {
    name: { type: DataTypes.STRING },
    code: { type: DataTypes.STRING },
    phonecode: { type: DataTypes.STRING },
    flag: { type: DataTypes.STRING }
}, {
    timestamps: false,
})
country.sync({alter: true}).then((data)=>{
    console.log("country table create ");
})
.catch((err)=>{
    console.log(err);
});
module.exports = country;