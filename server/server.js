const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {ObjectID} = require('mongodb');
const _ = require('lodash');

var app = express();
var port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        completed: req.body.completed,
        completedAt: req.body.completedAt
    })
    todo.save().then(todo => {
        res.send({message: 'Created', todo});
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos', (req, res) => {
    Todo.find().then(todos => {
        res.send({todos});
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send({message: 'ID not found'});
    }
    Todo.findById(id).then(todo => {
        if(!todo){
            return res.status(404).send({message: 'ID not found'});
        }
        res.send({todo});
    }).catch(e => {
        res.status(400).send(e);
    })
})

app.delete('/todos/:id', (req, res) => {
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send({message: 'ID not found'});
    }
    Todo.findByIdAndRemove(id).then(todo => {
        if(!todo){
            return res.status(404).send({message: 'ID not found'});
        }
        res.send({message: 'Deleted', todo});
    }).catch(e => {
        res.status(400).send(e);
    })
})

app.patch('/todos/:id', (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);

    if(!ObjectID.isValid(id)){
        return res.status(404).send({message: 'ID not found'});
    }

    if(_.isBoolean(body.completed) && body.completed){
        body.completedAt = new Date().getTime();
    }else{
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findByIdAndUpdate(id, {$set: body}, {new: true}).then(todo => {
        if(!todo){
            return res.status(404).send({message: 'ID not found'});
        }
        res.send({message: 'Updated', todo});
    }).catch(e => {
        res.status(400).send(e);
    })
});

//USERS - AUTHENTICATION
app.post('/users', (req, res) =>{
    var body = _.pick(req.body, ['email', 'password']);
    var user = new User(body);
    user.save().then(user => {
        return user.generateAuthToken();
    }).then(token => {
        res.header('x-auth', token).send(user);
    }).catch(e => {
        res.status(400).send(e);
    })
});
