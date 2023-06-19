local args = { ... }
local buffer = {}
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
    local i = 1
    while true do
        local sound = {}
        repeat sleep() until buffer[i]
        sleep(0.2)
        
        for j=0, #buffer-i do
            for k, v in pairs(buffer[i+j]) do
                table.insert(sound, v)
            end
        end
        while not speaker.playAudio(sound, 3000) do
            os.pullEvent("speaker_audio_empty")
        end
        i = #buffer
    end
end




print("Activating VCLink, Attempting to Connect")
ws, err = http.websocket(args[1])
if not ws then error(err) end

print("Connected to Websocket, Ready and Listening!")


parallel.waitForAny(socket, speakerLoop)
