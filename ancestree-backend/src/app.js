const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const admin = require('./config/database');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());

app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// For testing purposes (Ignore lng ni ninyo uwu)
const testRoutes = require('../tests/routes/testRoutes');
app.use("/test", testRoutes);
// ----------------------------------------------------------

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

// Please make sure naa inyong key sa Firebase sa config directory
// To run just do node src/app.js