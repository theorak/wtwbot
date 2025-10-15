const { SlashCommandBuilder } = require('@discordjs/builders');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('remove-party')
		.setDescription('Delete a Party')
        .addStringOption( option => {
            var options = option;
            options.setName('partytag');
            options.setDescription("Select a party-tag you want to remove.");
            options.setAutocomplete(true);
            options.setRequired(true);
            return options;
        }),

    async autocomplete(interaction, client, connection) {
        if(interaction.member.roles.cache.some(r => r.name === "Der oberste Adel")){
            sql.read("tag","parties",connection, async (resultsadm) => {
                const focusedOption = interaction.options.getFocused(true);
                let choices = [];
        
                if (focusedOption.name === 'partytag') {
                    if(resultsadm[0]){
                        await resultsadm.forEach((SingleParties) => {
                            choices.push(SingleParties["tag"]);
                        });
                    }
                }
        
                const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
                await interaction.respond(
                    filtered.map(choice => ({ name: choice, value: choice })),
                );
            })
        }else{
            sql.where("*","parties","owner",'"'+interaction.user.id+'"',connection,async (results) => {
                const focusedOption = interaction.options.getFocused(true);
                let choices = [];
        
                if (focusedOption.name === 'partytag') {
                    if(results[0]){
                        await results.forEach((SingleParties) => {
                            choices.push(SingleParties["tag"]);
                        });
                    }
                }
        
                const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
                await interaction.respond(
                    filtered.map(choice => ({ name: choice, value: choice })),
                );
            })
        }
    },

    async execute(interaction, client, connection) {
        sql.where("*","parties","tag",'"'+interaction.options.get("partytag").value+'"',connection,async (results) => {
            if(results[0]){
                if(results[0]["owner"] == interaction.user.id || interaction.user.roles.cache.some(role => role.id == "1020688378141884536")){
                    sql.delete("parties","tag",'"'+interaction.options.get("partytag").value+'"',connection);

                    let PartyRolle = interaction.guild.roles.cache.find(role => role.name.toLowerCase() === 'party: '+interaction.options.get("partytag").value.toLowerCase());
                    PartyRolle.delete(`Party ${interaction.options.get("partytag").value} has been closed.`);
                    
                    interaction.reply(`The party **${interaction.options.get("partytag").value}** and its associated role has been successfully removed.`);
                }else{
                    interaction.reply("You are neither the party's creator nor the admin. You are therefore not authorized to delete this party.");
                }
            }else{
                interaction.reply(`Party **${interaction.options.get("partytag").value}** does not exist and therefore cannot be deleted.`);
            }
        });
    }
}