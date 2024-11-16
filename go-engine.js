class Engine {
    constructor(size) {
        this.player = 0 // whose turn is it
        this.board = []
        this.size = size
        for (var y=0; y<size; y++) {
            this.board.push([])
            for (var x=0; x<size; x++) {
                this.board[y].push(null)
            }
        }
        this.lastMove = {x:-1, y:-1}
        this.done = false
    }

    resign() {}
    pass() {}

    get(pos) { return this.board[pos.y][pos.x] }

    move(pos) {
        if (!this.canMove(pos)) return
        this.board[pos.y][pos.x] = ["black","white"][this.player]
        this.player = (this.player+1)%2


    }
    canMove(pos) {
        if (!!this.get(pos)) return false
        return true // TODO: disallow suicides, ko
    }

    // Scoring
    toggleDead(pos) {}
    get score() {}

}
