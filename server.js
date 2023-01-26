const express = require('express')
const cors = require('cors')
const app = express()
const {mongoose} = require('./mongoose')
const {ListRouter}  = require('./routes/ListRouter')
const {TaskRouter}  = require('./routes/TaskRouter')
const {UserRouter}  = require('./routes/UserRouter')

/* Express */
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

app.use('', ListRouter)

app.use('', TaskRouter)

app.use('', UserRouter)

app.listen(3000, () => {
    console.log("Server is listening on port 3000");
})