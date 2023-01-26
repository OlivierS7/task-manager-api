const { List, Task, User } = require('../models')

/**
 * POST /users
 * Purpose: Signup
 */
const post = async (req, res) => {
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
}

/**
 * POST /users/login
 * Purpose: Login
 */
const login = async (req, res) => {
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
}

/**
 * GET /users/me/access-token
 * Purpose: Generates and returns an access token
 */
const getAccessToken = async (req, res) => {
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({accessToken})
       }).catch((err) => {
        res.status(400).send(err)
       })
}

module.exports =  {
    post,
    login,
    getAccessToken
}