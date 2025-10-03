const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const userRoutes = require("./routes/userRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const familyGroupRoutes = require("./routes/familyGroupRoutes");
const familyGroupMembersRoutes = require("./routes/familyGroupMembersRoutes");
const familyTreeRoutes = require("./routes/familyTreeRoutes");
const personRoutes = require("./routes/personRoutes");
const galleryRoutes = require("./routes/galleryRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const searchRoutes = require("./routes/searchRoutes");
const profileRoutes = require("./routes/profileRoutes");
const familyGroupInvitation = require("./routes/familyGroupInvitationRoutes");
const mergeRequestRoutes = require("./routes/mergeRequestRoutes");

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(bodyParser.json());
// app.use(express.json()); // Ignore this. Need to test for something

app.use("/api/user", userRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/family-groups", familyGroupRoutes);
app.use("/api/family-group-members", familyGroupMembersRoutes);
app.use("/api/family-trees", familyTreeRoutes);
app.use("/api/persons", personRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/group-invitation", familyGroupInvitation);
app.use("/api/merge-requests", mergeRequestRoutes);

// For testing purposes (Ignore lng ni ninyo)
const testRoutes = require("../tests/routes/testRoutes");
app.use("/test", testRoutes);
// ----------------------------------------------------------

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});

// Please make sure naa inyong key sa Firebase sa config directory
// To run just do node src/app.js
