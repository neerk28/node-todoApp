const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { ObjectID } = require('mongodb');
const _ = require('lodash');
const authenticate = require('./middleware/authenticate');

var app = express();
var port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})

app.use(bodyParser.json());

//CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');
    // allow preflight
    if (req.method === 'OPTIONS') {
        res.send(200);
    } else {
        next();
    }
})

app.post('/todos', authenticate.authenticate, (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        completed: req.body.completed,
        completedAt: req.body.completedAt,
        _creator: req.user._id
    })
    todo.save().then(todo => {
        res.send({ message: 'Created', todo });
    }).catch(e => {
        res.status(400).send(e);
    })
});

//return todos created by that user
app.get('/todos', authenticate.authenticate, (req, res) => {
    var searchField = req.query.search;
    var sortField = req.query.sort || 'text';
    var sortOrder = req.query.order || 'asc';
    Todo.find({
        _creator: req.user._id,
    }).then(todos => {
        var filteredTodo = todos.filter(element => {
            if(element.text.includes(searchField)){
                return element;
            };
        })
        res.send(_.orderBy(filteredTodo, [sortField], [sortOrder]));
    }).catch(e => {
        res.status(400).send(e);
    })
});

app.get('/todos/:id', authenticate.authenticate, (req, res) => {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(404).send({ message: 'ID not found' });
    }
    Todo.findOne({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if (!todo) {
            return res.status(404).send({ message: 'ID not found' });
        }
        res.send({todo});
    }).catch(e => {
        res.status(400).send(e);
    })
})

app.delete('/todos/:id', authenticate.authenticate, (req, res) => {
    var id = req.params.id;
    if (!ObjectID.isValid(id)) {
        return res.status(404).send({ message: 'ID not found' });
    }
    Todo.findOneAndRemove({
        _id: id,
        _creator: req.user._id
    }).then(todo => {
        if (!todo) {
            return res.status(404).send({ message: 'ID not found' });
        }
        res.send({ message: 'Deleted', todo });
    }).catch(e => {
        res.status(400).send(e);
    })
})

app.patch('/todos/:id', authenticate.authenticate, (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id)) {
        return res.status(404).send({ message: 'ID not found' });
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate({
        _id: id,
        _creator: req.user._id
    },
        { $set: body },
        { new: true }
    ).then(todo => {
        if (!todo) {
            return res.status(404).send({ message: 'ID not found' });
        }
        res.send({ message: 'Updated', todo });
    }).catch(e => {
        res.status(400).send(e);
    })
});

//USERS - AUTHENTICATION
app.post('/users', (req, res) => {
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


app.get('/users/me', authenticate.authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(body.email, body.password).then(user => {
        user.generateAuthToken().then(token => {
            res.header('x-auth', token).send(user);
        })
    }).catch(e => {
        res.status(401).send();
    })
});

app.delete('/users/me/token', authenticate.authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send();
    }).catch(e => {
        res.status(400).send();
    })
})

app.get('/', (req, res) => {
    var json = {
        CREATE_USER: 'POST /users  - pass in email and password',
        GET_USER_BY_TOKEN: 'GET /users/me  - pass token as x-auth in header',
        CREATE_TODO: 'POST /todos  - pass in text and x-auth',
        GETALL_TODOS: 'GET /todos?sort=completed&&order=desc&&search=b  - pass in x-auth',
        GET_TODO_BY_ID: 'GET /todos  - pass in x-auth and id in url',
        UPDATE_TODO_BY_ID: 'PATCH /todos  - pass in x-auth, id in url and data in body',
        DELETE_TODO_BY_ID: 'DELETE /todos  - pass in x-auth and id in url'
    }
    res.send(JSON.stringify(json, undefined, 2));
})

/* sort using mongodb features
 var sortAttribute = req.query.sort || 'text';
    var sortOrder = req.query.order || 'asc';
    var value;
    if(sortOrder === 'asc'){
        value = 1;
    }else if(sortOrder === 'desc'){
        value = -1;
    }
    var sortField;
    if (sortAttribute === 'completed') {
        sortField = { completed: value };
    } else if (sortAttribute === 'completedAt') {
        sortField = { completedAt: value };
    } else {
        sortField = { text: value };
    }
    Todo.find({
        _creator: req.user._id,
    //    text: /searchField/
    }).sort(sortField).exec((err, todos) => {
        if (err) {
            res.status(400).send(err);
        }
        res.send({ todos });
    });
 */