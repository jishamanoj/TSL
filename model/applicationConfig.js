require('dotenv').config();
const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {

    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,

});
const applicationconfig = sequelize.define('applicationconfig',{
reg_page_prompt:{type:DataTypes.STRING},
reg_page_Reff:{type:DataTypes.STRING},
reg_footer_text:{type:DataTypes.STRING},
reg_successcard:{type:DataTypes.STRING},
reg_successcard_phone:{type:DataTypes.STRING},
reg_success_pageHeading:{type:DataTypes.STRING},
reg_success_pageText:{type:DataTypes.TEXT},
reg_success_SMS:{type:DataTypes.TEXT},
reg_email_prompt:{type:DataTypes.TEXT},

},
{
    timestamps: false, 
});
sequelize.sync({alter:true})
    .then((data) => {
        console.log('Applicationconfig table created');
    })
    .catch((err) =>{
        console.log(err);
    });
    module.exports =applicationconfig