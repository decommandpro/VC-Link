const { Client, SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("stop")
		.setDescription("Stops the Websocket and Leaves the Channel"),
	async execute(interaction) {
        getVoiceConnection(interaction.guild.id).destroy();
        Client.wss.close()
        interaction.reply("Closed the Websocket and Left the Channel")
	},
}