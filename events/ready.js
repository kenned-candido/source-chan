const logger = require('../utils/logger.js');
const { scheduleDailyImages } = require('../utils/valveScheduler.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.info(`Bot conectado como ${client.user.tag}`);

    const channelId = "1371686275538620486"; // Replace with the desired channel ID
    const channel = client.channels.cache.get(channelId);

    if (channel) {
      scheduleDailyImages(channel);
      logger.info(`Agendamento diário de imagens iniciado para o canal ${channelId}`);
    } else {
      logger.warn(`Canal ${channelId} não encontrado. Verifique o ID.`);
    }
  },
};
