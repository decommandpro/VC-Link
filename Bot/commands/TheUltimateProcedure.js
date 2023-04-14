const { SlashCommandBuilder } = require("discord.js");
const WebSocket = require("ws")
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior, EndBehaviorType, entersState, VoiceReceiver, VoiceConnectionStatus } = require("@discordjs/voice");
const fs = require("fs")
const prism = require("prism-media")
const { OpusEncoder } = require("@discordjs/opus");








function pcmBufferTo8Bit(input) {
    const output = new Int8Array(input.length);

    for (let i = 0; i < input.length; i++) {
        let sample = input[i];
        if (sample & 0x8000) {
            sample = -(0x10000 - sample);
        }

        const clampedSample = Math.max(-128, Math.min(127, sample >> 8));

        output[i] = clampedSample;
    }

    const inputBuffer = input
    const outputBuffer = Buffer.alloc(inputBuffer.length / 2);

    for (let i = 0, j = 0; i < inputBuffer.length; i += 2, j++) {
        const value = inputBuffer.readInt16LE(i);
        const clampedValue = Math.max(-128, Math.min(127, Math.round(value / 256)));
        outputBuffer.writeInt8(clampedValue, j);
    }

    return outputBuffer
}



function decodeToPCM(chunks) {
    const encoder = new OpusEncoder(48000, 2)

    let decodedChunks = []
    chunks.forEach((v) => {
        //console.log("OLD")
        //console.log(v)
        //console.log(encoder.decode(v))
        //console.log(pcmBufferTo8Bit(encoder.decode(v)))
        decodedChunks.push(pcmBufferTo8Bit(encoder.decode(v)))
    })
    let OUT = []
    decodedChunks.forEach((v) => {
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


    //fs.writeFile("test.txt", JSON.stringify(OUT2), function (err) { if (err) { console.error(err) } })


    //console.log(OUT2)
    return OUT2


}





function decodeChunkToPCM(chunk) {
    const encoder = new OpusEncoder(48000, 2)

    let decodedChunk = pcmBufferTo8Bit(encoder.decode(chunk))

    console.log("NEW")
    console.log(chunk)
    console.log(encoder.decode(chunk))
    //console.log(decodedChunk)
    //console.log("DECODEDCHUNK")
    //console.log(decodedChunk)

    let OUT
    const outputBuffer = decodedChunk
    const outputArray = [];

    for (let i = 0; i < outputBuffer.length; i++) {
        const value = outputBuffer.readInt8(i);
        outputArray.push(value);
    }
    OUT = outputArray
    //console.log(OUT)
    let OUT2
    for (let i = 0, j = 0; i < OUT.length; i += 2, j += 1) {
        const left = OUT[i]
        const right = OUT[i + 2]
        const mono = Math.round((left + right) / 2)
        OUT2 = mono
    }

    //console.log(OUT2)
    return OUT2

    //fs.writeFile("test.txt", JSON.stringify(OUT2), function (err) { if (err) { console.error(err) } })
}







function createListeningStream(receiver, userId, wss) {
    const opusStream = receiver.subscribe(userId, {
        end: {
            behavior: 2,
            duration: 1000,
        },
    });

    const oggStream = new prism.opus.OggLogicalBitstream({
        opusHead: new prism.opus.OpusHead({
            channelCount: 2,
            sampleRate: 48000,
        }),
        pageSizeControl: {
            maxPackets: 10,
        },
        crc: false
    });

    let chunks = []
    opusStream.on("readable", () => {
        let chunk

        /*const interval = setInterval(() => {
            const PCM = decodeToPCM(chunks)
            //wss.broadcast(PCM)
            console.log(PCM)
        }, 2000);*/

        while (null !== (chunk = opusStream.read())) {
            chunks.push(chunk)
            //console.log(chunk)
            //const PCMChunk = decodeChunkToPCM(chunk)

            //console.log(PCMChunk)
        }
        //console.log(chunks)
        //console.log(decodeToPCM(chunks))

    })

    let msg
    opusStream.on("end", () => {
        msg = decodeToPCM(chunks)

        const chunkSize = 3000;
        for (let i = 0; i < msg.length; i += chunkSize) {
            const chunk = msg.slice(i, i + chunkSize);
            wss.broadcast(JSON.stringify(chunk))
        }
    })
}















module.exports = {
    data: new SlashCommandBuilder()
        .setName("theultimateprocedure")
        .setDescription("Starts Discord-CC VC Relay"),
    async execute(interaction) {
        await interaction.deferReply()
        interaction.followUp("Starting WebSocket Server")

        const wss = new WebSocket.WebSocketServer({
            port: 8082
        })

        wss.on("connection", async (ws) => {
            interaction.followUp("New Connection To Websocket Server")
        })

        wss.broadcast = (msg) => {
            wss.clients.forEach((client) => {
                client.send(msg)
            })
        }

        interaction.followUp("WebSocket Server Started, Joining Voice Channel")

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false
        })

        await entersState(connection, VoiceConnectionStatus.Ready, 20e3)

        interaction.followUp("Joined Voice Channel, Ready And Listening!")

        connection.receiver.speaking.on("start", (userId) => {
            if (userId != interaction.member.id) { return }
            createListeningStream(connection.receiver, userId, wss)
        })
    }
}