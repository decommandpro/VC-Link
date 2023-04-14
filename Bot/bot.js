const fs = require("node:fs")
const path = require("node:path")
require("dotenv").config()
const discordjs = require("discord.js")
const { Client, Collection, Events, GatewayIntentBits, Intents } = discordjs

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates
	]
})





client.commands = new Collection()
const commandsPath = path.join(__dirname, "commands")
const commandFiles = fs.readdirSync("./commands/").filter(file => file.endsWith(".js"))

for(const file of commandFiles) {
    const filePath = path.join(commandsPath, file)
	const command = require(filePath)

	if ("data" in command && "execute" in command) {
		client.commands.set(command.data.name, command)
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
		continue
	}
	console.log("Loaded: "+ file)
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
	console.log("Loaded: "+ file)
}













client.login(process.env.BotToken)