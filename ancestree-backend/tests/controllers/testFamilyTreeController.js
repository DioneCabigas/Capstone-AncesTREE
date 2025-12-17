const familyTreeService = require("../services/testFamilyTreeService");

// POST /api/family-trees
exports.createFamilyTree = async (req, res) => {
  try {
    const { userId, treeName } = req.body;

    if (!treeName || !userId) {
      return res.status(400).json({ message: "Tree name is required" });
    }

    const treeId = await familyTreeService.createFamilyTree(userId, treeName);
    res.status(201).json({ treeId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/family-trees/:treeId/persons
 */
exports.createPerson = async (req, res) => {
  try {
    const { treeId } = req.params;
    const personId = await familyTreeService.createPerson(treeId, req.body);

    res.status(201).json({ personId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/family-trees/:treeId/chart
 */
exports.getFamilyTreeChart = async (req, res) => {
  try {
    const { treeId } = req.params;
    const chartData = await familyTreeService.getFamilyTreeChart(treeId);

    res.status(200).json(chartData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/family-trees/relationships/parent-child
 */
exports.addParentChild = async (req, res) => {
  try {
    const { parentId, childId } = req.body;

    if (!parentId || !childId) {
      return res.status(400).json({ message: "parentId and childId required" });
    }

    await familyTreeService.addParentChild(parentId, childId);
    res.status(200).json({ message: "Parent-child relationship added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/family-trees/relationships/spouse
 */
exports.addSpouse = async (req, res) => {
  try {
    const { personAId, personBId } = req.body;

    if (!personAId || !personBId) {
      return res.status(400).json({ message: "Both person IDs required" });
    }

    await familyTreeService.addSpouse(personAId, personBId);
    res.status(200).json({ message: "Spouse relationship added" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
