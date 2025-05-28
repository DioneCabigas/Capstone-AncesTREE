const express = require("express");
const router = express.Router();
const familyTreeController = require("../controllers/familyTreeController");

router.post("/", familyTreeController.createFamilyTree);

router.get("/:treeId", familyTreeController.getFamilyTreeById);

router.get("/", familyTreeController.getAllFamilyTrees);

router.put("/:treeId", familyTreeController.updateFamilyTree);

router.delete("/:treeId", familyTreeController.deleteFamilyTree);

router.get("/personal/:userId", familyTreeController.getPersonalTree);

module.exports = router;
