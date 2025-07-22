// Main imports
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // Load the .env to access the TOKEN

// Creating the bot client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, // For slash commands and interactions
    GatewayIntentBits.GuildMessages, // For messages
    GatewayIntentBits.MessageContent // To read the content of messages (if using prefix in future)
  ]
});

// Collection to store loaded commands
client.commands = new Collection();

// Path to the command folder
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Automatic reading of all commands
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[AVISO] O comando em ${filePath} está sem "data" ou "execute".`);
    }
  }
}

// Automatic event reading
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

// Bot login
client.login(process.env.TOKEN);
