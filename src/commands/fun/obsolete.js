const { ContextMenuCommandBuilder, ApplicationCommandType } = require('discord.js');
const path = require('path');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Obsolete')
    .setType(ApplicationCommandType.Message),

  async execute(interaction) {
    const imagePath = path.join(__dirname, 'assets/images/memes/obsolete.png');

    await interaction.reply({
      files: [imagePath],
    });
  },
};
