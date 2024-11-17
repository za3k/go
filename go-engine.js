class IllegalMove extends Error {
    constructor(message, options) { super(message, options) }
}

class PosSet {
    constructor() {
        this.s = {}
    }
    add(...poses) {
        for (var pos of poses)
            (this.s[pos.y] ||= {})[pos.x] = true
    }
    has(pos) {
        return (this.s[pos.y] || {})[pos.x]
    }
    poses() {
        const poses = []
        for (var y in this.s)
            for (var x in this.s[y])
                poses.push({x: Number(x), y: Number(y)})
        return poses
    }
}

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
        this.passes = 0
        this.komi = 7.5
    }

    otherPlayer(p) {
        return (p+1)%2
    }

    resign() {
        this.done = true
        this.victor = this.otherPlayer(this.player)
        this.resigned = true
    }

    pass() {
        this.passes++
        this.player = this.otherPlayer(this.player)
        if (this.passes >= 2) this.done = true
    }

    clone() {
        var n = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        n.board = structuredClone(this.board)
        return n
    }

    get(pos) { return this.board[pos.y][pos.x] }

    move(pos, hypothetical) {
        if (!!this.board[pos.y][pos.x]) throw new IllegalMove("That position is not empty")

        const color = ["black","white"][this.player]
        const oldBoard = structuredClone(this.board)

        this.board[pos.y][pos.x] = color
        
        var captured = []
        for (var neighbor of this.neighborsPos(pos)) {
            if (this.get(neighbor) && this.get(neighbor) != color && this.libertiesGroup(neighbor) == 0) {
                captured.push(neighbor)
            }
        }
        for (var group of captured) {
            if (this.get(group)) this.captureGroup(group)
            this.captureGroup(group)
        }

        if (this.libertiesGroup(pos) == 0) throw new IllegalMove("Suicide is not allowed")

        if (this.sameBoard(this.board, this.koForbids)) throw new IllegalMove("Ko")
        this.koForbids = oldBoard

        this.player = this.otherPlayer(this.player)
        this.passes = 0
        this.lastMove = pos
    }

    sameBoard(b1, b2) {
        if ((!!b1) != (!!b2)) return false
        for (var y=0; y<this.size; y++)
            for (var x=0; x<this.size; x++)
                if (b1[y][x] != b2[y][x]) return false
        return true
    }

    neighborsPos(pos) { // Neighbors of the position
        var neighbors = []
        const {x, y} = pos
        if (x > 0)           neighbors.push({x: x-1, y})
        if (x < this.size-1) neighbors.push({x: x+1, y})
        if (y > 0)           neighbors.push({x, y: y-1})
        if (y < this.size-1) neighbors.push({x, y: y+1})
        return neighbors
    }

    neighborsGroup(group) { // Neighbors of the group
        var neighbors = new PosSet()
        for (var pos of this.positionsGroup(group)) {
            neighbors.add(...this.neighborsPos(pos))
        }
        return neighbors.poses()
    }

    captureGroup(pos) { // Capture the group
        if (!this.get(pos)) return
        for (var pos of this.positionsGroup(pos)) this.board[pos.y][pos.x] = null
    }

    positionsGroup(group) {
        const color = this.get(group)

        var visited = new PosSet()
        var q = []
        function queue(pos) {
            if (visited.has(pos)) return
            visited.add(pos)
            q.push(pos)
        }

        queue(group)
        while (q.length > 0) {
            const n = q.shift()
            for (var neighbor of this.neighborsPos(n)) {
                if (this.get(neighbor) == color) queue(neighbor)
            }
        }

        return visited.poses()
    }

    libertiesGroup(group) { // Liberties of the group (as a number)
        var liberties = 0
        for (var n of this.neighborsGroup(group)) {
            if (!this.get(n)) liberties++
        }
        return liberties
    }

    uniqueGroups(groups) { // Return unique groups out of the list
        return groups // TODO, not needed yet
    }

    uniquePos(poses) {
        // TODO: Not used
        return new PosSet().add(...poses).poses()
    }

    canMove(pos) {
        if (!!this.get(pos)) return false // Slight speedup
        const v2 = this.clone()
        try {
            v2.move(pos, true)
            return true
        } catch(err) {
            if (err instanceof IllegalMove) return false
            else {
                console.error(err.stack)
                throw err
            }
        }
    }

    // Scoring
    toggleDead(pos) {}
    finishScoring(player) {
        // TODO: require both players to click it
        this.resigned = false
        if (this.score > 0) this.victor = 0
        else                this.victor = 1 // White wins ties, arbitrarily
    }
    get score() { // Positive is "for black"
        var score = -this.komi
        return score // TODO
    } 

}
