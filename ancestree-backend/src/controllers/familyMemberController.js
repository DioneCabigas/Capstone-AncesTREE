const { db } = require('../config/database');

// Create a new family member
const createFamilyMember = async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      birthDate,
      birthplace,
      sex,
      status,
      dateOfDeath,
      placeOfDeath,
      parentIds,
      spouseIds,
      childrenIds,
      treeId
    } = req.body;
    
    const userId = req.user.uid;
    
    // Validate tree ownership
    const treeDoc = await db.collection('familyTrees').doc(treeId).get();
    
    if (!treeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }
    
    if (treeDoc.data().userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this family tree'
      });
    }
    
    const memberData = {
      firstName,
      middleName: middleName || '',
      lastName,
      birthDate: birthDate || '',
      birthplace: birthplace || '',
      sex: sex || '',
      status: status || 'living',
      dateOfDeath: dateOfDeath || '',
      placeOfDeath: placeOfDeath || '',
      parentIds: parentIds || [],
      spouseIds: spouseIds || [],
      childrenIds: childrenIds || [],
      treeId,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const memberRef = await db.collection('familyMembers').add(memberData);
    
    // Update any parent records to include this new member as a child
    if (parentIds && parentIds.length > 0) {
      const batch = db.batch();
      
      for (const parentId of parentIds) {
        const parentRef = db.collection('familyMembers').doc(parentId);
        const parentDoc = await parentRef.get();
        
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          const updatedChildrenIds = [...(parentData.childrenIds || []), memberRef.id];
          
          batch.update(parentRef, { childrenIds: updatedChildrenIds });
        }
      }
      
      await batch.commit();
    }
    
    // Update any spouse records to include this new member
    if (spouseIds && spouseIds.length > 0) {
      const batch = db.batch();
      
      for (const spouseId of spouseIds) {
        const spouseRef = db.collection('familyMembers').doc(spouseId);
        const spouseDoc = await spouseRef.get();
        
        if (spouseDoc.exists) {
          const spouseData = spouseDoc.data();
          const updatedSpouseIds = [...(spouseData.spouseIds || []), memberRef.id];
          
          batch.update(spouseRef, { spouseIds: updatedSpouseIds });
        }
      }
      
      await batch.commit();
    }
    
    // Update any children records to include this new member as a parent
    if (childrenIds && childrenIds.length > 0) {
      const batch = db.batch();
      
      for (const childId of childrenIds) {
        const childRef = db.collection('familyMembers').doc(childId);
        const childDoc = await childRef.get();
        
        if (childDoc.exists) {
          const childData = childDoc.data();
          const updatedParentIds = [...(childData.parentIds || []), memberRef.id];
          
          batch.update(childRef, { parentIds: updatedParentIds });
        }
      }
      
      await batch.commit();
    }
    
    return res.status(201).json({
      success: true,
      message: 'Family member created successfully',
      memberId: memberRef.id,
      member: { id: memberRef.id, ...memberData }
    });
  } catch (error) {
    console.error('Error creating family member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating family member',
      error: error.message
    });
  }
};

// Get all family members for a specific tree
const getFamilyMembers = async (req, res) => {
  try {
    const { treeId } = req.params;
    const userId = req.user.uid;
    
    // Validate tree ownership
    const treeDoc = await db.collection('familyTrees').doc(treeId).get();
    
    if (!treeDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family tree not found'
      });
    }
    
    // Check access to tree
    if (treeDoc.data().userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this family tree'
      });
    }
    
    const membersSnapshot = await db.collection('familyMembers')
      .where('treeId', '==', treeId)
      .get();
    
    const members = [];
    membersSnapshot.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });
    
    return res.status(200).json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Error fetching family members:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family members',
      error: error.message
    });
  }
};

// Get a specific family member
const getFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.user.uid;
    
    const memberDoc = await db.collection('familyMembers').doc(memberId).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }
    
    const memberData = memberDoc.data();
    
    // Check if user has access to this member
    if (memberData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    return res.status(200).json({
      success: true,
      member: { id: memberDoc.id, ...memberData }
    });
  } catch (error) {
    console.error('Error fetching family member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching family member',
      error: error.message
    });
  }
};

// Update a family member
const updateFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const {
      firstName,
      middleName,
      lastName,
      birthDate,
      birthplace,
      sex,
      status,
      dateOfDeath,
      placeOfDeath,
      parentIds,
      spouseIds,
      childrenIds
    } = req.body;
    
    const userId = req.user.uid;
    
    const memberDoc = await db.collection('familyMembers').doc(memberId).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }
    
    const memberData = memberDoc.data();
    
    // Check if user has access to update this member
    if (memberData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const updateData = {
      firstName: firstName || memberData.firstName,
      middleName: middleName !== undefined ? middleName : memberData.middleName,
      lastName: lastName || memberData.lastName,
      birthDate: birthDate !== undefined ? birthDate : memberData.birthDate,
      birthplace: birthplace !== undefined ? birthplace : memberData.birthplace,
      sex: sex !== undefined ? sex : memberData.sex,
      status: status || memberData.status,
      dateOfDeath: dateOfDeath !== undefined ? dateOfDeath : memberData.dateOfDeath,
      placeOfDeath: placeOfDeath !== undefined ? placeOfDeath : memberData.placeOfDeath,
      parentIds: parentIds || memberData.parentIds,
      spouseIds: spouseIds || memberData.spouseIds,
      childrenIds: childrenIds || memberData.childrenIds,
      updatedAt: new Date().toISOString()
    };
    
    // Handle relationship updates
    // Only if the relationships have changed
    if (parentIds && JSON.stringify(parentIds) !== JSON.stringify(memberData.parentIds)) {
      // Remove the member from previous parents that are no longer in the list
      const removedParents = memberData.parentIds.filter(id => !parentIds.includes(id));
      const addedParents = parentIds.filter(id => !memberData.parentIds.includes(id));
      
      const batch = db.batch();
      
      // Remove from old parents
      for (const parentId of removedParents) {
        const parentRef = db.collection('familyMembers').doc(parentId);
        const parentDoc = await parentRef.get();
        
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          const updatedChildrenIds = parentData.childrenIds.filter(id => id !== memberId);
          
          batch.update(parentRef, { childrenIds: updatedChildrenIds });
        }
      }
      
      // Add to new parents
      for (const parentId of addedParents) {
        const parentRef = db.collection('familyMembers').doc(parentId);
        const parentDoc = await parentRef.get();
        
        if (parentDoc.exists) {
          const parentData = parentDoc.data();
          const updatedChildrenIds = [...(parentData.childrenIds || []), memberId];
          
          batch.update(parentRef, { childrenIds: updatedChildrenIds });
        }
      }
      
      await batch.commit();
    }
    
    // Update spouse relationships if changed
    if (spouseIds && JSON.stringify(spouseIds) !== JSON.stringify(memberData.spouseIds)) {
      const removedSpouses = memberData.spouseIds.filter(id => !spouseIds.includes(id));
      const addedSpouses = spouseIds.filter(id => !memberData.spouseIds.includes(id));
      
      const batch = db.batch();
      
      // Remove from old spouses
      for (const spouseId of removedSpouses) {
        const spouseRef = db.collection('familyMembers').doc(spouseId);
        const spouseDoc = await spouseRef.get();
        
        if (spouseDoc.exists) {
          const spouseData = spouseDoc.data();
          const updatedSpouseIds = spouseData.spouseIds.filter(id => id !== memberId);
          
          batch.update(spouseRef, { spouseIds: updatedSpouseIds });
        }
      }
      
      // Add to new spouses
      for (const spouseId of addedSpouses) {
        const spouseRef = db.collection('familyMembers').doc(spouseId);
        const spouseDoc = await spouseRef.get();
        
        if (spouseDoc.exists) {
          const spouseData = spouseDoc.data();
          const updatedSpouseIds = [...(spouseData.spouseIds || []), memberId];
          
          batch.update(spouseRef, { spouseIds: updatedSpouseIds });
        }
      }
      
      await batch.commit();
    }
    
    // Update children relationships if changed
    if (childrenIds && JSON.stringify(childrenIds) !== JSON.stringify(memberData.childrenIds)) {
      const removedChildren = memberData.childrenIds.filter(id => !childrenIds.includes(id));
      const addedChildren = childrenIds.filter(id => !memberData.childrenIds.includes(id));
      
      const batch = db.batch();
      
      // Remove from old children
      for (const childId of removedChildren) {
        const childRef = db.collection('familyMembers').doc(childId);
        const childDoc = await childRef.get();
        
        if (childDoc.exists) {
          const childData = childDoc.data();
          const updatedParentIds = childData.parentIds.filter(id => id !== memberId);
          
          batch.update(childRef, { parentIds: updatedParentIds });
        }
      }
      
      // Add to new children
      for (const childId of addedChildren) {
        const childRef = db.collection('familyMembers').doc(childId);
        const childDoc = await childRef.get();
        
        if (childDoc.exists) {
          const childData = childDoc.data();
          const updatedParentIds = [...(childData.parentIds || []), memberId];
          
          batch.update(childRef, { parentIds: updatedParentIds });
        }
      }
      
      await batch.commit();
    }
    
    await db.collection('familyMembers').doc(memberId).update(updateData);
    
    return res.status(200).json({
      success: true,
      message: 'Family member updated successfully',
      member: { id: memberId, ...memberData, ...updateData }
    });
  } catch (error) {
    console.error('Error updating family member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating family member',
      error: error.message
    });
  }
};

// Delete a family member
const deleteFamilyMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    const userId = req.user.uid;
    
    const memberDoc = await db.collection('familyMembers').doc(memberId).get();
    
    if (!memberDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Family member not found'
      });
    }
    
    const memberData = memberDoc.data();
    
    // Check if user has access to delete this member
    if (memberData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update all relationships before deleting
    const batch = db.batch();
    
    // Update parent relationships
    for (const parentId of memberData.parentIds || []) {
      const parentRef = db.collection('familyMembers').doc(parentId);
      const parentDoc = await parentRef.get();
      
      if (parentDoc.exists) {
        const parentData = parentDoc.data();
        const updatedChildrenIds = parentData.childrenIds.filter(id => id !== memberId);
        
        batch.update(parentRef, { childrenIds: updatedChildrenIds });
      }
    }
    
    // Update spouse relationships
    for (const spouseId of memberData.spouseIds || []) {
      const spouseRef = db.collection('familyMembers').doc(spouseId);
      const spouseDoc = await spouseRef.get();
      
      if (spouseDoc.exists) {
        const spouseData = spouseDoc.data();
        const updatedSpouseIds = spouseData.spouseIds.filter(id => id !== memberId);
        
        batch.update(spouseRef, { spouseIds: updatedSpouseIds });
      }
    }
    
    // Update children relationships
    for (const childId of memberData.childrenIds || []) {
      const childRef = db.collection('familyMembers').doc(childId);
      const childDoc = await childRef.get();
      
      if (childDoc.exists) {
        const childData = childDoc.data();
        const updatedParentIds = childData.parentIds.filter(id => id !== memberId);
        
        batch.update(childRef, { parentIds: updatedParentIds });
      }
    }
    
    // Delete the member
    batch.delete(db.collection('familyMembers').doc(memberId));
    
    await batch.commit();
    
    return res.status(200).json({
      success: true,
      message: 'Family member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting family member:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting family member',
      error: error.message
    });
  }
};

module.exports = {
  createFamilyMember,
  getFamilyMembers,
  getFamilyMember,
  updateFamilyMember,
  deleteFamilyMember
};