const mergeRequestService = require('../services/mergeRequestService');
const familyGroupMemberService = require('../services/familyGroupMemberService');

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

  if (!['approved', 'denied'].includes(status)) {
    return res.status(400).json({ message: 'Status must be either "approved" or "denied".' });
  }

  try {
    await mergeRequestService.updateMergeRequestStatus(requestId, status, reviewedBy);
    
    res.status(200).json({ message: 'Merge request status updated successfully.' });
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
