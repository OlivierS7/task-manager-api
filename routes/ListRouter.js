const ListController = require('../controllers/ListController')
const { authenticate } = require('../auth')
const express = require('express')

ListRouter = express.Router()

ListRouter.get('/lists', authenticate, ListController.get)

ListRouter.post('/lists', authenticate, ListController.post)

ListRouter.patch('/lists/:id', authenticate, ListController.patch)

ListRouter.delete('/lists/:id', authenticate, ListController.remove)

module.exports = {ListRouter}