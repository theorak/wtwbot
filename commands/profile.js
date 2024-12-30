const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('All parties you´re in'),

    async execute(interaction, client, dbcon) {
        sql.innerSelectWhere("*","players","parties","players.partyID","parties.partyid","players.discordid",'"'+interaction.user.id+'"',dbcon,async (results) => {
            if(results[0]){
                const exampleEmbed = new EmbedBuilder();
                exampleEmbed.setColor("#000000")
			        .setTimestamp()
                    .setTitle("All of your parties")
                    .setDescription("Following are all of your parties.");

                results.forEach((member) => {
                    var emoji = client.emojis.cache.find(emoji => emoji.name === member.faction.replaceAll(" ","").replaceAll("’",""));
                    console.log(member.faction.replaceAll(" ","").replaceAll("’",""));

                    if(emoji == undefined){
                        exampleEmbed.addFields({ name: member.tag, value: `${member.faction}\n${member.leader}`, inline: true});
                    }else{
                        exampleEmbed.addFields({ name: member.tag, value: `${member.faction}\n${member.leader} ${emoji}`, inline: true});
                    }
                });
                interaction.reply({ embeds: [exampleEmbed]});
            }else{
                interaction.reply("You haven't joined a party yet!");
            }
        });
    }
}