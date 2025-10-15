const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('parties')
		.setDescription('List all parties'),

    async execute(interaction, client, connection) {
        await sql.custom("SELECT parties.tag, count(players.partyID) as AllPlayers from players left join parties on (players.partyID = parties.partyid) group by players.partyID",connection,async (results) => {
            const exampleEmbed = new EmbedBuilder();
            exampleEmbed.setColor("#000000")
			    .setTimestamp()
                .setTitle("All saved parties")
                .setDescription("Following are all parties.");

            results.forEach((SingleParties) => {
                exampleEmbed.addFields({ name: SingleParties.tag, value: `${SingleParties.AllPlayers} Players`, inline: true });
            });
            interaction.reply({ embeds: [exampleEmbed]});
        });
    }
}