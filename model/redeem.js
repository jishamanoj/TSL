
// require('dotenv').config();
// const { DataTypes, Sequelize } = require('sequelize');
// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
//     dialect: process.env.DB_DIALECT,
//     host: process.env.DB_HOST,
//     logging: false,

// });
// const redeem = sequelize.define('redeem', {
//     firstName: {
//         type: DataTypes.STRING(40),
//         allowNull: false,
//       },
//       secondName: {
//         type: DataTypes.STRING(40),
//         allowNull: true,
//       },
//       UId:{
//         type: DataTypes.INTEGER,
//     } ,
//     distributed_coupons:{
//         type: DataTypes.INTEGER,
//         allowNull: true,
//       defaultValue: 0,
//     },
//     description :{
//         type: DataTypes.STRING,
//     },
//     distribution_time:{
//          type:DataTypes.STRING
//     },
//   //  AadarNo: { type: DataTypes.STRING,defaultValue:"" },
//     IFSCCode: { type: DataTypes.STRING,defaultValue:""},
//     branchName: { type: DataTypes.STRING,defaultValue:""},
//     accountName: { type: DataTypes.STRING,defaultValue:""},
//     accountNo: { type: DataTypes.STRING,defaultValue:""},
// },
//  {
//     timestamps: false,
// })
// redeem.sync({alter: true}).then((data)=>{
//     console.log("redeem table create ");
// })
// .catch((err)=>{
//     console.log(err);
// }
// );

// module.exports = redeem;