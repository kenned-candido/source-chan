const {
  SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');
const config = require('../../../config/config.json');
const logger = require('../../utils/logger.js');
const db = require('../../../database/db');

// --- Configurable emojis ---
// Status Icons
const ICON_CURSOR = '<a:1339687866451759236:1414684314267816027>';
const ICON_CHECKED = '<:1339687857121244894:1463695599835811882>';
const ICON_UNCHECKED = '<:1339687841936183387:1414684239697416273>';

// Button icons
const ICON_UP = '↑';
const ICON_DOWN = '↓';
const ICON_BTN_CHECK = '<:1339687857121244894:1463695599835811882>';
const ICON_BTN_EDIT = '✏️';
const ICON_BTN_DELETE = '🗑️';

const taskCursors = new Map(); // messageId -> cursor index

// Build the action row with buttons (reusable)
function buildTaskButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('task_up').setLabel(ICON_UP).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('task_down').setLabel(ICON_DOWN).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('task_toggle').setEmoji(ICON_BTN_CHECK).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('task_edit').setEmoji(ICON_BTN_EDIT).setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('task_delete').setEmoji(ICON_BTN_DELETE).setStyle(ButtonStyle.Danger),
  );
}

// Parse lines from embed description into objects { text, done }
function parseItemsFromDescription(description) {
  if (!description) return [];
  const lines = description.split('\n').map(l => l.trim()).filter(Boolean);
  return lines.map(line => {
    // remove pointer (cursor) se presente
    let s = line;
    if (s.startsWith(ICON_CURSOR)) {
      s = s.slice(ICON_CURSOR.length).trim();
    }

    // detect done/undone using startsWith (no regex)
    let done = false;
    if (s.startsWith(ICON_CHECKED)) {
      done = true;
      s = s.slice(ICON_CHECKED.length).trim();
    } else if (s.startsWith(ICON_UNCHECKED)) {
      done = false;
      s = s.slice(ICON_UNCHECKED.length).trim();
    }

    // final trim (security)
    s = s.trim();
    return { text: s, done };
  });
}

// Format items back to description strings, highlighting cursor
function formatItemsForDescription(items, cursor = 0) {
  return items.map((it, i) => {
    const status = it.done ? ICON_CHECKED : ICON_UNCHECKED;
    const prefix = i === cursor ? `${ICON_CURSOR} ` : '';
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

  // Execute slash command — open modal
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

  // --- Modal Submit handler (creation and editing) ---
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

      // save in bank
      db.createList({
        id: msg.id,
        userId: interaction.user.id,
        title,
        tasks: items
      });
      return;
    }

    // Edit existing list
    if (interaction.customId.startsWith('taskEditModal_')) {
      const messageId = interaction.customId.split('_')[1];
      const title = interaction.fields.getTextInputValue('taskTitle');
      const itemsRaw = interaction.fields.getTextInputValue('taskItems');
      const newItems = itemsRaw.split('\n').map(i => i.trim()).filter(Boolean);

      try {
        const channel = await client.channels.fetch(interaction.channelId);
        const msg = await channel.messages.fetch(messageId);
        const oldEmbed = msg.embeds[0];

        // parse the old items using the robust function
        const oldItems = parseItemsFromDescription(oldEmbed.description);

        // set of normalized checked texts (lowercase + trim)
        const checkedSet = new Set(oldItems.filter(it => it.done).map(it => it.text.toLowerCase().trim()));

        // reapply state: compares normalized strings (keeps existing checks)
        const finalItems = newItems.map(t => ({
          text: t,
          done: checkedSet.has(t.toLowerCase().trim()),
        }));

        const doneCount = finalItems.filter(it => it.done).length;
        const percent = finalItems.length === 0 ? 0 : Math.round((doneCount / finalItems.length) * 100);

        const embed = new EmbedBuilder()
          .setTitle(`${title} [${percent}%]`)
          .setDescription(formatItemsForDescription(finalItems, 0))
          .setColor(config.embedColor)
          .setFooter({ text: 'Use os botões abaixo para gerenciar sua lista' })
          .setTimestamp();

        await msg.edit({ embeds: [embed], components: msg.components });
        logger.info(`Lista ${messageId} editada com sucesso por ${interaction.user.tag}`);
        await interaction.deferUpdate();

        // update in bank
        db.updateList({
          id: messageId,
          title,
          tasks: finalItems
        });
      } catch (err) {
        logger.error(`Erro ao editar lista: ${err.message}`);
        await interaction.reply({ content: 'Não consegui editar a lista.', flags: 64 });
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

        // remove do banco
        const deleted = db.deleteList(message.id);

        if (deleted) {
          logger.info(
            `Lista ${message.id} deletada por ${interaction.user.tag} (${interaction.user.id})`
          );
        } else {
          logger.warn(
            `Tentativa de deletar lista inexistente: ${message.id} por ${interaction.user.tag}`
          );
        }

        await message.delete();
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

    // save updated progress
    db.updateList({
      id: message.id,
      title: titleBase,
      tasks: items
    });
  },
};
