const TaskController = require('../controllers/TaskController')
const { authenticate } = require('../auth')
const express = require('express')

TaskRouter = express.Router()

TaskRouter.get('/lists/:listId/tasks', authenticate, TaskController.getAll)

TaskRouter.get('/lists/:listId/tasks/:taskId', authenticate, TaskController.getOne)

TaskRouter.post('/lists/:listId/tasks', authenticate, TaskController.post)

TaskRouter.patch('/lists/:listId/tasks/:taskId', authenticate, TaskController.patch)

TaskRouter.delete('/lists/:listId/tasks/:taskId', authenticate, TaskController.remove)

module.exports = {TaskRouter}