Welcome to our quiz project ! The goal is to make a quiz website which is inspired by app like :
- popSauce
- Kahoot

## Table of contents
- [Introduction](#introduction)
- [Structure](#structure)
- [Backend](#backend)
- [Socket.io](#socket.io)
- [Frontend](#frontend)
- [Run the project](#run-the-project)
---
## Introduction

The app uses `Socket.io` (Websocket) to make a continuous connection between the website and the users.
Currently, the user can :
- Create an account and log in
- Create and delete questions
- create rooms to play
- Join another room
  
---

## Structure
The project has two main directories, the front and the back. We uses `Angular` for the front part, `Node.js` for the back part and `MongoDB` to manage datas.

---

## Backend
The backend part has a main file : `app.js` that will launch and manage everything.
```js
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
```

### Authentification
The auth part is manage by a `REST API`, with many routes to create an account, login, logout, etc...
```js
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
  
    try {
      const user = await User.create({ username, password: hashedPassword });
      res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
      res.status(400).json({ error: 'Username already exists' });
    }
  }),
  
  app.post('/login', async (req, res) => {
    const { username, password, rememberMe } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
  
    req.session.userId = user._id;
  
    if (rememberMe) {
      req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30; // 30 days
    } else {
      req.session.cookie.expires = false; // Session cookie
    }
  
    res.json({ message: 'Logged in successfully' });
  }),
  
  app.get('/protected', authMiddleware, (req, res) => {
    // res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.json({ message: 'This is a protected route' });
  }),
  
  app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Could not log out, please try again' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  })

  app.get('/isLoggedIn', (req, res) => {
    if (req.session.userId) {
      res.status(200);
      res.json({ isLoggedIn: true });
    } else {
      res.status(200);
      res.json({ isLoggedIn: false });
    }
```
We also have an `Auth middleware` that is used to verify that the user is connected. 
```js
authMiddleware: (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Access denied' });
    }
    next();
  }
```

### Questions
The questions is also managed by a `REST API`, to create, display and delete questions
```js
app.get("/questions", authMiddleware, async (req, res) => {
    try {
      const questions = await Question.find();
      res.send(questions);
    } catch (error) {
      res.status(500).send;
    }
  });

  app.get("/question", async (req, res) => {
    try {
      const question = await Question.aggregate([{ $sample: { size: 1 } }]);
      res.send(question);
    } catch (error) {
      res.status(500).send;
    }
  });

  app.post("/question", authMiddleware, async (req, res) => {
    try {
      const question = new Question(req.body);
      await question.save().catch((error) => console.log(error));
      res.send(question);
    } catch (error) {
      res.status;
    }
  });

  app.put("/question/:id", authMiddleware, async (req, res) => {
    try {
      await Question.findByIdAndUpdate(req.params.id, req.body);
      res.send({message: "Question updated"});
    } catch (error) {
      res.status(500).send;
    }
  });

  app.delete("/question/:id", authMiddleware, async (req, res) => {
    try {
      await Question.findByIdAndDelete(req.params.id);
      res.send({message: "Question deleted"});
    } catch (error) {
      res.status(500).send;
    }
  });
```

The questions used in our quiz can be decomposed by three differents parts : 
- The wording (the answer of the question)
- The answers (the answers the user can choose)
- The correct answer

```js
Question: mongoose.model(
    "question",
    new mongoose.Schema({
      wording: { type: String, required: true },
      answers: { type: [String] },
      correctAnswers: { type: [String], required: true },
    })
  )
```

### Socket.io
The make the logic of the game, we uses `Socket.io`, it's goal is to manage :
- The rooms
```js
// User creates a new room
     socket.on('createRoom', ({name, roomName, subject}) => {
         if (!name) {
             name = generateGuestName();
         }
         if (roomExist(roomName)) {
             socket.emit('error', buildMsg(ADMIN, `Room ${roomName} already exists`));
         } else {
             rooms[roomName] = { users: [], quizStarted: false};
             socket.join(roomName);
             activateUser(socket.id, name, roomName);
             socket.emit(`roomCreated`, roomName);
             io.to(roomName).emit('roomUsers', {
                 room: roomName,
                 users: getUsersInRoom(roomName),
                 subject: subject
             });
             // Update room lists for everyone
             io.emit('roomList', {
                 rooms: getAllActiveRooms()
             })
         }
     });

     // User joins a room
     socket.on('joinRoom', ({name, roomName, subject}) => {
         if (!name) {
             name = generateGuestName();
         }
         if (roomExist(roomName)) {
             const user = activateUser(socket.id, name, roomName);
             socket.join(roomName);
             rooms[roomName].users.push(user);
             console.log(`User ${socket.id} joined room : ${roomName}`);
             io.to(roomName).emit('userJoined', socket.id)
             io.to(roomName).emit('roomUsers', {
                 room: roomName,
                 users: getUsersInRoom(roomName),
                 subject: subject
             })
             // To uer who joined room
             socket.emit('message', buildMsg(ADMIN, `You joined the room ${roomName}`), roomName)
             // To everyone else
             socket.broadcast.to(roomName).emit('message', buildMsg(ADMIN, `${roomName} joined room;`), roomName)
         } else {
             socket.emit('error', buildMsg(ADMIN, `${roomName} not found`));
         }
     })

     // User quit room
     socket.on('quitRoom', ({username, roomName}) => {
         const prevRoom = roomName;
         if (prevRoom) {
             socket.leave(prevRoom);
             // Tell the users in a room that someone leaved
             io.to(prevRoom).emit('message', buildMsg(ADMIN, `${username} leaved room`), roomName);
             // Cannot update previous room users list after the state update in activate user
             io.to(prevRoom).emit('userList', {
                 users: getUsersInRoom(prevRoom)
             })
         }
     })
```
- The quiz and game logic
```js
socket.on('startQuiz', async ({roomName}) => {

         const user = getUser(socket.id)
         resetUsersAnswers(rooms[roomName].users)
         let question = await getNewQuestion(io, roomName, socket, user);

         // Listen to user responses :
         socket.on('submitAnswer', ({userAnswer}) => {
             user.points = 0;
             user.hasAnswered = true;
             if (user) {
                 if (isAnswerCorrect(userAnswer, question[0].correctAnswers)) {
                     user.points += 1000;
                     io.to(roomName).emit('correctAnswer', {user});
                 } else {
                     io.to(roomName).emit('incorrectAnswer', {user});
                 }
                 let hasEveryoneAnswered = true;
                 rooms[roomName].users.forEach((user) => {
                     if (!user.hasAnswered) {
                         hasEveryoneAnswered = false
                     }
                 })
                 if (hasEveryoneAnswered) {
                     io.to(roomName).emit('answer', {answer: question[0].correctAnswers[0]});
                     setTimeout(async() => {
                         resetUsersAnswers(rooms[roomName].users)
                         question = await getNewQuestion(io, roomName, socket)
                     }, 5000)
                 }
             }
         })
     })
```
---

## Frontend
The `Frontend` part is made with `Angular`. We choose Angular because of tits simplicity to creates and manages many components.
Currently, we have a component per page. To navigate between pages, we used a router : `app-routting-module`

### Services
To make the connection between the front part and the back part, we used services that connect to the `routes` we described in the backend part. 
Let's see the `question.service` for instance : 
```js
export class QuestionService {
  private apiUrl = 'http://localhost:3000/';

  constructor(private http: HttpClient) { }

  getQuestions(): Observable<any> {
    return this.http.get(this.apiUrl + "questions", { withCredentials: true });
  }

  createQuestion(question: any): Observable<any> {
    return this.http.post(this.apiUrl + "question", question, { withCredentials: true });
  }

  updateQuestion(question: any): Observable<any> {
    return this.http.put(this.apiUrl + "question/" + question._id, question, { withCredentials: true });
  }

  deleteQuestion(id: number): Observable<any> {
    return this.http.delete(this.apiUrl + "question/" + id, { withCredentials: true });
  }
}
```

For the `websocket` part, it is even more simple, we only have to describe the url used by `Socket.io` :
```js
export class WebsocketService {

  wsUrl = "ws://localhost:3000";

  constructor() { }

  connect() {
    return io(this.wsUrl)
  }
}
```
We can also see the connection part at the end.

### Displaying informations 
After we are connected to the `backend` thanks to the `servcies`, we have to uses the informations we gathered, let's see a function used in the `hubroom component` as an exemple :
```js
setEvents() {
    this.socket.on('connect', this.onConnect);
    this.socket.on('disconnect', this.onDisconnect);
    this.socket.on('roomList', ({ rooms }: any) => {
      this.rooms = [];
      for (const [key, value] of Object.entries(rooms)) {
        console.log(value);
        if (typeof value === 'object') {
          this.rooms.push({ ...value, roomName: key });
        }
      }
    });
    this.socket.on('connect_error', (err: any) => {
      console.log(`connect_error due to ${err.message}`);
    });
    this.socket.on('error', (error: any) => {
      console.log(error.name + ' ' + error.text + ' ' + error.time);
    });
  }
```
We then uses launch this function at the start of the app, in the `ngOnInit()` part :
```js
ngOnInit(): void {
    this.socket = this.websocketService.connect();
    this.setEvents();

    this.authService.isLoggedIn().then((response) => {
      this.isLoggedIn = response.isLoggedIn;
    });
  }
```

We can also see another exemple of a function that is directly used in the `HTML` : 
```js
onCreateRoom(): void {
    this.router.navigate(['/room/', this.roomName]);
  }
```

```HTML
<button (click)="onCreateRoom()">Créer</button>
```

---
## Run the project

Go to the backend part and install depedencies :

```bash
cd ./back
npm install
```

Go to the frontend part and install depedencies :

```bash
cd ./front
npm install
```

Go to the root of the project to launch the docker compose (don't forget to launch Docker Desktop before)

```bash
cd ..
Docker compose up --build -d
```
