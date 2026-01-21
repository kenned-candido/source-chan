const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../../config/config.json');
const pkg = require('../../../package.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informações sobre o bot.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setDescription('Me chamo **Source-chan**! Estou aqui para ajudar, divertir e interagir com todos vocês!')
      .addFields(
        { name: 'Versão', value: config.version, inline: true },
        { name: 'Linguagem', value: '<:1415050954465874000:1415082842517405797> JavaScript', inline: true },
        { name: 'Framework', value: `<:1415050963420577952:1415082853854613545> Discord.js v${pkg.dependencies['discord.js'].replace('^', '')}`, inline: true },
        { name: 'Desenvolvedor', value: `<@${config.ownerId}>`, inline: false }
      )
      .setColor(config.embedColor)
      .setFooter({ text: 'Obrigado por usar a Source-chan ❤️' })
      .setTimestamp();

    // Botões interativos
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Github')
        .setEmoji('<:1415055637678788718:1415083270789660702>')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/kenned-candido/source-chan'),
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  },
};
