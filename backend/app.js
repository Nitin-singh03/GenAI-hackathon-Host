const express = require('express');
const cors = require('cors'); // ✅ Import CORS
const userRoutes = require('./routes/userRoutes');
const cookies = require("cookie-parser");
const app = express();
app.use(cookies());
app.use(express.json());
// ✅ Enable CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://gen-ai-hackathon-host.vercel.app',
    'https://gen-ai-hackathon-host-a4u7.vercel.app'
  ],
  methods: 'GET,POST,PUT,DELETE,PATCH',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));
app.use('/', userRoutes);

module.exports = app;