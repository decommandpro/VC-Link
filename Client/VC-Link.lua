local args = { ... }
os.loadAPI("json")
local speaker = peripheral.find("speaker")
if not speaker then error("Unable to Find Speaker") end

local function socket()
    local i = 0
    while true do
        repeat
            i = i + 1

            local msg = ws.receive()
            if not msg then break end
            msg = json.decode(msg)
            for j, v in pairs(msg) do
                msg[j] = math.max(math.min(v, 127), -128)
            end
            buffer[i] = msg
        until true
    end
end

local function speakerLoop()
    local i = 0
    while true do
        i = i + 1
        repeat sleep() until buffer[i]
        while not speaker.playAudio(buffer[i], 30) do
            os.pullEvent("speaker_audio_empty")
        end
    end
end




print("Activating VCLink, Attempting to Connect")
ws, err = http.websocket(args[1])
if not ws then error(err) end

print("Connected to Websocket, Ready and Listening!")


buffer = {}

parallel.waitForAny(socket, speakerLoop)
