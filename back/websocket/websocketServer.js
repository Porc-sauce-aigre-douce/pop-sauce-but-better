const { Question } = require("../questions/model.js");

const ADMIN = "Admin";

const rooms = {};
const UsersState = {
  users: [],
  setUsers: function (newUsersArray) {
    this.users = newUsersArray;
  },
};

module.exports = {
  onConnection: (io, socket) => {
    console.log(`User ${socket.id} connected`);

    socket.emit("roomList", {
      rooms: getAllActiveRooms(),
    });

    // User creates a new room
    socket.on("createRoom", ({ name, roomName, subject }) => {
      if (!name) {
        name = generateGuestName();
      }
      if (roomExist(roomName)) {
        socket.emit(
          "error",
          buildMsg(ADMIN, `Room ${roomName} already exists`)
        );
      } else {
        rooms[roomName] = { users: [], quizStarted: false, question: null };
        socket.join(roomName);
        activateUser(socket.id, name, roomName);
        socket.emit(`roomCreated`, roomName);
        io.to(roomName).emit("roomUsers", {
          room: roomName,
          users: getUsersInRoom(roomName),
          subject: subject,
          isQuizStarted: rooms[roomName].quizStarted,
        });
        // Update room lists for everyone
        io.emit("roomList", {
          rooms: getAllActiveRooms(),
        });
      }
    });

    // User joins a room
    socket.on("joinRoom", ({ name, roomName, subject }) => {
      if (!name) {
        name = generateGuestName();
      }
      if (roomExist(roomName)) {
        const user = activateUser(socket.id, name, roomName);
        socket.join(roomName);
        rooms[roomName].users.push(user);
        console.log(`User ${socket.id} joined room : ${roomName}`);
        io.to(roomName).emit("userJoined", socket.id);
        io.to(roomName).emit("roomUsers", {
          room: roomName,
          users: getUsersInRoom(roomName),
          subject: subject,
          isQuizStarted: rooms[roomName].quizStarted,
        });
        // To uer who joined room
        socket.emit(
          "message",
          buildMsg(ADMIN, `You joined the room ${roomName}`),
          roomName
        );
        if (rooms[roomName].quizStarted) {
          io.to(roomName).emit("question", {
            question: rooms[roomName].question,
          });
        }
        // To everyone else
        socket.broadcast
          .to(roomName)
          .emit(
            "message",
            buildMsg(ADMIN, `${roomName} joined room;`),
            roomName
          );
      } else {
        socket.emit("error", buildMsg(ADMIN, `${roomName} not found`));
      }
      // io.emit("roomList", {
      //   rooms: getAllActiveRooms(),
      // });
    });

    // User quit room
    socket.on("quitRoom", ({ username, roomName }) => {
      const prevRoom = roomName;
      if (prevRoom) {
        rooms[prevRoom].users = rooms[prevRoom].users.filter(
          (user) => user.id !== socket.id
        );
        if (rooms[prevRoom].users.length === 0) {
          delete rooms[prevRoom];
          io.emit("roomList", { rooms: getAllActiveRooms() });
        }
        socket.leave(prevRoom);
        // Tell the users in a room that someone leaved
        io.to(prevRoom).emit(
          "message",
          buildMsg(ADMIN, `${username} leaved room`),
          roomName
        );
        // Cannot update previous room users list after the state update in activate user
        io.to(prevRoom).emit("userList", {
          users: getUsersInRoom(prevRoom),
        });
      }
    });

    socket.on("startQuiz", async ({ roomName }) => {
      rooms[roomName].quizStarted = true;
      resetUsersAnswers(rooms[roomName].users);
      rooms[roomName].question = await getNewQuestion(io, roomName);
    });

    // Listen to user responses :
    socket.on("submitAnswer", ({ userAnswer, roomName }) => {
      const user = getUser(socket.id);
      user.points = 0;
      user.hasAnswered = true;
      if (user) {
        if (
          isAnswerCorrect(userAnswer, rooms[roomName].question.correctAnswers)
        ) {
          user.points += 1000;
          io.to(roomName).emit("correctAnswer", { user });
        } else {
          io.to(roomName).emit("incorrectAnswer", { user });
        }
        let hasEveryoneAnswered = true;
        rooms[roomName].users.forEach((user) => {
          if (!user.hasAnswered) {
            hasEveryoneAnswered = false;
          }
        });
        if (hasEveryoneAnswered) {
          io.to(roomName).emit("answer", {
            answer: rooms[roomName].question.correctAnswers[0],
          });
          setTimeout(async () => {
            resetUsersAnswers(rooms[roomName].users);
            rooms[roomName].question = await getNewQuestion(
              io,
              roomName,
              socket
            );
          }, 5000);
        }
      }
    });

    // Listening or message event
    socket.on("message", ({ name, text, roomName }) => {
      if (roomExist(roomName)) {
        io.to(roomName).emit("message", buildMsg(name, text));
      }
    });

    // Listening for activity
    socket.on("activity", (name, roomName) => {
      if (roomExist(roomName)) {
        socket.broadcast.to(roomName).emit("activity", name);
      }
    });

    socket.on("disconnect", (roomName) => {
      const user = getUser(socket.id);
      userLeavesApp(socket.id);
      if (user) {
        rooms[user.room].users = rooms[user.room].users.filter(
          (user) => user.id !== socket.id
        );
        if (rooms[user.room].users.length === 0) {
          delete rooms[user.room];
        }
        console.log(user.room)
        if (user.room) {
          io.to(roomName).emit("userList", {
            users: getUsersInRoom(roomName),
          });
        }
        io.to(roomName).emit(
          "message",
          buildMsg(ADMIN, `${user.name} disconnected`),
          roomName
        );
        io.to(roomName).emit("userList", {
          users: getUsersInRoom(roomName),
        });
        io.to(roomName).emit("roomList", {
          rooms: getAllActiveRooms(),
        });
      }
      console.log(`User ${socket.id} disconnected`);
    });
  },
};

// Function that handle messages
function buildMsg(name, text) {
  return {
    name,
    text,
    time: new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).format(new Date()),
  };
}

// USERS FUNCTIONS

function activateUser(id, name, room) {
  const user = { id, name, room };
  UsersState.setUsers([
    ...UsersState.users.filter((user) => user.id !== id),
    user,
  ]);
  return user;
}

function userLeavesApp(id) {
  UsersState.setUsers(UsersState.users.filter((user) => user.id !== id));
}

function getUser(id) {
  return UsersState.users.find((user) => user.id === id);
}

function getUsersInRoom(roomName) {
  if (rooms[roomName]) {
    return rooms[roomName].users;
  }
  return null;
}

function getAllActiveRooms() {
  return rooms;
}

function generateGuestName() {
  return `Guest_${Math.floor(Math.random() * 10000)}`;
}

function isAnswerCorrect(userAnswer, correctAnswer) {
  if (correctAnswer.indexOf(userAnswer) !== -1) return true;
}

function roomExist(roomName) {
  if (rooms[roomName]) {
    return true;
  }
}

async function getNewQuestion(io, roomName) {
  const question = await Question.aggregate([{ $sample: { size: 1 } }]);

  io.to(roomName).emit("question", { question: question[0] });
  return question[0];
}

function resetUsersAnswers(users) {
  users.forEach((user) => {
    user.hasAnswered = false;
  });
}
