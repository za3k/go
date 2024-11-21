function sleep(ms) {
    return new Promise(function(resolve) {
        setTimeout(resolve, ms)
    })
}

class PubSubRoom {
    constructor(name) {
        this.name = name
        this.listener = null
        this.url = `wss://ws.za3k.com/${name}`
    }

    connect() {
        return new Promise((resolve) => {
            //console.log("Room.connect", this.url)
            this.ws = new WebSocket(this.url)
            this.ws.addEventListener("open", () => {
                //console.log("Room.connected", this.url)
                resolve()
            })
            this.ws.addEventListener("message", (msg) => {
                //console.log("Room.receiveText", msg.data)
                this.receive(JSON.parse(msg.data))
            })
        })
    }

    send(json) {
        //this.receive(json)
        //console.log("Room.sendJson", json)
        this.ws.send(JSON.stringify(json))
    }

    listen(f) {
        this.listener = f
    }

    receive(json) {
        //console.log("Room.receiveJson", json)
        if (this.listener) this.listener(json)
    }
}

class Multiplayer {
    constructor(prefix) {
        this.callbacks = {}
        this.prefix = prefix || 'generic'
        this.knownPlayers = {}
    }

    // Generic pub/sub

    error(msg) {
        this.trigger('error', msg)
        console.error(msg)
    }

    proxy(o) {
        this.o = o
    }

    on(eventName, callback) {
        this.callbacks[eventName] ||= []
        this.callbacks[eventName].push(callback)
    }

    trigger(eventName, ...args) {
        for (var callback of (this.callbacks[eventName] || []))
            callback(...args)
        if (this.o && this.o[eventName])
            this.o[eventName](...args)
    }

    registerBroadcastMethods(names) { 
        for (var name of names) this.registerBroadcastMethod(name)
    }

    registerBroadcastMethod(name) {
        this[name] = function() {
            this.player = this.me
            this.broadcast(name, ...arguments) // Send your moves
            this.trigger(name, ...arguments) // Do your moves
        }
        this.onBroadcast(name, (json) => {
            this.player = json.player
            this.trigger(name, ...json.args) // Do other players' moves
        })
    }

    // Broadcast stuff
    connect(roomName) {
        this.room = new PubSubRoom(roomName)
        this.room.listen(this.receive.bind(this))

        this.onBroadcast("ask-options", () => { 
            if (typeof(this.options) != "undefined")
                this.broadcast("options", this.options)
        })
        this.onBroadcast("ask-player", () => { 
            if (typeof(this.me) != "undefined")
                this.broadcast("announce-player", this.me) 
        })
        this.onBroadcast("announce-player", (json) => { 
            const player = json.args[0]
            this.knownPlayers[player] = true
        })

        return this.room.connect()
    }

    broadcast(name, ...args) {
        this.room.send({name, args, player: this.me})
    }

    onBroadcast(name, callback) {
        this.on(`broadcast-${name}`, callback)
    }

    receive(json) {
        //console.log("Multiplayer.receive", json.name, json)
        this.trigger("broadcast", json.name, json)
        this.trigger(`broadcast-${json.name}`, json)
    }

    getOptions() {
        return new Promise((resolve) => {
            this.onBroadcast("options", (json) => { 
                resolve(json.args[0]) 
            })
            this.broadcast("ask-options")
        })
    }

    async getFreePlayer() {
        this.broadcast("ask-player")
        // Wait 2 seconds, then grab the lowest unknown ID
        await sleep(500)
        for (var i=0; i<100; i++)
            if (!this.knownPlayers[i]) return i
                return i
    }

    // Multiplayer logic
    isExistingGame() {
        return !!window.location.hash
    }

    setUrl(roomName) {
        window.location.hash = roomName
    }

    roomName() {
        if (!!window.location.hash)
            return window.location.hash.slice(1)
        else
            return `${this.prefix}-${crypto.randomUUID()}`
    }

    async create(options, player) {
        if (typeof(player) == 'undefined') player = 0
        this.setUrl(this.roomName())
        await this.connect(this.roomName())
        this.init(options, player)
    }

    async connectExisting() {
        await this.connect(this.roomName())
        const options = await this.getOptions()
        const freePlayer = await this.getFreePlayer()
        //console.log("connectExisting", options, freePlayer, this.knownPlayers)
        this.init(options, freePlayer)
    }

    init(options, player) {
        this.options = options
        this.me = player
        this.knownPlayers[this.me] = true
        this.trigger('init', options, player)
    }
}

