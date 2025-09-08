const { SlashCommandBuilder } = require('discord.js');
const { sendValveImage } = require('../../utils/valveScheduler');
const { sendValveWiki } = require('../../utils/valveWiki');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('valve')
    .setDescription('Funções relacionadas à Valve')
    .addSubcommand(sub =>
      sub.setName('archive')
        .setDescription('Envia uma imagem aleatória do Valve Archive')
    )
    .addSubcommand(sub =>
      sub.setName('wiki')
        .setDescription('Envia um link aleatório da Valve Developer Wiki')
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'archive') {
      sendValveImage(interaction.channel);
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
    }

    if (sub === 'wiki') {
      sendValveWiki(interaction.channel);
      await interaction.deferReply({ ephemeral: true });
      await interaction.deleteReply();
    }
  }
};
