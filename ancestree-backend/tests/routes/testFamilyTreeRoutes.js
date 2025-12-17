const express = require("express");
const router = express.Router();
const controller = require("../controllers/testFamilyTreeController");

router.post("/", controller.createFamilyTree);
router.post("/:treeId/persons", controller.createPerson);
router.get("/:treeId/chart", controller.getFamilyTreeChart);

router.post("/:treeId/link", controller.linkPerson);
router.post("/:treeId/duplicates", controller.findDuplicates);

router.post("/merge", controller.mergeTrees);
router.post("/:treeId/merge-persons", controller.mergePersons);

module.exports = router;