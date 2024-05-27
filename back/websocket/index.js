import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);

const PORT = process.env.PORT || 8080;

const app = express();

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

io.on('connection', socket => {
    console.log(`User ${socket.id} connected`);

    socket.emit('roomList', {
        rooms: getAllActiveRooms()
    })

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected`);
    })
})

io.engine.on('connection_error', (err) => {
    console.log(err.req);       // the request object
    console.log(err.code);      // the error code
    console.log(err.message);   // the error message
    console.log(err.context);   // some additional error context
})


// USERS FUNCTIONS

function activateUser(id, name, room) {
    const user = {id, name, room};
    UsersState.setUsers([
        ...UsersState.users.filter(user => user.id !== id)
    ]);
}

function userLeavesApp(id) {
    UsersState.setUsers(
        UsersState.users.filter(user => user.id !== id)
    );
}

function getUser(id) {
    return UsersState.users.find(user => user.id === id);
}

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room);
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)));
}

