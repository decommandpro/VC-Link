function merge(ab, a, b)
  table.foreach(a, function(k, v) table.insert(ab, v) end)
  table.foreach(b, function(k, v) table.insert(ab, v) end)
end

function socket()
  local i = 0
  while true do
    repeat

    i=i+1

    local msg = ws.receive()
    if not msg then break end
    msg = json.decode(msg)
    buffer[i] = msg

    until true
  end
end

function speakerLoop()
  local i = 0
  while true do
    i=i+1
    repeat sleep() until buffer[i]
    while not speaker.playAudio(buffer[i], 3000) do
      os.pullEvent("speaker_audio_empty")
    end
  end
end


os.loadAPI("json")
speaker = peripheral.find("speaker")
if not speaker then error("Unable to Find Speaker") end

print("Activating VCLink, Attempting to Connect")
ws, err = http.websocket("ws://decommandpro.dragon-bicolor.ts.net:8082")--ws://7.tcp.eu.ngrok.io:13553")
if not ws then error(err) end

print("Connected to Websocket, Ready and Listening!")


buffer = {}

parallel.waitForAny(socket, speakerLoop)