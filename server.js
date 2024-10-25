import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        players: new Map(),
        currentHolder: null,
        startTime: null
      });
    }

    const room = rooms.get(roomId);
    room.players.set(socket.id, {
      username,
      score: 0,
      isHolding: false
    });

    io.to(roomId).emit('playerList', {
      players: Array.from(room.players.entries()).map(([id, data]) => ({
        id,
        ...data
      }))
    });
  });

  socket.on('startHolding', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    room.currentHolder = socket.id;
    room.startTime = Date.now();
    room.players.get(socket.id).isHolding = true;

    io.to(roomId).emit('buttonStateChanged', {
      holderId: socket.id,
      isHeld: true
    });
  });

  socket.on('stopHolding', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.currentHolder !== socket.id) return;

    const holdDuration = (Date.now() - room.startTime) / 1000;
    const player = room.players.get(socket.id);
    player.score += holdDuration;
    player.isHolding = false;
    room.currentHolder = null;
    room.startTime = null;

    io.to(roomId).emit('buttonStateChanged', {
      holderId: null,
      isHeld: false
    });

    io.to(roomId).emit('scoreUpdated', {
      playerId: socket.id,
      score: player.score
    });
  });

  socket.on('disconnect', () => {
    rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        if (room.currentHolder === socket.id) {
          room.currentHolder = null;
          room.startTime = null;
          io.to(roomId).emit('buttonStateChanged', {
            holderId: null,
            isHeld: false
          });
        }
        room.players.delete(socket.id);
        io.to(roomId).emit('playerLeft', { playerId: socket.id });
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});