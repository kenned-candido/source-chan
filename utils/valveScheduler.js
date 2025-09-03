const { EmbedBuilder } = require('discord.js');
const valveImages = require('../config/valve_images.json');
const config = require('../config/config.json');
const logger = require('./logger.js');

function getRandomValveImage() {
  const index = Math.floor(Math.random() * valveImages.length);
  return valveImages[index];
}

function generateDailySchedule() {
  const startHour = 10;
  const endHour = 21;
  const today = new Date();

  // random number of images between 1 and 3
  const total = Math.floor(Math.random() * 3) + 1;

  const times = [];
  while (times.length < total) {
    const randHour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
    const randMinute = Math.floor(Math.random() * 60);

    const run = new Date(today);
    run.setHours(randHour, randMinute, 0, 0);

    if (run > today) {
      times.push(run);
    }
  }

  // Order chronologically
  times.sort((a, b) => a - b);

  return times;
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

    setTimeout(() => {
      const url = getRandomValveImage();
      logger.info(`Enviando imagem ${i + 1}/${schedule.length} (${url})`);

      const embed = new EmbedBuilder()
        .setTitle("📷 Valve Archive")
        .setImage(url)
        .setColor(config.embedColor)
        .setFooter({ text: "Imagem aleatória do Valve Archive" });

      channel.send({ embeds: [embed] })
        .then(() => logger.info(`Imagem ${i + 1}/${schedule.length} enviada às ${new Date().toLocaleString()}`))
        .catch(err => logger.error(`Erro ao enviar imagem: ${err}`));
    }, delay);
  });

  // Reschedule for tomorrow
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;

  setTimeout(() => scheduleDailyImages(channel), msUntilMidnight);
}

module.exports = { scheduleDailyImages };
