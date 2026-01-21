const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const path = require('path');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Absolute Cinema')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const imagePath = path.join(__dirname, 'assets/images/absolute-cinema.png');

    await interaction.reply({
      files: [imagePath],
    });
  },
};
