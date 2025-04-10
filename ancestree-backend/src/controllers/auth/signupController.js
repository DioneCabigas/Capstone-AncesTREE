const signupService = require('../../services/auth/signupService');

exports.signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Required fields missing' });

  try {

    const userRecord = await signupService.createUser(email, password);
    const userData = await signupService.storeUserData(userRecord.uid, email);
    
    res.status(201).json({ message: 'User created', uid: userRecord.uid, userData });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};