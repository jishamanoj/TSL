
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const mahadhanam = sequelize.define('mahadhanam', {
    firstName: {
        type: DataTypes.STRING(40),
        allowNull: false,
      },
      secondName: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      UId:{
        type: DataTypes.INTEGER,
    } ,
    distributed_coupons:{
        type: DataTypes.INTEGER,
        allowNull: true,
      defaultValue: 0,
    },
    description :{
        type: DataTypes.STRING,
    },
    distribution_time:{
         type:DataTypes.STRING
    }
},
 {
    timestamps: false,
})
mahadhanam.sync({alter: true}).then((data)=>{
    console.log("mahadhanam table create ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = mahadhanam;