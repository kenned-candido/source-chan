const logger = require('../utils/logger.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Comando não encontrado: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Erro ao executar ${interaction.commandName}: ${error.message}`);

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'Ocorreu um erro ao executar este comando.', flags: 64 });
      } else {
        await interaction.reply({ content: 'Ocorreu um erro ao executar este comando.', flags: 64 });
      }
    }
  },
};
