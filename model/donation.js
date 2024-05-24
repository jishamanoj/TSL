require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const donation = sequelize.define('donation', {
    razorpay_order_id: { type: DataTypes.STRING},
    razorpay_payment_id: { type: DataTypes.STRING},
    razorpay_signature: { type: DataTypes.STRING}, 
    UId:{ type: DataTypes.INTEGER}  ,
    amount : { type : DataTypes.DOUBLE},
    payment_date :{ type:DataTypes.STRING},
    payment_time:{ type: DataTypes.STRING},
    donation_payment_status:{ type: DataTypes.BOOLEAN}
 },{timestamps:false});


donation.sync({alter:true})
    .then((data) => {
       
        console.log('donation table created');
    })
    .catch((err) => {
        console.log(err);
    });


    


module.exports = donation;