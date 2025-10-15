const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const sql = require('../self-modules/sql.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('upload')
		.setDescription('Party members')
        .addStringOption( option => {
            var options = option;
            options.setName('partytag');
            options.setDescription("Select a party-tag.");
            options.setAutocomplete(true);
            options.setRequired(true);
            return options;
        })
        .addAttachmentOption((option)=> option
            .setRequired(true)
            .setName("map")
            .setDescription("Upload the current map of game")
        ),

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
        sql.update("parties",'map="'+interaction.options.getAttachment('map').url+'"','parties.tag="'+interaction.options.get("partytag").value+'"',connection);
        interaction.reply("Updated Party "+interaction.options.get("partytag").value+".");
    }
}