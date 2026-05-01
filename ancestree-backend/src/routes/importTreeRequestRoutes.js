const express = require("express");
const router = express.Router();
const importTreeRequestController = require("../controllers/importTreeRequestController");

// Create a new import request for a group tree
router.post("/:treeId/create", importTreeRequestController.createImportRequest);

// Get all pending import requests for a group tree
router.get("/:treeId/pending", importTreeRequestController.getPendingImportRequests);

// Get all import requests for a group tree
router.get("/:treeId", importTreeRequestController.getImportRequestsByGroupTree);

// Get import requests for the current user
router.get("/user/requests", importTreeRequestController.getImportRequestsForUser);

// Approve an import request
router.put("/:requestId/approve", importTreeRequestController.approveImportRequest);

// Reject an import request
router.put("/:requestId/reject", importTreeRequestController.rejectImportRequest);

// Delete an import request
router.delete("/:requestId", importTreeRequestController.deleteImportRequest);

module.exports = router;
