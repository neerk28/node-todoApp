const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {ObjectID} = require('mongodb');

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
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos', (req, res) => {
    Todo.find().then(docs => {
        res.send({docs});
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send({message: 'ID not found'});
    }
    Todo.findById(id).then(doc => {
        if(!doc){
            return res.status(404).send({message: 'ID not found'});
        }
        res.send({doc});
    }).catch(e => {
        res.status(400).send(e);
    })
})

