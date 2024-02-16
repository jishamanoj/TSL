
require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});

const Users = sequelize.define(
  'Users',
  {
    UserId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    secondName: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    DOB: {
      type: DataTypes.STRING(40),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    DOJ:{
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    ReferrerID: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    Level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    node_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    reserved_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    coupons: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    distribute: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    distributed_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ban: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    UId:{
        type: DataTypes.INTEGER,
    },
    user_Status:{
      type: DataTypes.STRING,
      
    }
  },
  {
    tableName: 'Users',
    timestamps:false // Specify the table name here
  }
);

sequelize
  .sync({alter: true})
  .then(() => {
    console.log('Users table created');
  })
  .catch((err) => {
    console.error('Error syncing Users table:', err);
  });

module.exports = {Users,sequelize};

