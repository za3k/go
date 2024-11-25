// Game(options, me, history)

function main() { // Pick settings and click start
    // Multiplayer
    window.multiplayer = new Multiplayer('go')
    multiplayer.registerBroadcastMethods(["pass", "resign", "finishScoring", "move", "toggleDead"])
    multiplayer.on("init", (options, player, history) => {
        multiplayer.proxy(new Game(options, player, history))
        window.game = multiplayer
    })

    function optionsDone() {
        $("#game-options").hide()
        $("#game").show()
        $("#about").appendTo(".right")
    }

    if (multiplayer.isExistingGame()) {
        multiplayer.connectExisting() // Existing multiplayer
        optionsDone()
    } else {
        $("#game-options .choice").on("click", (ev) => {
            const choice = $(ev.currentTarget)
            const option = choice.parent()

            option.find(".choice").removeClass("selected")
            choice.addClass("selected")
        })
        $(".action.play").on("click", () => {
            const options = {}
            for (var o of ["handicap", "player", "size", "online"]) {
                const v = $(`#game-options .choice.selected[data-${o}]`).data(o)
                if (typeof(v) !== "undefined") options[o] = Number(v)
            }
            if (typeof(options.player) == "undefined") options.player = randInt(0, 2)
            const me = options.player
            delete options.player

            if (options.online) {
                multiplayer.create(options, me) // New multiplayer
            } else {
                window.game = new Game(options, me) // New local
            }
            optionsDone()
        })
    }
}

main()
