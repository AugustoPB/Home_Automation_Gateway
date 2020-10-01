require('dotenv').config({ path: './config/.env' })
const Mongoose = require('mongoose').Mongoose

var userDB = new Mongoose()
userDB.connect(process.env.MONGO_USER_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected to Users DB...'))
    .catch(err => console.log(err))

var tokenDB = new Mongoose()
tokenDB.connect(process.env.MONGO_TOKEN_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log('MongoDB connected to RefreshTokens DB...'))
    .catch(err => console.log(err))

module.exports = {userDB, tokenDB}