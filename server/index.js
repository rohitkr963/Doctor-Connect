require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');

// Routes ko import karna
const doctorRoutes = require('./routes/doctorRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');


// --- Socket.io Setup ---
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Serve uploads folder as static
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;
const { Server } = require('socket.io');

// Test route
app.get('/', (req, res) => {
  res.send('<h1>Doctor Connect Backend is Running!</h1>');
});

// --- API Routes ---
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);

// --- Socket.io Setup ---
const http = require('http');
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store user sockets
const userSockets = {};

io.on('connection', (socket) => {
  // Listen for user to join with their userId
  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
  });

  // Real-time chat: join room for doctor-patient chat
  socket.on('joinRoom', ({ room }) => {
    socket.join(room);
  });

  // Real-time chat: send message to room
  socket.on('sendMessage', (data) => {
    // Broadcast to all users in the room
    io.to(data.room).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, id] of Object.entries(userSockets)) {
      if (id === socket.id) delete userSockets[userId];
    }
    console.log('User disconnected:', socket.id);
  });

  // WebRTC signaling relay
  socket.on('webrtc-offer', ({ to, offer }) => {
    const targetSocketId = userSockets[to];
    // Find sender's userId from userSockets mapping
    let fromUserId = null;
    for (const [userId, id] of Object.entries(userSockets)) {
      if (id === socket.id) fromUserId = userId;
    }
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { from: fromUserId, offer });
    }
  });
  // --- ADD: Video Call Request relay ---
  socket.on('videoCallRequest', (data) => {
    const targetSocketId = userSockets[data.to];
    console.log('videoCallRequest received from', data.from, 'to', data.to, 'targetSocketId:', targetSocketId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('videoCallRequest', data);
    }
  });
  socket.on('webrtc-answer', ({ to, answer }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { answer });
    }
  });
  socket.on('webrtc-candidate', ({ to, candidate }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-candidate', { candidate });
    }
  });

  // Video Call Accepted relay
  socket.on('videoCallAccepted', ({ to, from }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('videoCallAccepted');
    }
    // Doctor (receiver) ko bhi apne client par event bhejo
    if (userSockets[from]) {
      io.to(userSockets[from]).emit('videoCallAccepted');
    }
  });
});

// Make io accessible in routes/controllers
app.set('io', io);
app.set('userSockets', userSockets);

// Start the server with Socket.io
server.listen(PORT, () => {
  console.log(`Server is running successfully on http://localhost:${PORT}`);
});
