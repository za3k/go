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
console.log(maxSize)
if (maxSize > 60) {
    spritesPromise = Sprites.loadAll("sprites60.png", 60, spriteNames)
} else if (maxSize > 30) {
    spritesPromise = Sprites.loadAll("sprites30.png", 30, spriteNames)
} else {
    spritesPromise = Sprites.loadAll("sprites15.png", 15, spriteNames)
}
    

class Game {
    constructor(size, online) {
        this.online = online
        this.engine = new Engine(size)

        $(".action.resign").on("click", () => { this.resign() })
        $(".action.pass").on("click", () => { this.pass() })

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

    playSound(name) {
        const audio = new Audio(`audio/${name}.mp3`)
        audio.play()
    }

    win(winner) {
        this.playSound("win")
        const sprite = this.sprites[["black", "white"][winner]]
        $("#win").show().text(`${["Black", "White"][winner]} wins`).prepend(sprite.make()).append(sprite.make())
    }

    eachPos(f) {
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                f({x, y})
            }
        }
    }

    updateUI() {
        $(".sprite .sprite").remove()

        this.eachPos((pos) => {
            const sprite = this.engine.get(pos)
            this.setSprite(pos, sprite)
        })

        $("#turn-info").text(`${["Black", "White"][this.player]}'s turn`)
        const color = ["black", "white"][this.player]
        const sprite = this.sprites[color]
        $("#turn-info").prepend(sprite.make()).append(sprite.make())

        if (this.online && this.me == this.player || !this.online) {  // My turn
            this.eachPos((pos) => {
                if (this.engine.canMove(pos)) { 
                    this.addPreview(pos, color, () => {
                        this.engine.move(pos)
                        this.updateUI()
                    })
                }
            })
        } else { // Not my turn

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
