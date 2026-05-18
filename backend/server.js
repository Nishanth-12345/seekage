// ─── SEEKAGE Backend Server ─────────────────────────────────────────────
// Handles HTTP server + Socket.io
// ───────────────────────────────────────────────────────────────────────

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);
server.requestTimeout = Number(process.env.REQUEST_TIMEOUT_MS || 10 * 60 * 1000);
server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 11 * 60 * 1000);

// Attach Socket.io
const io = new Server(server, {
  cors: { origin: '*' },
});

// ─── Socket.io Events ───────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinGroup', (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on('message', ({ groupId, text, senderName, senderId }) => {
    const msg = {
      id: Date.now(),
      text,
      senderName,
      senderId,
      time: new Date().toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Send to group
    io.to(`group_${groupId}`).emit('message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// ─── Start Server ───────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`SEEKAGE server running on port ${PORT}`);
});
