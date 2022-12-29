require("dotenv").config();
const mongoose = require('mongoose')
mongoose.Promise = global.Promise

mongoose.set("strictQuery", false);

mongoose.connect(process.env.DB_URL, { useNewUrlParser: true }).then(() => {
    console.log('Connected to database successfully')
}).catch((err) => {
    console.log('Error while connecting to database')
    console.log(err)
})

mongoose.set('strictQuery', false);

module.exports = {
    mongoose
}