require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const coupondistribution = sequelize.define('coupondistribution', {
    firstName: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      secondName: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      UId:{
        type: DataTypes.INTEGER,
    } ,
    coupons_to_distribute:{
        type: DataTypes.INTEGER,
        allowNull: true,
      defaultValue: 0,
    },
   
    distribution_time:{
         type:DataTypes.STRING
    }
},
 {
    timestamps: true,
})
coupondistribution.sync({alter: true}).then((data)=>{
    console.log(" coupon distribution table created ");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = coupondistribution;