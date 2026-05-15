const importTreeRequestService = require('../services/importTreeRequestService');
const userService = require('../services/userService');
const familyTreeService = require('../services/familyTreeService');
const familyGroupService = require('../services/familyGroupService');
const familyGroupMemberService = require('../services/familyGroupMemberService');

// Helper function to check if user is Host of the group
const isUserHostOfGroup = async (userId, groupId) => {
  try {
    const members = await familyGroupMemberService.getMembersByGroup(groupId);
    const userMember = members.find(member => member.userId === userId);
    return userMember && userMember.role === 'Host';
  } catch (error) {
    console.error('Error checking host status:', error);
    return false;
  }
};

exports.createImportRequest = async (req, res) => {
  try {
    const { treeId } = req.params; // groupTreeId
    const { personalTreeId } = req.body;
    const requestorId = req.user ? req.user.uid : req.body.requestorId;

    if (!treeId || !personalTreeId || !requestorId) {
      return res.status(400).json({ 
        message: 'treeId, personalTreeId, and requestorId are required.' 
      });
    }

    // Verify the group tree exists
    const groupTree = await familyTreeService.getFamilyTreeById(treeId);
    if (!groupTree) {
      return res.status(404).json({ message: 'Group tree not found.' });
    }

    // Resolve the owning group for this group tree
    const group = await familyGroupService.getGroupByTreeId(treeId);
    if (!group) {
      return res.status(404).json({ message: 'Family group not found for this tree.' });
    }

    // Verify the personal tree exists
    const personalTree = await familyTreeService.getFamilyTreeById(personalTreeId);
    if (!personalTree) {
      return res.status(404).json({ message: 'Personal tree not found.' });
    }

    // Verify requestor is a member of this group
    const requestorMemberRecords = await familyGroupMemberService.getMemberByGroupAndUser(group.id, requestorId);
    if (!requestorMemberRecords || requestorMemberRecords.length === 0) {
      return res.status(403).json({ message: 'Only group members can create import requests for this tree.' });
    }

    const isHost = await isUserHostOfGroup(requestorId, group.id);

    // Get requestor details
    const requestorDetails = await userService.getUser(requestorId);
    const requestorName = `${requestorDetails.firstName} ${requestorDetails.lastName || ''}`.trim();

    // Generate preview of the personal tree
    const preview = await importTreeRequestService.generateImportPreview(personalTreeId);

    let importRequest;
    if (isHost) {
      // Host-created request is approved immediately and merged straight away
      await importTreeRequestService.importPersonalTreeIntoGroupTree(personalTreeId, treeId);

      importRequest = await importTreeRequestService.createImportRequest(
        treeId,
        personalTreeId,
        requestorId,
        requestorName,
        preview,
        'approved',
        requestorId,
        new Date()
      );
    } else {
      importRequest = await importTreeRequestService.createImportRequest(
        treeId,
        personalTreeId,
        requestorId,
        requestorName,
        preview
      );
    }

    res.status(201).json({
      message: 'Import request created successfully.',
      importRequest
    });
  } catch (error) {
    console.error('Error creating import request:', error);
    res.status(500).json({ message: error.message || 'Failed to create import request.' });
  }
};

exports.getPendingImportRequests = async (req, res) => {
  try {
    const { treeId } = req.params;

    // Verify the tree exists
    const tree = await familyTreeService.getFamilyTreeById(treeId);
    if (!tree) {
      return res.status(404).json({ message: 'Tree not found.' });
    }

    const requests = await importTreeRequestService.getPendingImportRequests(treeId);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error retrieving pending import requests:', error);
    res.status(500).json({ message: 'Failed to retrieve pending import requests.' });
  }
};

exports.getImportRequestsByGroupTree = async (req, res) => {
  try {
    const { treeId } = req.params;

    const requests = await importTreeRequestService.getImportRequestsByGroupTree(treeId);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error retrieving import requests:', error);
    res.status(500).json({ message: 'Failed to retrieve import requests.' });
  }
};

exports.getImportRequestsForUser = async (req, res) => {
  try {
    const requestorId = req.user ? req.user.uid : req.params.userId;

    if (!requestorId) {
      return res.status(400).json({ message: 'User ID required.' });
    }

    const requests = await importTreeRequestService.getImportRequestsForUser(requestorId);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error retrieving user import requests:', error);
    res.status(500).json({ message: 'Failed to retrieve user import requests.' });
  }
};

exports.approveImportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const reviewedBy = req.user ? req.user.uid : req.body.reviewedBy;

    if (!requestId || !reviewedBy) {
      return res.status(400).json({ message: 'requestId and reviewedBy are required.' });
    }

    const importRequest = await importTreeRequestService.getImportRequestById(requestId);
    if (!importRequest) {
      return res.status(404).json({ message: 'Import request not found.' });
    }

    const group = await familyGroupService.getGroupByTreeId(importRequest.groupTreeId);
    if (!group) {
      return res.status(404).json({ message: 'Family group not found for this import request.' });
    }

    // Check if the reviewer is a Host of the group
    const isHost = await isUserHostOfGroup(reviewedBy, group.id);
    if (!isHost) {
      return res.status(403).json({ message: 'Only group hosts can approve import requests.' });
    }

    const updatedRequest = await importTreeRequestService.updateImportRequestStatus(
      requestId,
      'approved',
      reviewedBy
    );

    res.status(200).json({
      message: 'Import request approved.',
      importRequest: updatedRequest
    });
  } catch (error) {
    console.error('Error approving import request:', error);
    res.status(500).json({ message: error.message || 'Failed to approve import request.' });
  }
};

exports.rejectImportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const reviewedBy = req.user ? req.user.uid : req.body.reviewedBy;

    if (!requestId || !reviewedBy) {
      return res.status(400).json({ message: 'requestId and reviewedBy are required.' });
    }

    const importRequest = await importTreeRequestService.getImportRequestById(requestId);
    if (!importRequest) {
      return res.status(404).json({ message: 'Import request not found.' });
    }

    const group = await familyGroupService.getGroupByTreeId(importRequest.groupTreeId);
    if (!group) {
      return res.status(404).json({ message: 'Family group not found for this import request.' });
    }

    // Check if the reviewer is a Host of the group
    const isHost = await isUserHostOfGroup(reviewedBy, group.id);
    if (!isHost) {
      return res.status(403).json({ message: 'Only group hosts can reject import requests.' });
    }

    // Update status to rejected
    const updatedRequest = await importTreeRequestService.updateImportRequestStatus(
      requestId,
      'rejected',
      reviewedBy
    );

    res.status(200).json({
      message: 'Import request rejected.',
      importRequest: updatedRequest
    });
  } catch (error) {
    console.error('Error rejecting import request:', error);
    res.status(500).json({ message: error.message || 'Failed to reject import request.' });
  }
};

exports.deleteImportRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const importRequest = await importTreeRequestService.getImportRequestById(requestId);
    if (!importRequest) {
      return res.status(404).json({ message: 'Import request not found.' });
    }

    await importTreeRequestService.deleteImportRequest(requestId);
    res.status(200).json({ message: 'Import request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting import request:', error);
    res.status(500).json({ message: 'Failed to delete import request.' });
  }
};
