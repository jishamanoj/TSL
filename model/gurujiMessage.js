require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});

const gurujiMessage = sequelize.define ('gurujiMessage',{
    UId : { type:DataTypes.INTEGER} ,
    message :{ type:DataTypes.TEXT} ,
    messageTime :{ type: DataTypes.STRING},
    messagetype : { type:DataTypes.STRING},
    messageDate:{ type: DataTypes.STRING},
});
sequelize.sync({alter:true})
    .then((data) => {
       // console.log(data);
        console.log('gurujiMessage table created');
    })
    .catch((err) => {
        console.log(err);
    });
    module.exports =gurujiMessage;