const mergeRequestService = require('../services/mergeRequestService');
const familyGroupMemberService = require('../services/familyGroupMemberService');
const familyGroupService = require('../services/familyGroupService');
const treeMergeService = require('../services/treeMergeService');
const userService = require('../services/userService');

exports.createMergeRequest = async (req, res) => {
  const { groupId, requesterId, targetUserId } = req.body;

  if (!groupId || !requesterId || !targetUserId) {
    return res.status(400).json({ message: 'groupId, requesterId, and targetUserId are required.' });
  }

  try {
    // Create the merge request
    const requestId = await mergeRequestService.createMergeRequest(groupId, requesterId, targetUserId);


    res.status(201).json({ message: 'Merge request created successfully.', id: requestId });
  } catch (error) {
    console.error('Error creating merge request:', error);
    res.status(500).json({ message: error.message || 'Failed to create merge request.' });
  }
};

exports.getMergeRequestsByGroup = async (req, res) => {
  const { groupId } = req.params;

  try {
    const requests = await mergeRequestService.getMergeRequestsByGroup(groupId);
    res.status(200).json(requests);
  } catch (error) {
    console.error('Error retrieving merge requests:', error);
    res.status(500).json({ message: 'Failed to retrieve merge requests.' });
  }
};

exports.getPendingMergeRequestsForOwner = async (req, res) => {
  const { groupId } = req.params;

  try {
    const requests = await mergeRequestService.getPendingMergeRequestsForOwner(groupId);
    
    // Get requester details for each request
    const requestsWithDetails = await Promise.all(
      requests.map(async (request) => {
        try {
          const requesterDetails = await userService.getUser(request.requesterId);
          return {
            ...request,
            requesterName: `${requesterDetails.firstName} ${requesterDetails.lastName || ''}`.trim(),
            requesterDetails
          };
        } catch (error) {
          console.warn(`Could not fetch details for requester ${request.requesterId}`);
          return {
            ...request,
            requesterName: 'Unknown User',
            requesterDetails: null
          };
        }
      })
    );

    res.status(200).json(requestsWithDetails);
  } catch (error) {
    console.error('Error retrieving pending merge requests:', error);
    res.status(500).json({ message: 'Failed to retrieve pending merge requests.' });
  }
};

exports.updateMergeRequestStatus = async (req, res) => {
  const { requestId } = req.params;
  const { status, reviewedBy } = req.body;

  if (!status || !reviewedBy) {
    return res.status(400).json({ message: 'Status and reviewedBy are required.' });
  }

  if (!['approved', 'denied', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Status must be "approved", "denied", or "failed".' });
  }

  try {
    // First, get the merge request details to know who is requesting and which group
    const mergeRequest = await mergeRequestService.getMergeRequestById(requestId);
    
    if (!mergeRequest) {
      return res.status(404).json({ message: 'Merge request not found.' });
    }

    // Update the merge request status first
    await mergeRequestService.updateMergeRequestStatus(requestId, status, reviewedBy);
    
    // If approved, execute the actual merge
    if (status === 'approved') {
      try {
        // Get the group to find its associated tree
        const group = await familyGroupService.getFamilyGroupById(mergeRequest.groupId);
        if (!group) {
          throw new Error('Group not found');
        }

        // Execute the merge: copy requester's personal tree into group tree
        const mergeResult = await treeMergeService.mergePersonalTreeIntoGroup(
          mergeRequest.requesterId,
          group.treeId
        );

        console.log('Merge executed successfully:', mergeResult);
        
        res.status(200).json({ 
          message: 'Merge request approved and executed successfully.',
          mergeResult: mergeResult
        });
        
      } catch (mergeError) {
        console.error('Error executing merge:', mergeError);
        // Update request status to failed
        await mergeRequestService.updateMergeRequestStatus(requestId, 'failed', reviewedBy);
        
        res.status(500).json({ 
          message: 'Merge request approved but execution failed.',
          error: mergeError.message
        });
      }
    } else {
      res.status(200).json({ message: 'Merge request denied successfully.' });
    }
    
  } catch (error) {
    console.error('Error updating merge request status:', error);
    res.status(500).json({ message: 'Failed to update merge request status.' });
  }
};

exports.deleteMergeRequest = async (req, res) => {
  const { requestId } = req.params;

  try {
    await mergeRequestService.deleteMergeRequest(requestId);
    
    res.status(200).json({ message: 'Merge request deleted successfully.' });
  } catch (error) {
    console.error('Error deleting merge request:', error);
    res.status(500).json({ message: 'Failed to delete merge request.' });
  }
};
