const familyTreeService = require("../services/familyTreeService");

exports.createFamilyTree = async (req, res) => {
  try {
    const { userId, treeName } = req.body;
    if (!userId || !treeName) {
      return res.status(400).json({ error: "userId and treeName are required" });
    }

    const treeId = await familyTreeService.createFamilyTree(userId, treeName);
    res.status(201).json({ treeId });
  } catch (error) {
    console.error("Error creating family tree:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getFamilyTreeById = async (req, res) => {
  try {
    const treeId = req.params.treeId;
    const familyTree = await familyTreeService.getFamilyTreeById(treeId);

    if (!familyTree) {
      return res.status(404).json({ message: "Family tree does not exist or is not found." });
    }

    res.status(200).json(familyTree);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllFamilyTrees = async (req, res) => {
  try {
    const trees = await familyTreeService.getAllFamilyTrees();
    res.status(200).json(trees);
  } catch (error) {
    console.error("Error fetching all family trees:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.updateFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const data = req.body;

    const updatedTree = await familyTreeService.updateFamilyTree(treeId, data);
    res.status(200).json(updatedTree);
  } catch (error) {
    console.error("Error updating family tree:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const result = await familyTreeService.deleteFamilyTree(treeId);
    if (!result) {
      return res.status(404).json({ message: "Tree not found" });
    }
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting family tree:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getPersonalTree = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "userId is required to get personal tree." });
    }

    const personalTree = await familyTreeService.getPersonalTree(userId);

    if (!personalTree) {
      return res.status(200).json({ message: "Personal family tree not found for this user." });
    }

    res.status(200).json(personalTree);
  } catch (error) {
    console.error("Error getting personal tree:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
