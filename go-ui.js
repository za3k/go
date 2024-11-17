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
const spriteNames = ["┌","┬","┐","├","┼","┤","└","┴","┘",".","white","whiteRecent","whiteDead","black","blackRecent","blackDead"]
const maxSize = Math.min(window.innerWidth, window.innerHeight) / 19
if (maxSize > 60) {
    spritesPromise = Sprites.loadAll("sprites60.png", 60, spriteNames)
} else if (maxSize > 45) {
    spritesPromise = Sprites.loadAll("sprites45.png", 45, spriteNames)
} else if (maxSize > 30) {
    spritesPromise = Sprites.loadAll("sprites30.png", 30, spriteNames)
} else {
    spritesPromise = Sprites.loadAll("sprites15.png", 15, spriteNames)
}
    
function randInt(min, max) { return Math.floor(Math.random()*(max-min)) + min }

class Game {
    constructor(size, online) {
        this.online = online
        this.engine = new Engine(size)

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

        spritesPromise.then((sprites) => {
            this.sprites = sprites
            this.init()
            this.updateUI()
        })
    }

    get player() { return this.engine.player }
    get size() { return this.engine.size }

    init() {
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
        }


    }
}

function main() {
    const action = $(`#game-options > .action`).each((i, action) => {
        $(action).on("click", (ev) => {
            window.game = new Game($(ev.target).data("size"), $(ev.target).data("online"))
            $("#game-options").hide()
            $("#game").show()
            $("#about").appendTo(".right")
        })
    })
}
main()
