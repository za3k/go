
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }


function shuffle(array) {
  let currentIndex = array.length;
  while (currentIndex != 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
}


let gameI = 0
async function loadGame() {
    // Example game in the 'games' array
    // {"rules": "japanese", "komi": 5.5, "size": 9, "handicap": 0, "moves": [[3, 5, 8386], ...], "winner": "B", "outcome": "B+7.5", "total_time": 308413, "score": 7.5, "players": {"white": "dw197", "black": "CalamityVayne"}}

    gameI = (gameI + 1) % games.length
    g = games[gameI]

    return {
        options: {
            size: g.size,
            handicap: g.handicap,
            blackName: g.players.black,
            whiteName: g.players.white,
            volume: 0.1,
            replay: true,
        },
        moves: g.moves,
        score: g.outcome,
        victor: 0+(g.winner == "W"),
        gameId: g.game_id,
        orig: g,
    }
}

async function main() {
    shuffle(games)
    while (true) {
        var g = await loadGame()
        $("#game").show()
        $("#about").appendTo(".right")
        try {
            await playGame(g)
            await sleep(10000)
        } catch (e) {
            console.error(e)
            break
        }
        if (game && game.close) game.close()
    }
}

async function playGame(g) {
    window.game = new Game(g.options)
    await game.ready

    for (var move of g.moves) {
        await sleep(move[2])
        if (move[0] < 0) game.pass()
        else             game.move({x: move[1], y: move[0]})
    }

    await sleep(2000)
    game.overrideWin(g.victor, g.score)
}

main()
