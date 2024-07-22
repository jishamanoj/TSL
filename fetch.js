const {Sequelize,DataTypes} = require('sequelize');



const sequelize = new Sequelize('sequel', 'root', 'pass@123', {
    dialect: 'mysql'
});

const reg = sequelize.define('reg', {
    first_name: { type: DataTypes.STRING },
    last_name: { type: DataTypes.STRING },
    DOB: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING ,
    unique: true,
    allowNull: false
},
    country: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING ,
        unique: true,
        allowNull: false},
    reference: { type: DataTypes.STRING },
    language: { type: DataTypes.STRING },
    remark: { type: DataTypes.STRING },
    otp: { type: DataTypes.STRING }
}, {
    timestamps: false,
})
// reg.query('SELECT COUNT(id) FROM regs').then((res)=>{
//         console.log(res)
// })