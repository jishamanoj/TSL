const reg = require('./model/registration')



reg.findAll().then(users => console.log(users))