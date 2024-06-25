import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const PORT = process.env.PORT || 8080;
const ADMIN = 'Admin';
const app = express();

const rooms = {};

app.use(express.static(path.join(__dirName, "public")));

const expressServer = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

const UsersState = {
    users:[],
    setUsers: function (newUsersArray) {
        this.users = newUsersArray;
    }
}

// Cors information
const io = new Server(expressServer, {
    cors: {
        origin: "*",
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        preflightContinue: false,
        optionsSuccessStatus: 204
    }
})

const questions = [
    {questionQuiz: `D'où vient la citation "Le roi des pirates, ce sera moi !"` , answers: ``, correctAnswers: `One Piece`},
    {questionQuiz: `Comment s'appelle le personnage principal de One Piece ?`, answers: ``, correctAnswers: `Luffy`}
];

function generateQuestion(no) {
    const questions = [
        {question: `D'où vient la citation "Le roi des pirates, ce sera moi !` , answers: ``, correctAnswers: `One Piece`},
        {question: `Comment s'appelle le personnage principal de One Piece ?`, answers: ``, correctAnswers: `Luffy`}
    ];

    const selectedQuestions = [];
    for (let i = 0; i < no; i++) {
        const randomIndex = Math.floor(Math.random() * questions.length);
        selectedQuestions.push(questions[randomIndex]);
    }
    console.log('question : ', selectedQuestions);
    return selectedQuestions;
}

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    socket.emit('roomList', {
        rooms: getAllActiveRooms()
    })

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

    socket.on('startQuiz', ({roomName}) => {
        const randomIndex = Math.floor(Math.random() * questions.length);
        const selectedQuestions = questions[randomIndex];
        const question = selectedQuestions.questionQuiz;
        const answers = selectedQuestions.answers;
        const correctAnswers = selectedQuestions.correctAnswers;

        console.log('question : ', selectedQuestions);
        io.to(roomName).emit('question', {question})

        // Listen to user responses :
        socket.on('submitAnswer', ({userAnswer}) => {
            const user = getUser(socket.id)
            user.points = 0;
            if (user) {
                if (isAnswerCorrect(userAnswer, correctAnswers)) {
                    user.points += 1000;
                    io.to(roomName).emit('correctAnswer', {user});
                } else {
                    io.to(roomName).emit('incorrectAnswer', {user});
                }
            }
        })
    })

    // Listening or message event
    socket.on('message', ({name, text, roomName}) => {
        if (roomExist(roomName)) {
            io.to(roomName).emit('message', buildMsg(name, text));
        }
    })

    // Listening for activity
    socket.on('activity', (name, roomName) => {
        if (roomExist(roomName)) {
            socket.broadcast.to(roomName).emit('activity', name);
        }
    })

    socket.on('disconnect', (roomName) => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);
        if (user) {
            io.to(roomName).emit('message',
                buildMsg(ADMIN, `${user.name} disconnected`), roomName);
            io.to(roomName).emit('userList', {
                users: getUsersInRoom(roomName)
            })
            io.to(roomName).emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }
        console.log(`User ${socket.id} disconnected`);
    })
})

io.engine.on('connection_error', (err) => {
    console.log(err.req);       // the request object
    console.log(err.code);      // the error code
    console.log(err.message);   // the error message
    console.log(err.context);   // some additional error context
})

// Function that handle messages
function buildMsg(name, text) {
    return {
        name,
        text,
        time: new Intl.DateTimeFormat('fr-FR', {
            timeZone: "Europe/Paris",
            hour: "numeric",
            minute: "numeric",
            second: "numeric"
        }).format(new Date())
    }
}

function buildQuestion(question, answers, correctAnswers) {
    return {
        question,
        answers,
        correctAnswers
    }
}

// USERS FUNCTIONS

function activateUser(id, name, room) {
    const user = {id, name, room};
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id),
        user
    ]);
    return user;
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

function getUsersInRoom(roomName) {
    if (rooms[roomName]) {
        return rooms[roomName].users;
    }
    return null;
}

function getAllActiveRooms() {
    return rooms
}

function generateGuestName() {
    return `Guest_${Math.floor(Math.random() * 10000)}`;
}

function isAnswerCorrect(userAnswer, correctAnswer) {
    if (userAnswer === correctAnswer) return true
}

function roomExist(roomName) {
    if (rooms[roomName]) {
        return true;
    }
}