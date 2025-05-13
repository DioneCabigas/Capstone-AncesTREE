const { db } = require('../config/database');

// Create a new family tree
const createFamilyTree = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.uid;
    
    const treeData = {
      name,
      description: description || '',
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const treeRef = await db.collection('familyTrees').add(treeData);
    
    return res.status(201).json({
      success: true,
      message: 'Family tree created successfully',
      treeId: treeRef.id,
      tree: { id: treeRef.id, ...treeData }
    });
  } catch (error) {
    console.error('Error creating family tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating family tree',
      error: error.message
    });
  }
};

// Get all family trees for a user
const getFamilyTrees = async (req, res) => {
  try {
    const userId = req.user.uid;
    
    const treesSnapshot = await db.collection('familyTrees')
      .where('userId', '==', userId)
      .get();
    
    const trees = [];
    treesSnapshot.forEach(doc => {
      trees.push({ id: doc.id, ...doc.data() });
    });
    
    return res.status(200).json({
      success: true,
      trees
    });
  } catch (error) {
    console.error('Error fetching family trees:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family trees',
      error: error.message
    });
  }
};

// Get a specific family tree
const getFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const userId = req.user.uid;
    
    const treeDoc = await db.collection('familyTrees').doc(treeId).get();
    
    if (!treeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }
    
    const treeData = treeDoc.data();
    
    // Check if the user has access to this tree
    if (treeData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    return res.status(200).json({
      success: true,
      tree: { id: treeDoc.id, ...treeData }
    });
  } catch (error) {
    console.error('Error fetching family tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family tree',
      error: error.message
    });
  }
};

// Update a family tree
const updateFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.uid;
    
    const treeDoc = await db.collection('familyTrees').doc(treeId).get();
    
    if (!treeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }
    
    const treeData = treeDoc.data();
    
    // Check if the user has access to update this tree
    if (treeData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {
      name: name || treeData.name,
      description: description !== undefined ? description : treeData.description,
      updatedAt: new Date().toISOString()
    };
    
    await db.collection('familyTrees').doc(treeId).update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Family tree updated successfully',
      tree: { id: treeId, ...treeData, ...updateData }
    });
  } catch (error) {
    console.error('Error updating family tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating family tree',
      error: error.message
    });
  }
};

// Delete a family tree
const deleteFamilyTree = async (req, res) => {
  try {
    const { treeId } = req.params;
    const userId = req.user.uid;
    
    const treeDoc = await db.collection('familyTrees').doc(treeId).get();
    
    if (!treeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }
    
    const treeData = treeDoc.data();
    
    // Check if the user has access to delete this tree
    if (treeData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get family members related to this tree
    const membersSnapshot = await db.collection('familyMembers')
      .where('treeId', '==', treeId)
      .get();
    
    // Delete all family members in this tree
    const batch = db.batch();
    
    membersSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the tree itself
    batch.delete(db.collection('familyTrees').doc(treeId));
    
    await batch.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Family tree and associated members deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting family tree:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting family tree',
      error: error.message
    });
  }
};

module.exports = {
  createFamilyTree,
  getFamilyTrees,
  getFamilyTree,
  updateFamilyTree,
  deleteFamilyTree
};