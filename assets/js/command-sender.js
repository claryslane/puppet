var chanName = getParam("session");
var sender = getParam("sender");

function addCommandSender(channels, chanName, sender) {
    channels.addSocketConn(chanName, e => {
        if (!e.chanName || !e.puppet)
            throw errSockNotFound;

        var cmd = JSON.parse(e.data);
        if (cmd.text && cmd.channel != defaultChan && cmd.nick == sender) {
            var message = cmd.nick + "@" + e.chanName + ": " + cmd.text;
            channels.chat(defaultChan, message);

            var sock = e.puppet.socks[e.chanName];
            if (cmd.cmd == "chat" && cmd.text[0] == ":") {
                var servMsg = cmd.text.split(" ", 1);
                var servCmd = servMsg[0].substring(1).trim();
                var command = sock.commands[servCmd]

                if (!command) {
                    this.chat(sockName, errCmdNotFound);
                    throw errCmdNotFound;
                }

                var msg = command.call(servMsg[1].trim(), e);

                if (msg)
                    this.chat(sockName, msg);
            }
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
