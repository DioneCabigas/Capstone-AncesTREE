const treeMergeService = require('../services/treeMergeService');

exports.getTreeMergeStats = async (req, res) => {
  const { treeId } = req.params;

  if (!treeId) {
    return res.status(400).json({ message: 'Tree ID is required.' });
  }

  try {
    const stats = await treeMergeService.getTreeMergeStats(treeId);
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting tree merge stats:', error);
    res.status(500).json({ message: 'Failed to get tree merge statistics.' });
  }
};

exports.revertMerge = async (req, res) => {
  const { treeId } = req.params;
  const { mergeResult } = req.body;

  if (!treeId || !mergeResult) {
    return res.status(400).json({ message: 'Tree ID and merge result are required.' });
  }

  try {
    const revertResult = await treeMergeService.revertMerge(treeId, mergeResult);
    res.status(200).json(revertResult);
  } catch (error) {
    console.error('Error reverting merge:', error);
    res.status(500).json({ message: 'Failed to revert merge operation.' });
  }
};

exports.executeManualMerge = async (req, res) => {
  const { requesterId, groupTreeId } = req.body;

  if (!requesterId || !groupTreeId) {
    return res.status(400).json({ message: 'Requester ID and group tree ID are required.' });
  }

  try {
    const mergeResult = await treeMergeService.mergePersonalTreeIntoGroup(requesterId, groupTreeId);
    res.status(200).json(mergeResult);
  } catch (error) {
    console.error('Error executing manual merge:', error);
    res.status(500).json({ 
      message: 'Failed to execute merge operation.',
      error: error.message 
    });
  }
};