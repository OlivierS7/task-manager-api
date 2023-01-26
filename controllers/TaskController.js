const { List, Task } = require('../models')

/**
 * GET /lists
 * Purpose: Get all lists that belong to the authenticated user
 */
const getAll = async (req, res) => {
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // User authenticated because a list was found so he can view the tasks
            return true
        }
        return false
    }).then((canViewTasks) => {
        if (canViewTasks) {
            Task.find({
                _listId: req.params.listId
            }).then((tasks) => {
                res.send(tasks)
            })
        } else {
            res.sendStatus(404)
        }
    })
}

/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: Get all tasks that belong to a specified list
 */
const getOne = async (req, res) => {
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // User authenticated because a list was found so he can view the specified task
            return true
        }
        return false
    }).then((canViewTask) => {
        if (canViewTask) {
            Task.findOne({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((tasks) => {
                res.send(tasks)
            })
        } else {
            res.sendStatus(404)
        }
    })
}

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task in a specified list
 */
const post = async (req, res) => {
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // User authenticated because a list was found so he can create a new task
            return true
        }
        return false
    }).then((canCreateTask) => {
        if (canCreateTask) {
            let newTask = new Task({
                title: req.body.title,
                _listId: req.params.listId,
            })
            newTask.save().then((task) => {
                res.send(task)
            })
        } else {
            res.sendStatus(404)
        }
    })
}

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
const patch = async (req, res) => {
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // User authenticated so he can update the specified task
            return true
        }
        return false
    }).then((canUpdateTask) => {
        if(canUpdateTask) {
            Task.findOneAndUpdate({
                _id: req.params.taskId,
                _listId: req.params.listId
            }, {
                $set: req.body
            }).then(() => {
                res.send({ message: 'Updated successfully.' })
            })
        } else {
            res.sendStatus(404)
        }
    })    
}

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a task in a specified list
 */
const remove = async (req, res) => {
    List.findOne({
        _id: req.params.listId,
        _userId: req.user_id
    }).then((list) => {
        if (list) {
            // User authenticated so he can remove the specified task
            return true
        }
        return false
    }).then((canDeleteTask) => {
        if (canDeleteTask) {
            Task.findByIdAndRemove({
                _id: req.params.taskId,
                _listId: req.params.listId
            }).then((removedList) => {
                res.send(removedList)
            })
        } else {
            res.sendStatus(404)
        }
    })
}

module.exports =  {
    getAll,
    getOne,
    post,
    patch,
    remove
}