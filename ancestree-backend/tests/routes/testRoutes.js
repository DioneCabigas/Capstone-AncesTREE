const express = require("express");
const router = express.Router();
const { testApi } = require("../controllers/testController");

router.get("/", testApi); // GET /test/

module.exports = router;
