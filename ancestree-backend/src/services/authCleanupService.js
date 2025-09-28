const admin = require('../config/database');

const authAdmin = admin.auth();

/**
 * Deletes a Firebase Auth user using the Admin SDK
 * This is useful for cleaning up users when registration fails
 * @param {string} uid - The Firebase Auth user UID to delete
 * @returns {Promise<void>}
 */
exports.deleteAuthUser = async (uid) => {
  try {
    await authAdmin.deleteUser(uid);
    console.log(`Successfully deleted Firebase Auth user with UID: ${uid}`);
  } catch (error) {
    console.error(`Failed to delete Firebase Auth user with UID: ${uid}`, error);
    throw new Error(`Failed to delete Firebase Auth user: ${error.message}`);
  }
};

/**
 * Checks if a Firebase Auth user exists
 * @param {string} uid - The Firebase Auth user UID to check
 * @returns {Promise<boolean>} - True if user exists, false otherwise
 */
exports.authUserExists = async (uid) => {
  try {
    await authAdmin.getUser(uid);
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return false;
    }
    throw error;
  }
};

/**
 * Gets Firebase Auth user information
 * @param {string} uid - The Firebase Auth user UID
 * @returns {Promise<Object>} - User record from Firebase Auth
 */
exports.getAuthUser = async (uid) => {
  try {
    return await authAdmin.getUser(uid);
  } catch (error) {
    console.error(`Failed to get Firebase Auth user with UID: ${uid}`, error);
    throw new Error(`Failed to get Firebase Auth user: ${error.message}`);
  }
};