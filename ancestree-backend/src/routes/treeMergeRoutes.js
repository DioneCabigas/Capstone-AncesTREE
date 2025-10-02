const express = require('express');
const treeMergeController = require('../controllers/treeMergeController');

const router = express.Router();

// Get merge statistics for a tree
router.get('/stats/:treeId', treeMergeController.getTreeMergeStats);

// Revert a merge operation
router.post('/revert/:treeId', treeMergeController.revertMerge);

// Execute a manual merge (for testing/admin purposes)
router.post('/execute', treeMergeController.executeManualMerge);

module.exports = router;