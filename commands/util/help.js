const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config/config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra todos os comandos disponíveis ou detalhes de um comando específico.')
    .addStringOption(option =>
      option
        .setName('comando')
        .setDescription('Nome de um comando específico para obter ajuda.')
    ),

  async execute(interaction, client) {
    const comandoNome = interaction.options.getString('comando');

    // If the user asks for help on a specific command
    if (comandoNome) {
      const comando = client.commands.get(comandoNome);
      if (!comando) {
        return interaction.reply({ content: `Comando \`${comandoNome}\` não encontrado.`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Ajuda: /${comando.data.name}`)
        .setDescription(comando.data.description || 'Sem descrição.')
        .setColor(config.embedColor);

      return interaction.reply({ embeds: [embed] });
    }

    // Generates list of all commands organized by category
    const categorias = {};

    for (const [nome, comando] of client.commands) {
      // Extract the folder from the command based on the structure
      const caminho = comando.__filename || '';
      const partes = caminho.split(path.sep);
      const categoria = partes.includes('fun') ? 'Diversão' :
                        partes.includes('util') ? 'Utilitários' : 'Outros';

      if (!categorias[categoria]) categorias[categoria] = [];
      categorias[categoria].push(`</${nome}:> — ${comando.data.description}`);
    }

    const embed = new EmbedBuilder()
      .setTitle('Comandos disponíveis')
      .setColor(config.embedColor)
      .setFooter({ text: `Use /help [comando] para mais detalhes.` })
      .setTimestamp();

    for (const [categoria, comandos] of Object.entries(categorias)) {
      embed.addFields({
        name: categoria,
        value: comandos.join('\n'),
        inline: false,
      });
    }

    return interaction.reply({ embeds: [embed] });
  },
};
