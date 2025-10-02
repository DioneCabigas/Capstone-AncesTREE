const express = require("express");
const router = express.Router();
const personController = require("../controllers/personController");

// Create person on a specific tree
router.post("/:treeId", personController.createPerson);

// Create person with the same id as the uid for personal trees
router.post("/self/:treeId", personController.createPersonSelf);

// Get person by Id
router.get("/:personId", personController.getPersonById);

// Get all the people in a tree using tree Id
router.get("/tree/:treeId", personController.getPeopleByTreeId);

// Get all the people in a group tree using group tree Id
router.get("/group-tree/:groupTreeId", personController.getPeopleByGroupTreeId);

// Update person (Also used for adding relationships)
router.put("/:personId", personController.updatePerson);

// Delete a relationship of a person by Id and relationship request body
router.patch("/relationship/:personId", personController.deleteRelationshipFromPerson);

// Delete person by Id
router.delete("/:personId", personController.deletePerson);

module.exports = router;
