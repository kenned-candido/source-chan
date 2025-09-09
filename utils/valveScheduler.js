const { EmbedBuilder } = require('discord.js');
const valveImages = require('../database/valve_archive.json');
const config = require('../config/config.json');
const logger = require('./logger.js');
const { URL } = require('url');

function getRandomValveImage() {
  const index = Math.floor(Math.random() * valveImages.length);
  return valveImages[index];
}

function extractInfo(url) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);

    // Decodes file name and path
    const fileName = decodeURIComponent(parts[parts.length - 1]);
    const folderPath = parts.slice(0, -1).join('/');

    return {
      fileName,
      folderUrl: `${parsed.origin}/${folderPath}`,
      relativePath: decodeURIComponent(folderPath)
    };
  } catch (err) {
    logger.error(`Erro ao extrair info da URL ${url}: ${err}`);
    return { fileName: url, folderUrl: url, relativePath: '' };
  }
}

function generateDailySchedule() {
  const startHour = 10;
  const endHour = 21;
  const today = new Date();

  const total = Math.floor(Math.random() * 3) + 1;

  const times = [];
  while (times.length < total) {
    const randHour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const randMinute = Math.floor(Math.random() * 60);

    const run = new Date(today);
    run.setHours(randHour, randMinute, 0, 0);

    if (run > today) times.push(run);
  }

  return times.sort((a, b) => a - b);
}

function sendValveImage(channel, index = 1, total = 1) {
  const url = getRandomValveImage();
  const info = extractInfo(url);

  logger.info(`Enviando imagem ${index}/${total} (${url})`);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: 'Valve Archive Result',
      iconURL: 'https://valvearchive.com/logo_new.png',
      url: 'https://valvearchive.com'
    })
    .setTitle(info.fileName)
    .setDescription(
      `${info.relativePath}/${info.fileName}\n\n` +
      `**Encontrado na pasta:** ${info.folderUrl}`
    )
    .setImage(url)
    .setColor(config.embedColor)
    .setFooter({ iconURL: config.botAvatar, text: config.botName })
    .setTimestamp();

  channel.send({ embeds: [embed] })
    .then(() => logger.info(`Imagem ${index}/${total} enviada às ${new Date().toLocaleString()}`))
    .catch(err => logger.error(`Erro ao enviar imagem: ${err}`));
}

function scheduleDailyImages(channel) {
  const now = new Date();
  let schedule = generateDailySchedule();

  logger.info(`Hoje serão enviadas ${schedule.length} imagens.`);
  schedule.forEach((t, i) => {
    logger.info(`   [${i + 1}] Programada para: ${t.toLocaleString()}`);
  });

  schedule.forEach((runTime, i) => {
    const delay = runTime - now;
    setTimeout(() => sendValveImage(channel, i + 1, schedule.length), delay);
  });

  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  setTimeout(() => scheduleDailyImages(channel), msUntilMidnight);
}

module.exports = { scheduleDailyImages, sendValveImage };
