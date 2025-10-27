import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { createConnection, testConnection } from './services/db.js';
import { checkOrCreateTables } from './services/checkTables.js';
import { updateFactions } from './services/factions.js';
import { log } from './services/log.js';
import fs from 'fs/promises';
import path from 'path';

const config = JSON.parse(await fs.readFile('json-storage/config.json', 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent,
  ],
});

// Set global functions
global.log = log;

client.commands = new Collection();
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = (await fs.readdir(commandsPath)).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, command);
}

log.write('[BOOT] Bot startup process running...');

const db = createConnection(config);

await testConnection(db, config);
await checkOrCreateTables(db, config);

client.once('clientReady', () => {
  log.write(`[BOOT] Bot online as ${client.user.tag}!`);
  updateFactions(db);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() && interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.autocomplete(interaction, client, db);
    } catch {
      await interaction.reply({ content: 'Autocomplete error!', ephemeral: true });
    }
    return;
  }

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client, db);
  } catch {
    await interaction.reply({ content: 'Error executing this command!', ephemeral: true });
  }
});

await client.login(config.token);
