const { messaging } = require("firebase-admin");
const personService = require("../services/personService");
const familyTreeService = require("../services/familyTreeService");

exports.createPerson = async (req, res) => {
  try {
    const treeId = req.params.treeId;
    const personData = req.body;

    // Check if tree exists
    const treeDoc = await familyTreeService.getFamilyTreeById(treeId);
    if (!treeDoc) {
      return res.status(400).json({ message: "Tree doesn't exist" });
    }

    // Check if these fields are present in the request body
    if (!treeId || !personData.firstName || !personData.lastName) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const person = await personService.createPerson(treeId, personData);
    res.status(201).json(person);
  } catch (err) {
    console.error("Error creating person:", err);
    res.status(500).json({ message: "Failed to create person" });
  }
};

exports.createPersonSelf = async (req, res) => {
  try {
    const treeId = req.params.treeId;
    const { uid, ...personData } = req.body;

    // if (!treeId || !uid || !personData.firstName || !personData.gender || !personData.birthDate) {
    //   return res.status(400).json({ message: "Missing required fields for person creation (treeId, uid, firstName, gender, birthDate)." });
    // }

    const person = await personService.createPersonSelf(treeId, uid, personData);
    if (!person) {
      return res.status(400).json({ message: "Failed to create self person, possibly due to invalid data." });
    }

    res.status(201).json({
      message: "Self person created successfully.",
      person: person,
    });
  } catch (error) {
    console.error("Error in createPersonSelf controller:", error);
    res.status(500).json({ message: "Internal server error during self person creation." });
  }
};

exports.getPersonById = async (req, res) => {
  try {
    const personId = req.params.personId;
    const person = await personService.getPersonById(personId);
    if (!person) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(200).json(person);
  } catch (err) {
    console.error("Error getting person:", err);
    res.status(500).json({ message: "Failed to get person" });
  }
};

exports.getPeopleByTreeId = async (req, res) => {
  try {
    const treeId = req.params.treeId;
    const people = await personService.getPeopleByTreeId(treeId);
    if (people.length === 0) {
      return res.status(404).json({ message: "No people found in this tree." });
    }
    res.status(200).json(people);
  } catch (err) {
    console.error("Error getting people by treeId:", err);
    res.status(500).json({ message: "Failed to get people" });
  }
};

exports.updatePerson = async (req, res) => {
  try {
    const personId = req.params.personId;
    const data = req.body;
    const updatedPerson = await personService.updatePerson(personId, data);
    if (!updatedPerson) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(200).json(updatedPerson);
  } catch (err) {
    console.error("Error updating person:", err);
    res.status(500).json({ message: "Failed to update person" });
  }
};

exports.deleteRelationshipFromPerson = async (req, res) => {
  try {
    const personId = req.params.personId;
    const { relationshipToRemove } = req.body;

    if (!relationshipToRemove) {
      return res.status(400).json({ message: "Request body must contain 'relationshipToRemove' object." });
    }

    const updatedPerson = await personService.deleteRelationshipFromPerson(personId, relationshipToRemove);

    if (!updatedPerson) {
      return res.status(404).json({ message: "Person not found" });
    }
    res.status(200).json(updatedPerson);
  } catch (err) {
    console.error("Error deleting relationship from person:", err);
    res.status(500).json({ message: "Error deleting relationship from person" });
  }
};

exports.deletePerson = async (req, res) => {
  try {
    const personId = req.params.personId;
    await personService.deletePerson(personId);
    res.status(200).json({ message: "Person deleted successfully" });
  } catch (err) {
    console.error("Error deleting person:", err);
    res.status(500).json({ message: "Failed to delete person" });
  }
};
