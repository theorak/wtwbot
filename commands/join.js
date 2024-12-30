const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const sql = require('../self-modules/sql.js');
const fs = require('fs');

let rawdata = fs.readFileSync('json-storage/factions.json');
let factions = JSON.parse(rawdata);

function getImg(interaction){
    let url;
    factions["factions"][interaction.options.get("faction").value].forEach(element => {
        if(interaction.options.get("leader").value == element.name){
            url = element.img;
        }
    })
    return url;
}

function uniq(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('You use this command to join a party.')
        .addStringOption(option =>
            option.setName('faction')
                .setDescription('Choose a faction.')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('leader')
                .setDescription('Choose a leader.')
                .setAutocomplete(true)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('partytag')
                .setDescription('Select a party-tag. If the tag doesn´t exist, the bot will create a Party for you.')
                .setAutocomplete(true)
                .setRequired(true)),
    
    async autocomplete(interaction, client, dbcon) {
        sql.innerWhereEx("*","players","parties","players.partyID","parties.partyid","players.discordid","!=",'"'+interaction.user.id+'"',dbcon,async (results) => {
            const focusedOption = interaction.options.getFocused(true);
            let choices = [];

            if (focusedOption.name === 'faction') {
                Object.keys(factions["factions"]).forEach(element => {
                    choices.push(element);
                })
            }

            if (focusedOption.name === 'leader') {
                let faction = interaction.options.get('faction')?.value;
                if(faction != undefined){
                    factions["factions"][faction].forEach(element => {
                        choices.push(element.name);
                    })
                }else{
                    choices.push("Please choose a faction first");
                }
            }

            if (focusedOption.name === 'partytag') {
                if(results[0]){
                    results.forEach(element => {
                        choices.push(element["tag"]);
                    })
                    choices = uniq(choices);
                }
            }

            const filtered = choices.filter(choice => choice.startsWith(focusedOption.value));
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
        });
    },

    async execute(interaction, client, dbcon) {
        sql.innerSelectWhere("leader,tag","players","parties","players.partyID","parties.partyid","discordid",interaction.user.id,dbcon,async (results) => {
            let exist = false;
            let leader;
            results.forEach((element) => {
                if(element["tag"] == interaction.options.get("partytag").value){
                    exist = true;
                    console.log("You´re currently playing in this party as "+element["leader"]);
                    leader = element["leader"];
                }
            });

            const exampleEmbed = new EmbedBuilder();

            exampleEmbed.setColor("#000000")
			    .setTimestamp();
            
            sql.where("partyid,tag","parties","tag",'"'+interaction.options.get("partytag").value+'"', dbcon, async (Partyresults) => {
                console.log(Partyresults[0]);
                if(Partyresults[0]){
                    console.log("Party Gefunden");
                    if(!exist){
                        sql.write("players (discordid,name,faction,leader,partyid)",'('+interaction.user.id+',"'+interaction.user.username+'","'+interaction.options.get("faction").value+'","'+interaction.options.get("leader").value+'",'+Partyresults[0]["partyid"]+')',dbcon);
                        
                        //Rolle vergeben
                        const member = interaction.guild.members.cache.get(interaction.user.id);
                        const roleToGive = interaction.guild.roles.cache.find(role => role.name === 'Party: '+interaction.options.get("partytag").value);
                        member.roles.add(roleToGive);

                        let img = getImg(interaction);
                        exampleEmbed.setTitle("Successfully joined the party!");
                        exampleEmbed.setThumbnail(img);
                        exampleEmbed.setDescription("You joined the party **"+Partyresults[0]["tag"]+"** as leader **"+interaction.options.get("leader").value+"**.");

                        interaction.reply({ embeds: [exampleEmbed]});
                    }else{
                        interaction.reply("You´re currently playing in this party as leader **"+leader+"**.");
                    }

                }else{
                    sql.write("parties (tag,owner)",'("'+interaction.options.get("partytag").value+'","'+interaction.user.id+'")',dbcon);

                    //Rolle erstellen
                    interaction.guild.roles.create({
                        data: {
                          name: `Party: ${interaction.options.get("partytag").value}`,
                          color: '992d22',
                          mentionable: "true"
                        }
                      }).then(async role => {
                         await role.edit({ name: `Party: ${interaction.options.get("partytag").value}`, color: "6f7582", mentionable: "true"});
                         await interaction.member.roles.add(role);
                    });

                    sql.where("partyid,tag","parties","tag",'"'+interaction.options.get("partytag").value+'"', dbcon, async (PartySelectResults) => {
                        if(!exist){
                            sql.write("players (discordid,name,faction,leader,partyid)",'('+interaction.user.id+',"'+interaction.user.username+'","'+interaction.options.get("faction").value+'","'+interaction.options.get("leader").value+'",'+PartySelectResults[0]["partyid"]+')',dbcon);
                            
                            let img = getImg(interaction);
                            exampleEmbed.setTitle("Successfully created the party!");
                            exampleEmbed.setThumbnail(img);
                            exampleEmbed.setDescription("You created the party **"+PartySelectResults[0]["tag"]+"** as leader **"+interaction.options.get("leader").value+"**.");

                            interaction.reply({ embeds: [exampleEmbed]});
                        }else{
                            interaction.reply("You´re currently playing this party as leader **"+leader+"**.");
                        }
                    });
                }
            });
        });
    }
}