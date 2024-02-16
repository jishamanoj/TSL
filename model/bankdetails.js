require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const BankDetails = sequelize.define('bankDetails', {
    AadarNo: { type: DataTypes.STRING,defaultValue:"" },
    IFSCCode: { type: DataTypes.STRING,defaultValue:""},
    branchName: { type: DataTypes.STRING,defaultValue:""},
    accountName: { type: DataTypes.STRING,defaultValue:""},
    accountNo: { type: DataTypes.STRING,defaultValue:""},
    UId: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
});
sequelize.sync()
    .then((data) => {
       // console.log(data);
        console.log('BankDetails table created');
    })
    .catch((err) => {
        console.log(err);
    });
    module.exports =  BankDetails;