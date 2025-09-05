const { SlashCommandBuilder } = require('discord.js');
const { sendValveImage } = require('../../utils/valveScheduler');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('valve')
    .setDescription('Funções do Valve Archive')
    .addSubcommand(sub =>
      sub.setName('archive')
        .setDescription('Envia uma imagem aleatória do Valve Archive')
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'archive') {
      // Upload the image directly to the channel
      sendValveImage(interaction.channel);
      
      // Ends the interaction without a visible message
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
    }
  }
};
