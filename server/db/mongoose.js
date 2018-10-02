const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // use inbuilt promise
mongoose.connect(process.env.MONGOLAB_URI || 'mongodb://localhost:27017/TodoApp',{
    useNewUrlParser: true
});
var env = process.env.NODE_ENV || 'development';

if(env === 'development'){
    process.env.JWT_SECRET = 'dfsfp34930sdsfldmv' // random salt
}


module.exports = {mongoose};