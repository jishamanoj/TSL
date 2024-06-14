require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const operatorFund = sequelize.define('operatorFund', {
    emp_Id: {
        type: DataTypes.INTEGER
      },
      emp_Name: {
        type: DataTypes.STRING
      },
      amount:{
        type: DataTypes.INTEGER
    } ,
    bill_Image:{
         type:DataTypes.STRING
    },
    date:{
        type: DataTypes.STRING
    }
},
 {
    timestamps: false,
})
operatorFund.sync({alter: true}).then((data)=>{
    console.log("operator Fund table created");
})
.catch((err)=>{
    console.log(err);
}
);
module.exports = operatorFund;