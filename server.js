const express = require('express')
const cors = require('cors')
const app = express()
const {mongoose} = require('./db/mongoose')
const jwt = require('jsonwebtoken')

const { List, Task, User } = require('./db/models')

/* MIDDLEWARE */

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
  exposedHeaders: ['x-access-token', 'x-refresh-token']
};

app.use(cors(corsOptions));

/* Check if the request hase a valid JWT access token */
let authenticate = (req, res , next) => {
    let accessToken = req.header('x-access-token')

    jwt.verify(accessToken, User.getJWTSecret(), (err, decoded) => {
        if(err) {
            // JWT invalid - DO NOT AUTHENTICATE
            res.status(401).send(err)
        } else {
            req.user_id = decoded.id
            next()
        }
    })
}

/* Verify Refresh Token Middleware */
let verifySession = (req, res, next) => {
    let refreshToken = req.header('x-refresh-token')
    let _id = req.header('_id')

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            })
        }
        req.user_id = user._id
        req.userObject = user
        req.refresh_token = refreshToken
        let isSessionValid = false
        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    isSessionValid = true
                }
            }
        })

        if (isSessionValid) {
            next()
        } else {
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }  
    }).catch((err) => {
        res.status(401).send(err)
    })
}

/* END MIDDLEWARE */

/**
 * GET /lists
 * Purpose: Get all lists that belong to the authenticated user
 */
app.get('/lists', authenticate, (req, res) => {
    List.find({
        _userId: req.user_id
    }).then((lists) => {
        res.send(lists)
    })
})

/**
 * POST /lists
 * Purpose: Create a list
 */
app.post('/lists', authenticate, (req, res) => {
    let newList = new List({
        title: req.body.title,
        _userId: req.user_id
    })
    newList.save().then((list) => {
        res.send(list)
    })
})

/**
 * PATCH /lists/:id
 * Purpose: Update a specified list
 */
app.patch('/lists/:id', authenticate, (req, res) => {
    List.findByIdAndUpdate({_id: req.params.id, _userId: req.user_id}, {
        $set: req.body
    }).then(() => {
        res.send({'message': 'Updated successfully'})
    })
})

/**
 * DELETE /lists/:id
 * Purpose: Delete a specified list and all the tasks that are in the list
 */
app.delete('/lists/:id', authenticate, (req, res) => {
    List.findByIdAndRemove({
        _id: req.params.id,
        _userId: req.user_id
    }).then((removedList) => {
        res.send(removedList)
        deleteTaskFromList(removedList._id)
    })
})

/**
 * GET /lists/:listId/tasks
 * Purpose: Get all tasks that belong to a specified list
 */
 app.get('/lists/:listId/tasks', authenticate, (req, res) => {
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
})

/**
 * GET /lists/:listId/tasks/:taskId
 * Purpose: Get all tasks that belong to a specified list
 */
 app.get('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
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
})

/**
 * POST /lists/:listId/tasks
 * Purpose: Create a task in a specified list
 */
 app.post('/lists/:listId/tasks', authenticate, (req, res) => {
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
})

/**
 * PATCH /lists/:listId/tasks/:taskId
 * Purpose: Update an existing task
 */
 app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
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
})

/**
 * DELETE /lists/:listId/tasks/:taskId
 * Purpose: Delete a specified list
 */
 app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
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
    
})

/**
 * POST /users
 * Purpose: Signup
 */
app.post('/users', (req, res) => {
    let body = req.body
    let newUser = new User(body)
    newUser.save().then(() => {
        return newUser.createSession()
    }).then((refreshToken) => {
        // Session created successfully / Now generate an access auth token for the user
        return newUser.generateAccessAuthToken().then((accessToken) => {
            // Access token generated successfully / return an object containing the auth tokens
            return {accessToken, refreshToken}
        })
    }).then((authTokens) => {
        // Construct & send the response to the user with their auth tokens in the header and the user object in the body
        res.header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser)
    }).catch((error) => {
        res.status(400).send(error)
    })
})

/**
 * POST /users/login
 * Purpose: Login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email
    let password = req.body.password
    
    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
             // Session created successfully / Now generate an access auth token for the user
             return user.generateAccessAuthToken().then((accessToken) => {
                // Access token generated successfully / return an object containing the auth tokens
                return {accessToken, refreshToken}
            })
        }).then((authTokens) => {
            // Construct & send the response to the user with their auth tokens in the header and the user object in the body
            res.header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user)
        }).catch((error) => {
            res.status(400).send(error)
        })
    }).catch((error) => {
        res.status(400).send(error)
    })
})

/**
 * GET /users/me/access-token
 * Purpose: Generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
   req.userObject.generateAccessAuthToken().then((accessToken) => {
    res.header('x-access-token', accessToken).send({accessToken})
   }).catch((err) => {
    res.status(400).send(err)
   })
})

/* Helper Methods */
let deleteTaskFromList = (_listId) => {
    Task.deleteMany({
        _listId
    }).then()
}

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})