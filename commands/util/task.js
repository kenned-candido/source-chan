// commands/util/task.js
const {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const config = require('../../config/config.json');

// Esses são os emojis que eu adicionei ao meu bot, você tera que alterar para os seus
/* Icons list:
    <a:1339687866451759236:1414681424304406562> => cursor
    <:1385088692829425826:1414681411201536052> =>checked
    <:1385088677818011679:1414681401672073247> => unchecked
*/
/* Icons botons:
    ↑ => up
    ↓ => down
    <:1339687857010249894:1414681385716809928> => check
    <:1339687841936183387:1414681372467138682> => unchecked
    <:1385088663020371988:1414681447771541535> => delete
*/

const taskCursors = new Map(); // messageId -> cursor index

// Build the action row with buttons (reusable)
function buildTaskButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('task_up').setLabel('↑').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('task_down').setLabel('↓').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('task_toggle').setLabel('Check/Uncheck').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('task_edit').setLabel('Editar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('task_delete').setLabel('Deletar').setStyle(ButtonStyle.Danger),
  );
}

// Parse lines from embed description into objects { text, done }
function parseItemsFromDescription(description) {
  if (!description) return [];
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    // remove pointer if present
    let s = line.replace(/^→\s*/, '');
    // detect done/undone
    let done = false;
    if (/^✅\s?/.test(s)) {
      done = true;
      s = s.replace(/^✅\s?/, '');
    } else if (/^❌\s?/.test(s)) {
      done = false;
      s = s.replace(/^❌\s?/, '');
    }
    // final trim
    s = s.trim();
    return { text: s, done };
  });
}

// Format items back to description strings, highlighting cursor
function formatItemsForDescription(items, cursor = 0) {
  return items.map((it, i) => {
    const status = it.done ? '✅' : '❌';
    const prefix = i === cursor ? '→ ' : '';
    return `${prefix}${status} ${it.text}`;
  }).join('\n');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('task')
    .setDescription('Gerenciar listas de tarefas')
    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Cria uma nova lista de tarefas')
    ),

  // Executa o slash command — abre modal
  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'list') {
      const modal = new ModalBuilder()
        .setCustomId('taskListModal')
        .setTitle('Criar Lista de Tarefas');

      const titleInput = new TextInputBuilder()
        .setCustomId('taskTitle')
        .setLabel('Título da Lista')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: Projeto X')
        .setRequired(true);

      const itemsInput = new TextInputBuilder()
        .setCustomId('taskItems')
        .setLabel('Itens (um por linha)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Item 1\nItem 2\nItem 3')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(itemsInput)
      );

      await interaction.showModal(modal);
    }
  },

  // --- Modal Submit handler (criação e edição) ---
  async handleModalSubmit(interaction, client) {
    // New list modal
    if (interaction.customId === 'taskListModal') {
      const title = interaction.fields.getTextInputValue('taskTitle');
      const itemsRaw = interaction.fields.getTextInputValue('taskItems');
      const itemsTexts = itemsRaw.split('\n').map(i => i.trim()).filter(Boolean);
      const items = itemsTexts.map(t => ({ text: t, done: false }));

      const embed = new EmbedBuilder()
        .setTitle(`${title} [0%]`)
        .setDescription(formatItemsForDescription(items, 0))
        .setColor(config.embedColor)
        .setFooter({ text: 'Use os botões abaixo para gerenciar sua lista' })
        .setTimestamp();

      const buttons = buildTaskButtons();

      // reply and fetch message to store cursor
      const msg = await interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true });

      // initialize cursor at 0
      taskCursors.set(msg.id, 0);
      return;
    }

    // Editar lista existente
    if (interaction.customId.startsWith('taskEditModal_')) {
    const messageId = interaction.customId.split('_')[1];
    const title = interaction.fields.getTextInputValue('taskTitle');
    const itemsRaw = interaction.fields.getTextInputValue('taskItems');
    const newItems = itemsRaw.split('\n').map(i => i.trim()).filter(Boolean);

    try {
        const channel = await client.channels.fetch(interaction.channelId);
        const msg = await channel.messages.fetch(messageId);
        const oldEmbed = msg.embeds[0];

        let oldItems = oldEmbed.description?.split('\n') || [];

        // Mapear os itens que estavam como ✅
        const checkedSet = new Set(
        oldItems
            .map(i => i.replace(/^👉 /, '').trim())
            .filter(i => i.startsWith('✅'))
            .map(i => i.replace(/^✅ /, '').trim())
        );

        // Reaplicar ✅ nos novos itens, se eles estavam checados antes
        const finalItems = newItems.map(i => {
        if (checkedSet.has(i)) return `✅ ${i}`;
        return `❌ ${i}`;
        });

        const done = finalItems.filter(i => i.startsWith('✅')).length;
        const percent = Math.round((done / finalItems.length) * 100);

        const embed = new EmbedBuilder()
        .setTitle(`${title} [${percent}%]`)
        .setDescription(finalItems.join('\n'))
        .setColor(config.embedColor)
        .setFooter({ text: 'Use os botões abaixo para gerenciar sua lista' })
        .setTimestamp();

        await msg.edit({ embeds: [embed], components: msg.components });
        await interaction.reply({ content: '✅ Lista editada com sucesso!', flags: 64 });
    } catch (err) {
        logger.error(`Erro ao editar lista: ${err.message}`);
        await interaction.reply({ content: '❌ Não consegui editar a lista.', flags: 64 });
    }
    }
        },

  // --- Button handler ---
  async handleButtonInteraction(interaction, client) {
    const customId = interaction.customId;
    const message = interaction.message;
    const embed = message.embeds[0];
    if (!embed) {
      await interaction.reply({ content: 'Não consegui encontrar a lista de tarefas.', flags: 64 });
      return;
    }

    // parse items normalized
    const items = parseItemsFromDescription(embed.description);
    const titleBase = embed.title?.split(' [')[0] || 'Lista de tarefas';

    let cursor = taskCursors.get(message.id) ?? 0;
    if (cursor < 0) cursor = 0;
    if (cursor >= items.length) cursor = Math.max(0, items.length - 1);

    switch (customId) {
      case 'task_up':
        cursor = Math.max(0, cursor - 1);
        break;

      case 'task_down':
        cursor = Math.min(items.length - 1, cursor + 1);
        break;

      case 'task_toggle':
        if (items[cursor]) items[cursor].done = !items[cursor].done;
        break;

      case 'task_delete':
        taskCursors.delete(message.id);
        await message.delete();
        await interaction.reply({ content: 'Lista deletada!', flags: 64 });
        return;

      case 'task_edit': {
        // Build modal prefilled with cleaned title and items (without emojis/pointer)
        const modal = new ModalBuilder()
          .setCustomId(`taskEditModal_${message.id}`)
          .setTitle('Editar Lista de Tarefas');

        const titleInput = new TextInputBuilder()
          .setCustomId('taskTitle')
          .setLabel('Título da Lista')
          .setStyle(TextInputStyle.Short)
          .setValue(titleBase)
          .setRequired(true);

        const cleanItems = items.map(it => it.text).join('\n');

        const itemsInput = new TextInputBuilder()
          .setCustomId('taskItems')
          .setLabel('Itens (um por linha)')
          .setStyle(TextInputStyle.Paragraph)
          .setValue(cleanItems)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(titleInput),
          new ActionRowBuilder().addComponents(itemsInput)
        );

        await interaction.showModal(modal);
        // do not update the message here
        return;
      }

      default:
        await interaction.reply({ content: 'Ação desconhecida.', flags: 64 });
        return;
    }

    // save cursor
    taskCursors.set(message.id, cursor);

    // format with highlight
    const description = formatItemsForDescription(items, cursor);
    const doneCount = items.filter(it => it.done).length;
    const percent = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100);

    const newEmbed = EmbedBuilder.from(embed)
      .setTitle(`${titleBase} [${percent}%]`)
      .setDescription(description)
      .setTimestamp();

    // update the message
    await interaction.update({ embeds: [newEmbed], components: message.components });
  },
};
