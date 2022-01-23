function Socket(sockUrl, channel, nick) {
    var sock = new WebSocket(sockUrl);
    return {
        sock: sock,
        callbacks: [],
        commands: {
            ":help": {
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
            if (sockName && this.socks[sockName])
                sock = this.socks[sockName].sock;

            else throw "Sock need to be registered!";

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

        addEventListener: function (sockName, call) {
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
                var res = JSON.parse(e.data);
                if (res.cmd == "chat" && res.text[0] == ":") {
                    var servMsg = res.text.split(" ", 1);
                    var servCmd = servMsg[0].trim();

                    var msg = this.socks[sockName].commands[servCmd].call(servMsg[1]);

                    if (msg)
                        this.chat(sockName, msg);
                }
            });
        }
    };
}
