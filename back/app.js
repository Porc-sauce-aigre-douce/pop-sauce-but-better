require('dotenv').config({ path: __dirname + "/.env"});
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {Server} = require("socket.io");
const { onConnection } = require("./websocket/websocketServer");

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

app.all("*", (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With, X-HTTP-Method-Override, Accept');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
  }
}));

require('./auth/routes')(app);
require('./questions/routes')(app);
require('./user/routes')(app);

const PORT = process.env.PORT || 3000;
const expressServer = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

mongoose.connection.once('open', () => {
  console.log('MongoDB connected');
});

// Cors information
const io = new Server(expressServer, {
  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
})

io.engine.on('connection_error', (err) => {
  console.log(err.req);       // the request object
  console.log(err.code);      // the error code
  console.log(err.message);   // the error message
  console.log(err.context);   // some additional error context
})

const webSocketConnect = async (socket) => {
  onConnection(io, socket)
}

io.on('connection', webSocketConnect)