const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('party')
		.setDescription('Party members')
        .addStringOption( option => {
            var options = option;
            options.setName('partytag');
            options.setDescription("Select a party-tag.");
            options.setAutocomplete(true);
            options.setRequired(true);
            return options;
        }),

    async autocomplete(interaction, client, dbcon) {
        sql.read("tag","parties",dbcon, async (partytags) =>{
            const focusedOption = interaction.options.getFocused(true);
            let choices = [];
    
            if (focusedOption.name === 'partytag') {
                if(partytags[0]){
                    await partytags.forEach((SingleParties) => {
                        choices.push(SingleParties["tag"]);
                    });
                }
            }
    
            const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
        })
    },

    async execute(interaction, client, dbcon) {
        sql.innerSelectWhere("*","players","parties","players.partyID","parties.partyid","parties.tag",'"'+interaction.options.get("partytag").value+'"',dbcon,async (results) => {
            const exampleEmbed = new EmbedBuilder();
            exampleEmbed.setColor("#000000")
			    .setTimestamp()
                .setTitle(interaction.options.get("partytag").value)
                .setDescription("Following are all members of the party **"+interaction.options.get("partytag").value+"**.");

            results.forEach((member) => {
                console.log("EMOJI: "+member.faction.replaceAll(" ","").replaceAll("’",""));
                var emoji = client.emojis.cache.find(emoji => emoji.name === member.faction.replaceAll(" ","").replaceAll("’",""));

                if(emoji == undefined){
                    exampleEmbed.addFields({ name: member.name, value: `${member.faction}\n${member.leader}`, inline: true });
                }else{
                    exampleEmbed.addFields({ name: member.name, value: `${member.faction} ${emoji}\n${member.leader}`, inline: true });
                }
            });

            if(results[0].map){
                exampleEmbed.setImage(results[0].map);
            }

            interaction.reply({ embeds: [exampleEmbed]});
        });
    }
}