const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mysql = require("mysql");
const { strictEqual } = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
let config = JSON.parse(fs.readFileSync('json-storage/config.json'));
let connection = null;

function createConnection() {
  connection = mysql.createConnection({
    host     : config.dbhostname,
    user     : config.dbusername,
    password : config.dbpassword,
    database : config.dbdatabase
  });

  connection.connect(err => {
      if (err) {
          console.error('Error connecting to MySQL:', err);
          setTimeout(createConnection, 5000); // Attempt to reconnect after 5 seconds
          return;
      }
      console.log('Connected to MySQL as ID:', connection.threadId);
  });

  // Handle errors on the connection
  connection.on('error', (err) => {
      console.error('MySQL Connection Error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
          console.log('Attempting to reconnect...');
          connection.destroy(); // Close the current connection
          setTimeout(createConnection, 5000); // Attempt to reconnect
      } else {
          throw err; // Re-throw other errors to crash the app if unrecoverable
      }
  });

  connection.on('close', () => {
      console.log('MySQL connection closed.');
      // Optionally attempt reconnect here as well, though 'error' event is more common
  });
}

function queryDatabase(sql, callback) {
  connection.query(sql, (err, results) => {
      if (err) {
          console.error('Error during query:', err); // query specific errors
          callback(err, null);
      } else {
          callback(null, results);
      }
  });
}

// Discord connection, as bot user
const client = new Client({
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.MessageContent,
  ]
})

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

// start DB connection
createConnection();

client.on('interactionCreate', async interaction => {    
    if (!interaction.isCommand()){
        if(interaction.isAutocomplete()){
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

	        try {
		        await command.autocomplete(interaction, client, connection);
	        } catch (error) {
		        await interaction.reply({ content: 'There was an error while autocompleting this command!', ephemeral: true });
	        }
        }
        return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

	try {
		await command.execute(interaction, client, connection);
	} catch (error) {
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('clientReady', async () => {
  queryDatabase("SHOW TABLES LIKE 'parties';", async function (err, result) {
    if (result.length == 0){
      console.log('"Parties"-Table dont exist. Creating...');
      queryDatabase("CREATE TABLE `parties` (`partyid` INT(11) NOT NULL AUTO_INCREMENT,`tag` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`owner` BIGINT(20) NOT NULL,PRIMARY KEY (`partyid`) USING BTREE)", function (err, result) {
        console.log("Parties-Table created!");
      });
    } else {
      console.log('"Parties"-table exist!');
    }
  })

  queryDatabase("SHOW TABLES LIKE 'players';", async function (err, result) {
    if (result.length == 0){
      console.log('"Players"-Table dont exist. Creating...');
      queryDatabase("CREATE TABLE `players` (`id` INT(11) NOT NULL AUTO_INCREMENT,`discordid` BIGINT(20) NULL DEFAULT NULL,`name` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`faction` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`leader` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`partyID` INT(11) NULL DEFAULT '0',PRIMARY KEY (`id`) USING BTREE,INDEX `FK_players_parties` (`partyID`) USING BTREE,CONSTRAINT `FK_players_parties` FOREIGN KEY (`partyID`) REFERENCES `"+config.dbdatabase+"`.`parties` (`partyid`) ON UPDATE NO ACTION ON DELETE CASCADE)", function (err, result) {
        console.log("Players-Table created");
      });
    } else {
      console.log('"Players"-table exist!');
    }
  })
  console.log("Bot online!");
});

client.login(config.token);