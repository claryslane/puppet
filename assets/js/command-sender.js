function addCommandSender(channels, chanName, sender) {
    channels.addSocketConn(chanName, e => {
        if (!e.chanName || !e.puppet)
            throw errSockNotFound;

        var cmd = JSON.parse(e.data);

        console.log(cmd)
        if (cmd.text && cmd.channel != defaultChan) {
            var message = cmd.nick + "@" + e.chanName + ": " + cmd.text;
            channels.chat(defaultChan, message);
        }

        var sock = e.puppet.socks[e.chanName];
        if (cmd.cmd == "chat" && cmd.text[0] == ":" && cmd.nick == sender) {
            var servMsg = cmd.text.split(" ", 1);
            var servCmd = servMsg[0].substring(1).trim();
            var command = sock.commands[servCmd]

            if (!command) {
                channels.chat(e.chanName, errCmdNotFound);
                throw errCmdNotFound;
            }

            var params = servMsg[1] ?servMsg[1] :"";
            var msg = command.call(params.trim(), e);

            if (msg)
                channels.chat(e.chanName, msg);
        }
    });

    channels.addMsgListener(chanName, e => {
        var cmd = JSON.parse(e.data);
        console.log(e);
        if (cmd.text && cmd.channel != defaultChan && cmd.nick != channels.name) {
            channels.chat(defaultChan, JSON.stringify(cmd));
        }
    });
}
