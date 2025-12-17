const familyTreeService = require("../services/testFamilyTreeService");

exports.createFamilyTree = async (req, res) => {
  try {
    const { ownerId, treeName } = req.body;
    const treeId = await familyTreeService.createFamilyTree(ownerId, treeName);
    res.status(201).json({ treeId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPerson = async (req, res) => {
  try {
    const { treeId } = req.params;
    const personId = await familyTreeService.createPerson(treeId, req.body);
    res.status(201).json({ personId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findDuplicates = async (req, res) => {
  try {
    const { treeId } = req.params;
    const result = await familyTreeService.findDuplicateCandidates(
      treeId,
      req.body
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.linkPerson = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { sourceId, targetId, relationship } = req.body;

    await familyTreeService.linkExistingPerson(
      treeId,
      sourceId,
      targetId,
      relationship
    );

    res.json({ message: "Persons linked successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.importPersonalTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { personalTreeId } = req.body;

    const importedIds =
      await familyTreeService.importPersonalTreeIntoGroupTree(
        treeId,
        personalTreeId
      );

    res.status(201).json({ importedIds });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getFamilyTreeChart = async (req, res) => {
  try {
    const { treeId } = req.params;
    const chart = await familyTreeService.getFamilyTreeChart(treeId);
    res.json(chart);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.mergePersons = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { primaryId, secondaryId } = req.body;

    await familyTreeService.mergePersons(treeId, primaryId, secondaryId);
    res.json({ message: "Persons merged successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
