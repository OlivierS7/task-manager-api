const mongoose = require('mongoose')
const lodash = require('lodash')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')

const jwtSecret = "ZYpKhseV0c15b6OLojThKl3ZhLzL8x1frpcQf3fnwo5qzxhatDVnBYGxqQPL"

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'Please enter a first name'],
    minlength: [2, 'Name must be at least 2 characters long']
  },
  lastName: {
    type: String,
    required: [false, 'Please enter a last name'],
    minlength: [2, 'Name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Please enter an email address'],
    unique: true,
    validate: {
      validator: function(value) {
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(value);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(value) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/.test(value);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter and one number'
    }
  },
  sessions: [{
    token: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Number,
        required: true,
    }
  }]
});

/* Instance methods */
UserSchema.methods.toJSON = function() {
    const user = this
    const userObject = user.toObject()

    // return a JSON representation of the user (excludes fields specified below)
    return lodash.omit(userObject, ['firstName', 'lastName', 'password', 'sessions'])
}

UserSchema.methods.generateAccessAuthToken = function() {
    const user = this
    return new Promise((resolve, reject) => {
        // Create the JSON Web Token and return that
        jwt.sign({id: user._id.toHexString()}, jwtSecret, {expiresIn: "15m"}, (err, token) => {
            if (!err) {
                resolve(token)
            } else {
                reject(err)
            }
        })
    })
}

UserSchema.methods.generateRefreshAuthToken = function() {
    // Generate a random 64 byte hex string
    return new Promise((resolve, reject) => {
        crypto.randomBytes(64, (err, buf) => {
            if (!err) {
                let token = buf.toString('hex')
                return resolve(token)
            }
        })
    })
}

UserSchema.methods.createSession = function() {
    let user = this
    // Save refreshToken into the session & database
    // Return refreshToken
    return user.generateRefreshAuthToken().then((refreshToken) => {
        return saveSessionToDatabase(user, refreshToken)
    }).then((refreshToken) => {
        return refreshToken
    }).catch((err) => {
        return Promise.reject('Failed to save session to database.\n', err)
    })
}
/* End Instance methods */

/* Model methods */

UserSchema.statics.getJWTSecret = function() {
    return jwtSecret
}

// Find user by id and token (used in middleware verifySession)
UserSchema.statics.findByIdAndToken = function(_id, token) {
    const user = this
    return User.findOne({
        _id,
        'sessions.token': token
    })
}

UserSchema.statics.findByCredentials = function(email, password) {
    const user = this
    return User.findOne({email}).then((user) => {
        if (!user) {
            return Promise.reject('Invalid email address and/or password.')
        }
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                    resolve(user)
                }
                else {
                    reject()
                }
            })
        })
    })
}

UserSchema.statics.hasRefreshTokenExpired = (expiresAt) => {
    let secondsSinceEpoch = Date.now() / 1000
    if(expiresAt > secondsSinceEpoch) {
        // Not expired
        return false
    } else {
        return true
    }
}
/* End Model methods */

/* Middleware methods */
// Before a user document is save, this code runs
UserSchema.pre('save', function (next) {
    const user = this
    let costFactor = 10
    if(user.isModified('password')) {
        // Generate salt and hash password
        bcrypt.genSalt(costFactor, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash
                next()
            })
        })
    } else {
        next()
    }
})
/* End Middleware methods */


/* Helpers methods */
let saveSessionToDatabase = (user, refreshToken) => {
    // Save session to database
    return new Promise((resolve, reject) => {
        let expiresAt = generateRefreshTokenExpiryTime()
        user.sessions.push({'token': refreshToken, 'expiresAt': expiresAt})
        user.save().catch(err => reject(err))
        return resolve(refreshToken) 
    })
}

let generateRefreshTokenExpiryTime = () => {
    let daysUntilExpire = "10"
    let secondsUntilExpire = daysUntilExpire * 24 * 60 *60
    return Date.now() / 1000 + secondsUntilExpire
}
/* End Helpers methods */

const User = mongoose.model('User', UserSchema)

module.exports = {User}