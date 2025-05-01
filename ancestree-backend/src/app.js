const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes'); // You might still have this import
const userRoutes = require('./routes/userRoutes'); // Import the userRoutes
const admin = require('./config/database'); // Import Firebase Admin SDK

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
}));

app.use('/auth', authRoutes); // We dont need this but lets keep it here for now
app.use('/api', userRoutes);

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

// Please make sure naa inyong key sa Firebase sa config directory
// To run just do node src/app.js