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
        this.player = 0 // whose turn is it
        this.size = size
        this.online = online
        this.board = []
        for (var y=0; y<size; y++) {
            this.board.push([])
            for (var x=0; x<size; x++) {
                this.board[y].push(null)
            }
        }
        this.lastMove = {x:-1, y:-1}

        $(".action.resign").on("click", () => { this.resign() })
        $(".action.pass").on("click", () => { this.pass() })

        spritesPromise.then((sprites) => {
            this.sprites = sprites
            this.init()
            this.updateUI()
        })
    }

    init(size) {
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
        const tile = $(`#board > :eq(${pos.y+1}) > :eq(${pos.x+1})`)
        tile.empty()
        if (name) tile.append(this.sprites[name].make())
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

    updateUI() {
        $(".sprite .sprite").remove()

        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                const sprite = this.board[y][x]
                this.setSprite({x, y}, sprite)
            }
        }

        $("#turn-info").text(`${["Black", "White"][this.player]}'s turn`)
        const sprite = this.sprites[["black", "white"][this.player]]
        $("#turn-info").prepend(sprite.make()).append(sprite.make())

        if (this.online && this.me == this.player || !this.online) {  // My turn

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
