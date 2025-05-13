const express = require('express');
const router = express.Router();
const familyTreeController = require('../controllers/familyTreeController');
const authMiddleware = require('../middleware/auth');

// Family tree routes (all protected with auth middleware)
router.post('/', authMiddleware, familyTreeController.createFamilyTree);
router.get('/', authMiddleware, familyTreeController.getFamilyTrees);
router.get('/:treeId', authMiddleware, familyTreeController.getFamilyTree);
router.put('/:treeId', authMiddleware, familyTreeController.updateFamilyTree);
router.delete('/:treeId', authMiddleware, familyTreeController.deleteFamilyTree);

module.exports = router;