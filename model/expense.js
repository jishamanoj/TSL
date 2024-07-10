const { DataTypes, Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: process.env.DB_DIALECT,
    host: process.env.DB_HOST,
    logging: false,
});

const ashramexpense = sequelize.define('ashramexpense', {
    Expense_Date: {
        type: DataTypes.STRING(40),
        allowNull: true,
    },
    expenseType: {
        type: DataTypes.STRING(40),
        allowNull: true,
    },
    amount: {
        type: DataTypes.INTEGER,
    },
    invoiceUrl: {
        type: DataTypes.JSON,
    },
    name: {
        type: DataTypes.STRING,
    },
    emp_id: {
        type: DataTypes.INTEGER,
    },
    description: {
        type: DataTypes.TEXT,
    }
}, {
    timestamps: false,
});

ashramexpense.sync({ alter: true }).then((data) => {
    console.log("ashram expense table created");
}).catch((err) => {
    console.log(err);
});

module.exports = ashramexpense;