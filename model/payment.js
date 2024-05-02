require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const payment = sequelize.define('payment', {
    razorpay_order_id: { type: DataTypes.STRING},
    razorpay_payment_id: { type: DataTypes.STRING},
    razorpay_signature: { type: DataTypes.STRING},   
 },{timestamps:false});


payment.sync({alter:true})
    .then((data) => {
       
        console.log('payment table created');
    })
    .catch((err) => {
        console.log(err);
    });


    


module.exports = payment;