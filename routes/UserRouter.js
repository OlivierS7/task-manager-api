const UserController = require('../controllers/UserController')
const { verifySession, authenticate } = require('../auth')
const express = require('express');

UserRouter = express.Router()

UserRouter.post('/users', UserController.post)

UserRouter.post('/users/login', UserController.login)

UserRouter.post('/users/verify-login', UserController.verifyLogin)

UserRouter.patch('/users', authenticate, UserController.patch)

UserRouter.get('/users/me/access-token', verifySession, UserController.getAccessToken)

module.exports = {UserRouter}