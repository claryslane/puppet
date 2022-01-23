const errCmdNotFound = "ERROR: Command not found!";
const errSockNotFound = "ERROR: Sock need to be registered!";

function Socket(sockUrl, channel, nick) {
    var sock = new WebSocket(sockUrl);
    return {
        sock: sock,
        callbacks: [],
        commands: {
            help: {
                description: "Show this help",
                call: function () {
                    var msg = "# Commands\n\n";

                    for (var cmd in this.commands) {
                        msg += ` - :${cmd}\t${this.commands[cmd]}.\n`;
                    }

                    return msg;
                }
            },
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

        addMsgListener: function (sockName, call) {
            this.socks[sockName].callbacks.push(call);
            this.socks[sockName].sock.addEventListener('message', function (e) {
                for (var call of this.socks[sockName].callbacks)
                    call(e);
            });
        },

        addSocketConn: function (sockName, sockUrl) {
            this.socks[sockName] = Socket(sockUrl, sockName, this.name);
            this.send(sockName, "join", {nick: this.name});
            this.addEventListener(sockName, e => {
                var sock = this.socks[sockName];
                if (!sock)
                    throw errSockNotFound;

                var res = JSON.parse(e.data);
                if (res.cmd == "chat" && res.text[0] == ":") {
                    var servMsg = res.text.split(" ", 1);
                    var servCmd = servMsg[0].substring(1).trim();
                    var command = sock.commands[servCmd]

                    if (!command) {
                        this.chat(sockName, errCmdNotFound);
                        throw errCmdNotFound;
                    }

                    var msg = command.call(servMsg[1]);

                    if (msg)
                        this.chat(sockName, msg);
                }
            });
        }
    };
}
