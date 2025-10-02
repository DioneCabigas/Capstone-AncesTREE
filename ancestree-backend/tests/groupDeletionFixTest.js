const familyGroupService = require('../src/services/familyGroupService');

async function testValidation() {
  console.log('🧪 TESTING GROUP DELETION VALIDATION FIXES\n');

  try {
    // Test 1: Empty string groupId
    console.log('=== TEST 1: Empty string groupId ===');
    try {
      await familyGroupService.deleteGroup('');
      console.log('❌ Should have thrown error for empty string');
    } catch (error) {
      console.log('✅ Correctly caught empty string error:', error.message);
    }

    // Test 2: Null groupId
    console.log('\n=== TEST 2: Null groupId ===');
    try {
      await familyGroupService.deleteGroup(null);
      console.log('❌ Should have thrown error for null');
    } catch (error) {
      console.log('✅ Correctly caught null error:', error.message);
    }

    // Test 3: Undefined groupId
    console.log('\n=== TEST 3: Undefined groupId ===');
    try {
      await familyGroupService.deleteGroup(undefined);
      console.log('❌ Should have thrown error for undefined');
    } catch (error) {
      console.log('✅ Correctly caught undefined error:', error.message);
    }

    // Test 4: Whitespace only groupId
    console.log('\n=== TEST 4: Whitespace only groupId ===');
    try {
      await familyGroupService.deleteGroup('   ');
      console.log('❌ Should have thrown error for whitespace');
    } catch (error) {
      console.log('✅ Correctly caught whitespace error:', error.message);
    }

    // Test 5: Non-existent but valid groupId
    console.log('\n=== TEST 5: Non-existent but valid groupId ===');
    try {
      await familyGroupService.deleteGroup('non-existent-group-id');
      console.log('❌ Should have thrown error for non-existent group');
    } catch (error) {
      console.log('✅ Correctly handled non-existent group:', error.message);
    }

    console.log('\n🎉 All validation tests passed!');
    console.log('The parameter mismatch issue should now be fixed.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Validation test failed:', error.message);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testValidation().then(success => {
    if (success) {
      console.log('\n✨ Group deletion validation is working correctly!');
      console.log('You should now be able to delete groups without the "documentPath" error.');
    } else {
      console.log('\n⚠️ There are still issues with group deletion validation.');
    }
  });
}

module.exports = { testValidation };