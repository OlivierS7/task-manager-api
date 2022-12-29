const express = require('express')
const cors = require('cors')
const app = express()
const {mongoose} = require('./db/mongoose')

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
};

app.use(cors(corsOptions));

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
            .header('x-access-token', authTokens.accesstoken)
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

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})