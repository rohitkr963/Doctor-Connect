require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const doctorRoutes = require('./routes/doctorRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const doctorChatbotRoutes = require('./routes/doctorChatbotRoutes');
const documentRoutes = require('./routes/documentRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

// ✅ Allowed origins list
const allowedOrigins = [
  "http://localhost:3000",                       // local dev
  "https://doctor-connect-fronted.vercel.app"    // deployed frontend
];

// ✅ Apply CORS middleware (before routes)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Test route
app.get('/', (req, res) => {
  res.send('Doctor Connect Backend is Running!');
});

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/ai', doctorChatbotRoutes); // Doctor chatbot
app.use('/api/documents', documentRoutes);

// ✅ Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Socket.io - Import handlers
const { setupSocketHandlers } = require('./utils/socketEvents');

const userSockets = {};
io.on('connection', (socket) => {
  console.log('🔌 New socket connection:', socket.id);
  
  // Setup chatbot-related socket handlers
  setupSocketHandlers(io, socket);
  
  // Legacy handlers for chat and video call
  socket.on('register', (userId) => {
    userSockets[userId] = socket.id;
  });

  socket.on('joinRoom', ({ room }) => socket.join(room));

  socket.on('sendMessage', (data) => {
    io.to(data.room).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, id] of Object.entries(userSockets)) {
      if (id === socket.id) delete userSockets[userId];
    }
  });

  socket.on('webrtc-offer', ({ to, offer }) => {
    const targetSocketId = userSockets[to];
    let fromUserId = Object.keys(userSockets).find(key => userSockets[key] === socket.id);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { from: fromUserId, offer });
    }
  });

  socket.on('videoCallRequest', (data) => {
    const targetSocketId = userSockets[data.to];
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

  socket.on('videoCallAccepted', ({ to, from }) => {
    const targetSocketId = userSockets[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit('videoCallAccepted');
    }
    if (userSockets[from]) {
      io.to(userSockets[from]).emit('videoCallAccepted');
    }
  });
});

app.set('io', io);
app.set('userSockets', userSockets);

// ✅ Final listen (for Railway)
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
