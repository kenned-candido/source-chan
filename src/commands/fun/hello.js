const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Diz olá para o usuário.'),
  
  async execute(interaction) {
    const displayName = interaction.user.globalName || interaction.user.username;
    await interaction.reply(`Olá, ${displayName}!`);
  },
};
