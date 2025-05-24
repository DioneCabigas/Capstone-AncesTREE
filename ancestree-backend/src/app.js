const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const connectionRoutes = require('./routes/connectionRoutes');
const familyGroupRoutes = require('./routes/familyGroupRoutes');
const familyGroupMembersRoutes = require('./routes/familyGroupMembersRoutes');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
// app.use(express.json()); // Ignore this. Need to test for something

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/family-groups', familyGroupRoutes);
app.use('/api/family-group-members', familyGroupMembersRoutes);

// For testing purposes (Ignore lng ni ninyo)
const testRoutes = require('../tests/routes/testRoutes');
app.use("/test", testRoutes);
// ----------------------------------------------------------

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

// Please make sure naa inyong key sa Firebase sa config directory
// To run just do node src/app.js