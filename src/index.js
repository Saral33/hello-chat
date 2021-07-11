const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const express = require('express');
const { generateMsg, genreateLocation } = require('./utils/messages');
const {
  addUser,
  getUsersinRoom,
  getUser,
  removeUser,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 5000;
const public = path.join(__dirname, '../public');

app.use(express.static(public));

io.on('connection', (socket) => {
  console.log('New connection');

  socket.on('join', ({ username, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, username, room });
    if (error) {
      return callback(error);
    }
    socket.join(user.room);
    socket.emit('message', generateMsg(' Bot', 'Welcome!'));
    io.to(user.room).emit('roomdata', {
      room: user.room,
      users: getUsersinRoom(user.room),
    });
    socket.broadcast
      .to(user.room)
      .emit('message', generateMsg(`Bot`, `${username} has joined`));
    callback();
  });
  socket.on('chatmessage', (chatmessage, fn) => {
    const user = getUser(socket.id);
    if (user)
      io.to(user.room).emit('message', generateMsg(user.username, chatmessage));
    fn('Confirmed');
  });
  socket.on('location', (loc, fn) => {
    const user = getUser(socket.id);
    if (user)
      io.to(user.room).emit(
        'locationMsg',
        genreateLocation(
          user.username,
          `https://www.google.com/maps?q=${loc.latitude},${loc.longtitude}`
        )
      );
    fn();
  });
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMsg(` Bot`, `${user.username} has left`)
      );
      io.to(user.room).emit('roomdata', {
        room: user.room,
        users: getUsersinRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
