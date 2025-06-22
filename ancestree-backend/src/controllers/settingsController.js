const settingsService = require('../services/settingsService');

const settingsController = {
  async getSettings(req, res) {
    const { uid } = req.params;

    try {
      const settings = await settingsService.getSettings(uid);
      res.json(settings);
    } catch (error) {
      res.status(404).json({ message: error.message });
    }
  },

  async saveSettings(req, res) {
    const { uid, preferences, permissions } = req.body;

    if (!uid) {
      return res.status(400).json({ message: 'Missing UID' });
    }

    try {
      const message = await settingsService.saveSettings(uid, preferences, permissions);
      res.json({ message });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = settingsController;