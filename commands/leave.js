const { SlashCommandBuilder } = require('@discordjs/builders');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Leave a party')
        .addStringOption( option => {
            var options = option;
            options.setName('partytag');
            options.setDescription("Select a party-tag you want to leave.");
            options.setAutocomplete(true);
            options.setRequired(true);
            return options;
        }),

    async autocomplete(interaction, client, dbcon) {
        sql.innerSelectWhere("tag","players","parties","players.partyID","parties.partyid","discordid",interaction.user.id,dbcon,async (results) => {
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
    },

    async execute(interaction, client, dbcon) {
        const member = interaction.guild.members.cache.get(interaction.user.id);
        const roleToRemove = interaction.guild.roles.cache.find(role => role.name === 'Party: '+interaction.options.get("partytag").value);
        member.roles.remove(roleToRemove);

        sql.customNB(`DELETE players FROM players INNER JOIN parties ON players.partyID=parties.partyid WHERE players.discordid='${interaction.user.id}' AND parties.tag='${interaction.options.get("partytag").value}'`,dbcon);

        interaction.reply(`You left the party ${interaction.options.get("partytag").value}`);
    }
}
