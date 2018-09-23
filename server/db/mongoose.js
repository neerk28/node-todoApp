const mongoose = require('mongoose');

mongoose.Promise = global.Promise; // use inbuilt promise
mongoose.connect('mongodb://localhost:27017/TodoApp',{
    useNewUrlParser: true
});

module.exports = {mongoose};