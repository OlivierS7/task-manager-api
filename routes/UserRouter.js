const UserController = require('../controllers/UserController')
const { verifySession } = require('../auth')
const express = require('express');

UserRouter = express.Router()

UserRouter.post('/users', UserController.post)

UserRouter.post('/users/login', UserController.login)

UserRouter.get('/users/me/access-token', verifySession, UserController.getAccessToken)

module.exports = {UserRouter}