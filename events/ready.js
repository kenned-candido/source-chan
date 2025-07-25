const logger = require('../utils/logger.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Source-chan conectada como ${client.user.tag}`);
  },
};
