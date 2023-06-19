const { Client, SlashCommandBuilder } = require("discord.js");
const WebSocket = require("ws")
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, EndBehaviorType, entersState, VoiceReceiver, VoiceConnectionStatus } = require("@discordjs/voice");
const { OpusEncoder } = require("@discordjs/opus");




function pcmBuffersTo8Bit(input) {
    const OUT = []
    input.forEach((v) => {
        const output = new Int8Array(v.length);

        for (let i = 0; i < v.length; i++) {
            let sample = v[i];
            if (sample & 0x8000) {
                sample = -(0x10000 - sample);
            }

            const clampedSample = Math.max(-128, Math.min(127, sample >> 8));

            output[i] = clampedSample;
        }

        const vBuffer = v
        const outputBuffer = Buffer.alloc(vBuffer.length / 2);

        for (let i = 0, j = 0; i < vBuffer.length; i += 2, j++) {
            const value = vBuffer.readInt16LE(i);
            const clampedValue = Math.max(-128, Math.min(127, Math.round(value / 256)));
            outputBuffer.writeInt8(clampedValue, j);
        }

        OUT.push(outputBuffer)
    })
    return OUT
}



function buffersToMonoArray(buffers) {
    let OUT = []
    buffers.forEach((v) => {
        const outputBuffer = v
        const outputArray = [];

        for (let i = 0; i < outputBuffer.length; i++) {
            const value = outputBuffer.readInt8(i);
            outputArray.push(value);
        }
        OUT = OUT.concat(outputArray)
    })

    let OUT2 = []
    for (let i = 0, j = 0; i < OUT.length; i += 2, j += 1) {
        const left = OUT[i]
        const right = OUT[i + 2]
        const mono = Math.round((left + right) / 2)
        OUT2[j] = mono
    }

    return OUT2


}



function createListeningStream(receiver, userId, wss) {
    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: 2,
            duration: 1000,
        },
    });


    let chunks = []
    const empty = "[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,null]"
    const encoder = new OpusEncoder(48000, 2);
    opusStream.on("readable", () => {
        let chunk;

        while (null !== (chunk = opusStream.read())) {

            const pcmBuffer = encoder.decode(chunk);
            const buffer = pcmBuffersTo8Bit([pcmBuffer])[0];
            const monoArray = buffersToMonoArray([buffer]);
            const chunkSize = 3000;

            const string = JSON.stringify(monoArray)
            if (string !== empty) {
                wss.broadcast(string);
            }
        }
    })
}















module.exports = {
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Starts Discord-CC VC Relay"),
    async execute(interaction) {
        await interaction.deferReply()
        interaction.followUp("Starting WebSocket Server")

        Client.wss = new WebSocket.WebSocketServer({
            port: 8082
        })

        Client.wss.on("connection", async (ws) => {
            interaction.channel.send("New Connection To Websocket Server")
        })

        Client.wss.broadcast = (msg) => {
            Client.wss.clients.forEach((client) => {
                client.send(msg)
            })
        }

        interaction.channel.send("WebSocket Server Started, Joining Voice Channel")

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false
        })

        await entersState(connection, VoiceConnectionStatus.Ready, 20e3)

        interaction.channel.send("Joined Voice Channel, Ready And Listening!")

        connection.receiver.speaking.on("start", (userId) => {
            if (userId != interaction.member.id) { return }
            createListeningStream(connection.receiver, userId, Client.wss)
        })
    }
}