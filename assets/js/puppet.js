function Socket(sockUrl, channel, nick) {
    var sock = new WebSocket(sockUrl);
    return {
        sock: sock,
        callbacks: [],
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

        chat: function (sockName, data) {
            this.send(sockName, "chat", data);
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
            this.send(sockName, "join", {nick: this.name})
        }
    };
}
