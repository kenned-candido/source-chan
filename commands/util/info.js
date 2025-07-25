const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações sobre o bot.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle(`${config.botName}`)
      .setDescription('Sou um bot criado para auxiliar, divertir e interagir com os membros!')
      .addFields(
        { name: 'Versão', value: config.version, inline: true },
        { name: 'Linguagem', value: 'JavaScript (Node.js)', inline: true },
        { name: 'Desenvolvedor', value: `<@${config.ownerId}>`, inline: false }
      )
      .setColor(config.embedColor)
      .setFooter({ text: 'Obrigado por usar o Source-chan ❤️' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
