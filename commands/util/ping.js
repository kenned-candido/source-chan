const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Responde com a latência do bot.'),
  
  async execute(interaction, client) {
    const ping = Date.now() - interaction.createdTimestamp;
    await interaction.reply(`Pong! Latência: ${ping}ms`);
  },
};
