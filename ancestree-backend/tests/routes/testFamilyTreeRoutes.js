const express = require("express");
const router = express.Router();
const testFamilyTreeController = require("../controllers/testFamilyTreeController");

router.post("/", testFamilyTreeController.createFamilyTree);
router.post("/:treeId/persons", testFamilyTreeController.createPerson);
router.get("/:treeId/chart", testFamilyTreeController.getFamilyTreeChart);
router.post("/relationships/parent-child", testFamilyTreeController.addParentChild);
router.post("/relationships/spouse", testFamilyTreeController.addSpouse);

module.exports = router;