require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});

const gurujiMessage = sequelize.define ('gorujiMessage',{
    UId : { type:DataTypes.INTEGER} ,
    message :{ type:DataTypes.STRING} ,
    messageTime :{ type: DataTypes.STRING},
    messagetype : { type:DataTypes.STRING},
    message_priority : { type:DataTypes.STRING}
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