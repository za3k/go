const boards = {
    19: [
        "┌┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┐",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼.┼┼┼┼┼.┼┼┼┼┼.┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼.┼┼┼┼┼.┼┼┼┼┼.┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼.┼┼┼┼┼.┼┼┼┼┼.┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┼┤",
        "└┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┴┘",
    ],
    13: [
        "┌┬┬┬┬┬┬┬┬┬┬┬┐",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼.┼┼┼┼┼.┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼.┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼.┼┼┼┼┼.┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┼┼┼┼┤",
        "└┴┴┴┴┴┴┴┴┴┴┴┘",
    ],
    9: [
        "┌┬┬┬┬┬┬┬┐",
        "├┼┼┼┼┼┼┼┤",
        "├┼.┼┼┼.┼┤",
        "├┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┤",
        "├┼┼┼┼┼┼┼┤",
        "├┼.┼┼┼.┼┤",
        "├┼┼┼┼┼┼┼┤",
        "└┴┴┴┴┴┴┴┘",
    ],
}

// TODO: Do with sizing instead
var spritesPromise
const spriteNames = ["┌","┬","┐","├","┼","┤","└","┴","┘",".","white","whiteRecent","whiteDead","blackPoint","whitePoint","black","blackRecent","blackDead"]
    
function randInt(min, max) { return Math.floor(Math.random()*(max-min)) + min }

class Game {
    constructor(options, me, history) {
        this.online = options.online
        this.replay = options.replay
        this.me = me

        this.engine = new Engine(options)
        this.volume = options.volume
        $(".player-label span:eq(0)").text(options.blackName)
        $(".player-label span:eq(1)").text(options.whiteName)
        for (var h of (history||[])) this.replayHistory(h)

        this.ready = this.makeBoard()
        this.ready.then(() => { this.updateUI() })

        $(".action.resign").on("click", () => { 
            game.resign()
        })
        $(".action.pass").on("click", () => {
            game.pass()
        })
        $(".action.finish-scoring").on("click", () => {
            if (this.online)
                game.finishScoring(this.me)
            else {
                game.finishScoring(0)
                game.finishScoring(1)
            }
        })
        if (this.online) {
            $(".action.share-link").show().on("click", (e) => {
                e.preventDefault()
                navigator.clipboard.writeText(window.location.href)
            })
        }

    }

    get player() { return this.engine.player }
    get size() { return this.engine.size }

    async makeBoard() {
        const maxRes = Math.min(window.innerWidth, window.innerHeight) / this.size
        const availableSizes = [15, 30, 45, 60]
        var res = availableSizes[0]
        for (var avail of availableSizes)
            if (maxRes > avail) res = avail

        this.sprites = await Sprites.loadAll(`sprites${res}.png`, res, spriteNames)

        const board = boards[this.size]
        board.forEach((row, rowNum) => {
            const r = $(`<div></div>`)
            $("#board").append(r)
            Array.from(row).forEach((symbol, colNum) => {
                r.append(this.sprites[symbol].make())
            })
        })
    }

    close() {
        $("#board").empty()
        $("#win").hide()
        $("#score").text("")
    }

    replayHistory(e) {
        if (this.engine[e.name])
            this.engine[e.name](...e.args)
    }

    setSprite(pos, name) {
        const tile = $(`#board > :eq(${pos.y}) > :eq(${pos.x})`)
        tile.empty()
        if (name) tile.append(this.sprites[name].make())
    }

    addPreview(pos, name, callback) {
        if (!name) return
        const tile = $(`#board > :eq(${pos.y}) > :eq(${pos.x})`)
        const sprite = this.sprites[name].make()
        $(sprite).addClass("possible-move").appendTo(tile).on("click", callback)
    }

    playClack() {
        const i = randInt(1, 5) // 1-4
        this.playSound(`clack${i}`)
    }

    playSound(name) {
        const audio = new Audio(`audio/${name}.mp3`)
        if (this.volume) audio.volume = this.volume
        audio.play().catch(x => x)
    }

    eachPos(f) {
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                f({x, y})
            }
        }
    }
    
    score() {
        if (this.engine.resigned) {
            return `${"BW"[this.engine.victor]}+R`
        }

        const score = this.engine.score
        return `${"BW"[0+(score <= 0)]}+${Math.abs(score)}`
    }

    move() {
        this.engine.move(...arguments)
        this.playClack()
        this.updateUI()
    }
    toggleDead(pos) {
        this.engine.toggleDead(...arguments)
        this.updateUI()
    }
    finishScoring() {
        this.engine.finishScoring(...arguments)
        this.updateUI()
    }
    resign() {
        this.engine.resign(...arguments)
        this.updateUI() 
    }
    pass() {
        this.engine.pass(...arguments)
        this.updateUI()
    }

    overrideWin(victor, score) {
        this.victorOverride = victor
        this.scoreOverride = score
        this.updateUI()
    }

    updateUI() {
        const playerSprites = [this.sprites["black"], this.sprites["white"]]
        if (this.victorOverride || this.engine.done && typeof(this.engine.victor) != 'undefined') {
            // Game is over
            const victor = this.victorOverride || this.engine.victor
            const score = this.scoreOverride || this.score()
            const sprite = this.sprites[["black", "white"][victor]]
            $("#win").show().text(`${["Black", "White"][victor]} wins`).prepend(sprite.make()).append(sprite.make())
            $("#win, #turn-info").show().text(`${["Black", "White"][victor]} wins`).prepend(sprite.make()).append(sprite.make())
            $(".my-turn").css("visibility", "hidden")
            $(".finish-scoring").hide()
            $("#score").show().text(`Final score: ${score}`)
            $(".possible-move").remove()
        } else if (this.engine.done && typeof(this.engine.victor) == 'undefined') {
            // Scoring phase
            $("#turn-info").text(`Scoring`).prepend(playerSprites[0].make()).append(playerSprites[1].make())
            $(".my-turn").hide()
            $(".finish-scoring").show()
            $("#score").show().text(this.score())
            $(".possible-move").remove()

            $(".sprite .sprite").remove()
            this.eachPos((pos) => {
                const sprite = this.engine.getScored(pos)
                this.setSprite(pos, sprite)

                if (sprite) {
                    const toggleSprite = {
                        "white": "whiteDead",
                        "black": "blackDead",
                        "whiteDead": "white",
                        "blackDead": "black",
                    }[sprite]

                    this.addPreview(pos, toggleSprite, () => {
                        game.toggleDead(pos)
                    })
                }
            })
        } else {
            // Regular play
            const myTurn = (!this.replay && !this.online) || (this.online && this.me == this.player)
            const color = ["black", "white"][this.player]

            $("#turn-info").text(`${["Black", "White"][this.player]}'s turn`)
            if (this.online && this.player == this.me) $("#turn-info").append(" (You)")
            const sprite = playerSprites[this.player]
            $("#turn-info").prepend(playerSprites[this.player].make()).append(playerSprites[this.player].make())

            $(".my-turn").css("visibility", myTurn ? "" : "hidden")

            $(".sprite .sprite").remove()
            this.eachPos((pos) => {
                const sprite = this.engine.get(pos)
                this.setSprite(pos, sprite)

                if (myTurn && this.engine.canMove(pos)) {
                    this.addPreview(pos, color, () => {
                        game.move(pos)
                    })
                }
            })

            if (this.engine.lastMove) {
                const sprite = ["whiteRecent", "blackRecent"][this.player]
                this.setSprite(this.engine.lastMove, sprite)
            }
        }
    }
}
