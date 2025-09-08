const { EmbedBuilder } = require('discord.js');
const valveWiki = require('../config/valve_wiki.json');
const config = require('../config/config.json');
const logger = require('./logger.js');
const { URL } = require('url');

function getRandomWikiLink() {
  const index = Math.floor(Math.random() * valveWiki.length);
  return valveWiki[index];
}

function extractWikiTitle(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // Last part of URL -> page name
    let title = parts[parts.length - 1] || 'Página Desconhecida';
    // Decodes special characters (%20 -> space, etc.)
    title = decodeURIComponent(title);

    return title;
  } catch (err) {
    logger.error(`Erro ao extrair título da Wiki ${url}: ${err}`);
    return 'Página Desconhecida';
  }
}

function sendValveWiki(channel) {
  const url = getRandomWikiLink();
  const title = extractWikiTitle(url);

  logger.info(`Enviando link da Wiki: ${url} (Título: ${title})`);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: 'Valve Developer Wiki',
      iconURL: 'https://developer.valvesoftware.com/w/images/thumb/1/10/Icon-Source.png/32px-Icon-Source.png',
      url: 'https://developer.valvesoftware.com'
    })
    .setTitle(title)
    .setDescription(url)
    .setColor(config.embedColor)
    .setFooter({ iconURL: config.botAvatar, text: config.botName })
    .setTimestamp();

  channel.send({ embeds: [embed] })
    .then(() => logger.info(`Link enviado às ${new Date().toLocaleString()}`))
    .catch(err => logger.error(`Erro ao enviar link: ${err}`));
}

module.exports = { sendValveWiki };
