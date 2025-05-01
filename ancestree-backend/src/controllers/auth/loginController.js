const loginService = require('../../services/auth/loginService');

exports.login = async (req, res) => {
  const { token } = req.body;

  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  try {

    const decodedToken = await loginService.verifyToken(token);
    const uid = decodedToken.uid;
    const userData = await loginService.getUserData(uid);

    req.session.userId = uid;
    req.session.userData = userData;
    res.status(200).json({ message: 'Login successful', uid, userData });

  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
};