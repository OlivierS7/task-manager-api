const jwt = require('jsonwebtoken')
const { User } = require('./models')

const authenticate = (req, res , next) => {
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


module.exports = { 
    authenticate,
    verifySession
}