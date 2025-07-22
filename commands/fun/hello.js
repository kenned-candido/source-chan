const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('Diz olá para o usuário.'),
  
  async execute(interaction) {
    await interaction.reply(`Olá, ${interaction.user.username}!`);
  },
};
