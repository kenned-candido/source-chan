const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const dayjs = require('dayjs');

// Cria pasta de logs se não existir
const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Caminhos dos arquivos de log
const today = dayjs().format('YYYY-MM-DD');
const dailyLogFile = path.join(logDir, `${today}.log`);
const latestLogFile = path.join(logDir, `latest.log`);

// Função para escrever no arquivo
function writeLog(level, message) {
  const timestamp = dayjs().format('YYYY-MM-DD HH:mm:ss');
  const formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;

  fs.appendFileSync(dailyLogFile, formatted);
  fs.writeFileSync(latestLogFile, formatted, { flag: 'a' }); // sobrescreve se reiniciar
}

// Exporta os métodos de log
module.exports = {
  info: (msg) => {
    const timestamp = chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`);
    console.log(`${timestamp} ${chalk.cyan('[INFO]')} ${msg}`);
    writeLog('info', msg);
  },

  warn: (msg) => {
    const timestamp = chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`);
    console.warn(`${timestamp} ${chalk.yellow('[WARN]')} ${msg}`);
    writeLog('warn', msg);
  },

  error: (msg) => {
    const timestamp = chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`);
    console.error(`${timestamp} ${chalk.red('[ERROR]')} ${msg}`);
    writeLog('error', msg);
  },

  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      const timestamp = chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}]`);
      console.debug(`${timestamp} ${chalk.magenta('[DEBUG]')} ${msg}`);
      writeLog('debug', msg);
    }
  },
};
