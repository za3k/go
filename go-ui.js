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
    constructor(options) {
        this.online = options.online
        if (typeof(options.player) === undefined) this.me = randInt(0, 2)
        else                                      this.me = options.player

        this.engine = new Engine(options)

        this.makeBoard().then(() => { this.updateUI() })

        $(".action.resign").on("click", () => { 
            this.engine.resign()
            this.updateUI() 
        })
        $(".action.pass").on("click", () => {
            this.engine.pass()
            this.updateUI()
        })
        $(".action.finish-scoring").on("click", () => {
            if (this.online)
                this.engine.finishScoring(this.me)
            else {
                this.engine.finishScoring(0)
                this.engine.finishScoring(1)
            }
            this.updateUI()
        })

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
        audio.play()
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

    updateUI() {
        const playerSprites = [this.sprites["black"], this.sprites["white"]]
        if (this.engine.done && typeof(this.engine.victor) == 'undefined') {
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
                        this.engine.toggleDead(pos)
                        this.updateUI()
                    })
                }
            })

        } else if (this.engine.done) {
            // Game is over
            const sprite = this.sprites[["black", "white"][this.engine.victor]]
            $("#win").show().text(`${["Black", "White"][this.engine.victor]} wins`).prepend(sprite.make()).append(sprite.make())
            $("#win, #turn-info").show().text(`${["Black", "White"][this.engine.victor]} wins`).prepend(sprite.make()).append(sprite.make())
            $(".my-turn").css("visibility", "hidden")
            $(".finish-scoring").hide()
            $("#score").show().text(`Final score: ${this.score()}`)
            $(".possible-move").remove()
        } else {
            // Regular play
            const myTurn = this.online && this.me == this.player || !this.online
            const color = ["black", "white"][this.player]

            $("#turn-info").text(`${["Black", "White"][this.player]}'s turn`)
            const sprite = playerSprites[this.player]
            $("#turn-info").prepend(playerSprites[this.player].make()).append(playerSprites[this.player].make())

            $(".my-turn").css("visibility", myTurn ? "" : "hidden")

            $(".sprite .sprite").remove()
            this.eachPos((pos) => {
                const sprite = this.engine.get(pos)
                this.setSprite(pos, sprite)

                if (myTurn && this.engine.canMove(pos)) {
                    this.addPreview(pos, color, () => {
                        this.engine.move(pos)
                        this.playClack()
                        this.updateUI()
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

function main() { // Pick settings and click start
    $("#game-options .choice").on("click", (ev) => {
        const choice = $(ev.currentTarget)
        const option = choice.parent()

        option.find(".choice").removeClass("selected")
        choice.addClass("selected")
    })
    $(".action.play").on("click", () => {
        const options = {}
        for (var o of ["handicap", "player", "size"]) {
            const v = $(`#game-options .choice.selected[data-${o}]`).data(o)
            if (typeof(v) !== "undefined") options[o] = Number(v)
        }
        window.game = new Game(options)
        $("#game-options").hide()
        $("#game").show()
        $("#about").appendTo(".right")
    })
}

main()
