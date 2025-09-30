const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mysql = require("mysql");
const { strictEqual } = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
let config = JSON.parse(fs.readFileSync('json-storage/config.json'));

var dbcon  = mysql.createConnection({
	host     : config.dbhostname,
	user     : config.dbusername,
	password : config.dbpassword,
	database : config.dbdatabase
  });
  
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

async function ErrorHandling(error){
  let user = await client.users.fetch(config.discordlogprofile);
  user.send("**Warhammer Bot**\nAn Error occurred!\n\n"+error+"\n\nRestarting...");
}

client.on('interactionCreate', async interaction => {
    
    if (!interaction.isCommand()){
        if(interaction.isAutocomplete()){
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

	        try {
		        await command.autocomplete(interaction, client, dbcon);
	        } catch (error) {
		        console.error(error);
            ErrorHandling(error);
		        await interaction.reply({ content: 'There was an error while autocompleting this command!', ephemeral: true });
	        }
        }
        return;
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

	try {
		await command.execute(interaction, client, dbcon);
	} catch (error) {
		console.error(error);
    ErrorHandling(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on('ready', () => {  
  dbcon.connect(async function(err) {
    if (err) throw ErrorHandling(err);
    
    await dbcon.query("SHOW TABLES LIKE 'parties';", async function (err, result) {
      if(err) ErrorHandling(err);

      if(result.length == 0){
        console.log('"Parties"-Table dont exist. Creating...');
        await dbcon.query("CREATE TABLE `parties` (`partyid` INT(11) NOT NULL AUTO_INCREMENT,`tag` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`owner` BIGINT(20) NOT NULL,PRIMARY KEY (`partyid`) USING BTREE)", function (err, result) {
          if (err) ErrorHandling(err);
          console.log("Parties-Table created!");
        });
      }else{
        console.log('"Parties"-table exist!');
      }
    })

    await dbcon.query("SHOW TABLES LIKE 'players';", async function (err, result) {
      if(err) ErrorHandling(err);
      
      if(result.length == 0){
        console.log('"Players"-Table dont exist. Creating...');
        await dbcon.query("CREATE TABLE `players` (`id` INT(11) NOT NULL AUTO_INCREMENT,`discordid` BIGINT(20) NULL DEFAULT NULL,`name` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`faction` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`leader` TEXT NOT NULL COLLATE 'utf8mb4_general_ci',`partyID` INT(11) NULL DEFAULT '0',PRIMARY KEY (`id`) USING BTREE,INDEX `FK_players_parties` (`partyID`) USING BTREE,CONSTRAINT `FK_players_parties` FOREIGN KEY (`partyID`) REFERENCES `"+config.dbdatabase+"`.`parties` (`partyid`) ON UPDATE NO ACTION ON DELETE CASCADE)", function (err, result) {
          if (err) ErrorHandling(err);
          console.log("Players-Table created");
        });
      }else{
        console.log('"Players"-table exist!');
      }
    })

    console.log("Database connected!");
    console.log("Bot online!");
  });
});

client.login(config.token);
