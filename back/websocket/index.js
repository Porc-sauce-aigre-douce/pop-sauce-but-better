import express from 'express';
import { Server } from "socket.io";
import path from 'path';
import { fileURLToPath } from 'url';

const __fileName = fileURLToPath(import.meta.url);
const __dirName = path.dirname(__fileName);
const PORT = process.env.PORT || 8080;
const ADMIN = 'Admin';
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

    // User creates a new room
    socket.on('createRoom', ({name, room, subject}) => {
        if (!name) {
            name = generateGuestName();
        }
        const roomExists = getAllActiveRooms().includes(room);
        if (roomExists) {
            socket.emit('error', buildMsg(ADMIN, `Room ${room} already exists`));
        } else {
            socket.join(room);
            activateUser(socket.id, name, room);
            io.to(room).emit('roomUsers', {
                room: room,
                users: getUsersInRoom(room),
                subject: subject
            });
            // Update room lists for everyone
            io.emit('roomList', {
                rooms: getAllActiveRooms()
            })
        }
    });

    // User joins a room
    socket.on('joinRoom', ({name, room, subject}) => {
        if (!name) {
            name = generateGuestName();
        }
        const roomExists = getAllActiveRooms().includes(room);
        if (roomExists) {
            const user = activateUser(socket.id, name, room);
            socket.join(user.room);
            io.to(user.room).emit('roomUsers', {
                room: room,
                users: getUsersInRoom(room),
                subject: subject
            })
            // To uer who joined room
            socket.emit('message', buildMsg(ADMIN, `You joined the room ${user.room}`))
            // To everyone else
            socket.broadcast.to(user.room).emit('message', buildMsg(ADMIN, `${user.name} joined room;`))
        } else {
            socket.emit('error', buildMsg(ADMIN, `${room} not found`));
        }
    })

    // User quit room
    socket.on('quitRoom', ({name}) => {
        const prevRoom = getUser(socket.id)?.room;
        if (prevRoom) {
            socket.leave(prevRoom);
            // Tell the users in a room that someone leaved
            io.to(prevRoom).emit('message', buildMsg(ADMIN, `${name} leaved room`));
            // Cannot update previous room users list after the state update in activate user
            io.to(prevRoom).emit('userList', {
                users: getUsersInRoom(prevRoom)
            })
        }
    })

    // Listening or message event
    socket.on('message', ({name, text}) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            io.to(room).emit('message', buildMsg(name, text));
        }
    })

    // Listening for activity
    socket.on('activity', (name) => {
        const room = getUser(socket.id)?.room;
        if (room) {
            socket.broadcast.to(room).emit('activity', name);
        }
    })

    socket.on('disconnect', () => {
        const user = getUser(socket.id);
        userLeavesApp(socket.id);
        if (user) {
            io.to(user.room).emit('message',
                buildMsg(ADMIN, `${user.name} disconnected`));
            io.to(user.room).emit('userList', {
                users: getUsersInRoom(user.room)
            })
            io.to(user.room).emit('roomList', {
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

function getUsersInRoom(room) {
    return UsersState.users.filter(user => user.room === room);
}

function getAllActiveRooms() {
    return Array.from(new Set(UsersState.users.map(user => user.room)));
}

function generateGuestName() {
    return `Guest_${Math.floor(Math.random() * 10000)}`;
}