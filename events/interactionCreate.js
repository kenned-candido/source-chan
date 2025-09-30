const logger = require('../utils/logger.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // --- Slash Commands ---
    if (interaction.isChatInputCommand()) {
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
      return;
    }

    // --- Context Menu Commands ---
    if (interaction.isMessageContextMenuCommand() || interaction.isUserContextMenuCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        logger.warn(`Context menu não encontrado: ${interaction.commandName}`);
        return;
      }
      try {
        await command.execute(interaction, client);
      } catch (error) {
        logger.error(`Erro no context menu ${interaction.commandName}: ${error.message}`);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Ocorreu um erro ao executar este menu.', flags: 64 });
        } else {
          await interaction.reply({ content: 'Ocorreu um erro ao executar este menu.', flags: 64 });
        }
      }
      return;
    }

    // --- Modals delegados ao comando task ---
    if (interaction.isModalSubmit() && interaction.customId?.startsWith('task')) {
      const taskCmd = client.commands.get('task');
      if (taskCmd && typeof taskCmd.handleModalSubmit === 'function') {
        try {
          await taskCmd.handleModalSubmit(interaction, client);
        } catch (err) {
          logger.error(`Erro em task.handleModalSubmit: ${err.message}`);
          if (!interaction.replied) await interaction.reply({ content: 'Erro ao processar o modal.', flags: 64 });
        }
      }
      return;
    }

    // --- Botões delegados ao comando task ---
    if (interaction.isButton() && interaction.customId?.startsWith('task')) {
      const taskCmd = client.commands.get('task');
      if (taskCmd && typeof taskCmd.handleButtonInteraction === 'function') {
        try {
          await taskCmd.handleButtonInteraction(interaction, client);
        } catch (err) {
          logger.error(`Erro em task.handleButtonInteraction: ${err.message}`);
          if (!interaction.replied) await interaction.reply({ content: 'Erro ao processar o botão.', flags: 64 });
        }
      }
      return;
    }
  },
};
