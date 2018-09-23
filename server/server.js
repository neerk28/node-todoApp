const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

var app = express();

app.listen(3000, () => {
    console.log('Server started on port 3000');
})

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        completed: req.body.completed,
        completedAt: req.body.completedAt
    })
    todo.save().then(doc => {
        res.send(doc);
    }, (error) => {
        res.status(400).send(error);
    });
});

