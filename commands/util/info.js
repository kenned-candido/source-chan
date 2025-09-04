const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config/config.json');
const pkg = require('../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações sobre o bot.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setDescription('Sou Yumi Takahashi, também conhecida como Source-chan! Estou aqui para ajudar, divertir e interagir com todos vocês!')
      .addFields(
        { name: 'Versão', value: config.version, inline: true },
        { name: 'Linguagem', value: 'JavaScript (Node.js)', inline: true },
        { name: 'Framework', value: `Discord.js v${pkg.dependencies['discord.js'].replace('^', '')}`, inline: true },
        { name: 'Desenvolvedor', value: `<@${config.ownerId}>`, inline: false }
      )
      .setColor(config.embedColor)
      .setFooter({ text: 'Obrigado por usar a Source-chan ❤️' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
