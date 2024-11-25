
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

async function loadGame() {
    // TODO: parse and pass
    // [ ] Player names and ratings
    // [ ] Board size
    // [ ] Handicap
    // [ ] Moves

    return {
        options: {
            size: 19,
            handicap: 0,
            blackName: "Some Idiot (30k)"
            whiteName: "Daniel (9p)",
        },
        moves: [],
    }
}

async function main() { // Pick settings and click start
    do {
        var g = await loadGame()
        $("#game").show()
        $("#about").appendTo(".right")
        await playGame(g)
        await sleep(10000)
    }
}


async function playGame(g) {
    // Game(options, me, history)
    window.game = new Game(g.options, -1)
    // TODO: Have go-ui.js display player names

    for (var move of game.moves) {
        await sleep(move.timeTaken)
        if (move.move == "pass")        game.pass()
        else if (move.move == "resign") game.resign()
        else                            game.move(move.move)
    }
    // TODO: Correctly display the final score.
}

main()
