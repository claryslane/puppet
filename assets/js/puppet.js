const errCmdNotFound = "ERROR: Command not found!";
const errSockNotFound = "ERROR: Sock need to be registered!";

const sockUrl = "wss://hack.chat/chat-ws";

function makeHelp(commands) {
    return {
        description: "Show this help",
        call: function () {
            var msg = "# Commands\n\n";

            for (var cmd in commands) {
                msg += ` - :${cmd}\t${commands[cmd].description}.\n`;
            }

            return msg;
        }
    }
}

function Socket(sockUrl, channel, nick) {
    var sock = new WebSocket(sockUrl);
    const cmd = {
        channel: channel,
        cmd: "join",
        nick: nick,
    }

    sock.addEventListener("open", () => sock.send(JSON.stringify(cmd)));

    return {
        sock: sock,
        callbacks: [],
        commands: {
            help: makeHelp({ help: { description: "Show this help message." } }),
        },
    };
}

function Puppet(name) {
    return {
        name: name,
        socks: {},

        command: function (sockName, cmd, params) {
            return {
                cmd: cmd,
                channel: sockName,
                ...params,
            }
        },

        send: function (sockName, cmd, data) {
            sock = this.socks[sockName].sock;
            if (!sock)
                throw errSockNotFound;

            if (data) {
                var cmd = this.command(sockName, cmd, data);
                if (sock && sock.readyState == sock.OPEN) {
                    sock.send(JSON.stringify(cmd));
                }
            }
        },

        chat: function (sockName, message) {
            this.send(sockName, "chat", {text: message});
        },

        addCmd: function (sockName, cmdName, call, desc) {
            this.socks[sockName].commands[cmdName] = {
                call: call,
                description: desc,
            };
            this.socks[sockName].commands.help = makeHelp(this.socks[sockName].commands);
        },

        addMsgListener: function (sockName, call) {
            var sock = this.socks[sockName];
            if (!sock) throw errSockNotFound;

            sock.callbacks.push(call);
        },

        addSocketConn: function (sockName, customMsgListener) {
            this.socks[sockName] = Socket(sockUrl, sockName, this.name);

            if (customMsgListener)
                this.addMsgListener(sockName, customMsgListener);
            else {
                this.addMsgListener(sockName, e => {
                    if (!e.chanName || !e.puppet)
                        throw errSockNotFound;

                    var sock = e.puppet.socks[e.chanName];
                    var res = JSON.parse(e.data);
                    if (res.cmd == "chat" && res.text[0] == ":") {
                        var servMsg = res.text.split(" ", 1);
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
                });
            }
        },

        listen: function () {
            for (var chanName in this.socks) {
                this.socks[chanName].sock.addEventListener("message", e => {
                    e.chanName = chanName;
                    e.puppet = this;

                    for (var call of this.socks[chanName].callbacks)
                        call(e);
                });
            }
        },
    };
}
