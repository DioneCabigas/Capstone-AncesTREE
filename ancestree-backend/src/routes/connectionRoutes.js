const express = require('express');
const router = express.Router();
const connectionController = require('../controllers/connectionController');

router.post('/', connectionController.sendConnectionRequest);
router.get('/:uid', connectionController.getUserConnections);
router.get('/:uid/pending', connectionController.getPendingRequests);
router.put('/:id', connectionController.updateConnectionStatus);
router.delete('/:id', connectionController.deleteConnection);

module.exports = router;
