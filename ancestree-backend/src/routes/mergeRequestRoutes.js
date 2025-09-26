const express = require('express');
const router = express.Router();
const mergeRequestController = require('../controllers/mergeRequestController');

router.post('/', mergeRequestController.createMergeRequest);
router.get('/group/:groupId', mergeRequestController.getMergeRequestsByGroup);
router.get('/group/:groupId/pending', mergeRequestController.getPendingMergeRequestsForOwner);
router.patch('/:requestId/status', mergeRequestController.updateMergeRequestStatus);
router.delete('/:requestId', mergeRequestController.deleteMergeRequest);

module.exports = router;
