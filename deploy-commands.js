const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Command list
const commands = [];

// Path to command folders
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Load all commands (using .data.toJSON())
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`[AVISO] O comando em ${filePath} está sem "data" ou "execute".`);
    }
  }
}

// Initialize the REST API with the token
const rest = new REST().setToken(process.env.TOKEN);

// Multiple guilds in .env, separated by comma
const guildIds = process.env.GUILD_IDS.split(',').map(id => id.trim());

(async () => {
  try {
    console.log(`Iniciando o registro de ${commands.length} comando(s)...`);

    for (const guildId of guildIds) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
        { body: commands },
      );
      console.log(`Comandos registrados no servidor ${guildId}`);
    }

    console.log('Todos os comandos foram registrados com sucesso.');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();
