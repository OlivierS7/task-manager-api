const express = require('express')
const cors = require('cors')
const app = express()
const {mongoose} = require('./db/mongoose')

const { List, Task } = require('./db/models')

/* Load middleware */
app.use(express.json())

/* Cors Headers Middleware */
const whitelist = ['http://localhost:3000', 'http://localhost:4200'];
app.options('*', cors());
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

/**
 * GET /lists
 * Purpose: Get all lists
 */
app.get('/lists', (req, res) => {
    List.find({}).then((lists) => {
        res.send(lists)
    })
})

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post('/lists', (req, res) => {
    let newList = new List({
        title: req.body.title
    })
    newList.save().then((list) => {
        res.send(list)
    })
})

/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id', (req, res) => {
    List.findByIdAndUpdate({_id: req.params.id}, {
        $set: req.body
    }).then(() => {
        res.sendStatus(200)
    })
})

/**
 * PATCH /lists/:id
 * Purpose: Delete a specified list
 */
app.delete('/lists/:id', (req, res) => {
    List.findByIdAndRemove({
        _id: req.params.id
    }).then((removedList) => {
        res.send(removedList)
    })
})

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks that belong to a specified list
 */
 app.get('/lists/:listId/tasks', (req, res) => {
    Task.find({
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks)
    })
})

/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: Get all tasks that belong to a specified list
 */
 app.get('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((tasks) => {
        res.send(tasks)
    })
})

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task in a specified list
 */
 app.post('/lists/:listId/tasks', (req, res) => {
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId,
    })
    newTask.save().then((task) => {
        res.send(task)
    })
})

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
 app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findByIdAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    }, {
        $set: req.body
    }).then(() => {
        res.sendStatus(200)
    })
})

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a specified list
 */
 app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findByIdAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removedList) => {
        res.send(removedList)
    })
})

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})