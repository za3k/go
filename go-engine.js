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
        this.scored = []
        this.size = size
        for (var y=0; y<size; y++) {
            this.board.push([])
            this.scored.push([])
            for (var x=0; x<size; x++) {
                this.board[y].push(null)
                this.scored[y].push(null)
            }
        }
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
        delete this.lastMove
        if (this.passes >= 2) {
            this.done = true
            this.markBoard()
        }
    }

    clone() {
        var n = Object.assign(Object.create(Object.getPrototypeOf(this)), this)
        n.board = structuredClone(this.board)
        return n
    }

    get(pos) { return this.board[pos.y][pos.x] }
    getScored(pos) { return this.board[pos.y][pos.x] || this.scored[pos.y][pos.x] } // For visuals (null, whiteDead or blackDead)
    getScore(pos) { return this.scored[pos.y][pos.x] || this.board[pos.y][pos.x] } // For scoring (whitePoint or blackPoint)
    set(pos, v) { this.board[pos.y][pos.x] = v }
    setScore(pos, v) { this.scored[pos.y][pos.x] = v }

    move(pos, hypothetical) {
        if (!!this.get(pos)) throw new IllegalMove("That position is not empty")

        const color = ["black","white"][this.player]
        const oldBoard = structuredClone(this.board)

        this.set(pos, color)
        
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

        this.lastMove = pos
        this.player = this.otherPlayer(this.player)
        this.passes = 0
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
        for (var pos of this.positionsGroup(pos)) this.set(pos, null)
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
    toggleDead(group) {
        const color = this.get(group)
        const changeTo = {
            "white": "whiteDead",
            "black": "blackDead",
            "whiteDead": "white",
            "blackDead": "black",
        }[color]

        if (!changeTo) return
        for (var pos of this.positionsGroup(group)) this.set(pos, changeTo)

        this.markBoard()
    }

    markBoard() {
        // Change dead to removed on a copy
        const v2 = this.clone()
        for (var y=0; y<this.size; y++)
            for (var x=0; x<this.size; x++) {
                const pos = {x,y}
                v2.set(pos, { "white": "white", "black": "black" }[v2.get(pos)] || null )
            }

        // Mark up this simplified board
        const accounted = new PosSet()
        for (var y=0; y<this.size; y++) {
            for (var x=0; x<this.size; x++) {
                const pos = {x,y}
                if (!v2.get(pos) && !accounted.has(pos)) {
                    accounted.add(...this.positionsGroup(pos))
                    v2.markGroup(pos)
                }
            }
        }

        // Copy the results over to the original in this.scored
        for (var y=0; y<this.size; y++)
            for (var x=0; x<this.size; x++) {
                const pos = {x, y}
                if (!v2.get(pos)) this.setScore(pos, v2.getScore(pos))
            }
    }

    markGroup(group) { // precondition: whiteDead, blackDead already changed to null
        var marks = {}
        var changeTo = null

        for (var pos of this.neighborsGroup(group)) { // Mark down colors of all neighbors
            const color = this.get(pos)
            marks[color] = true
        }

        delete marks[null]
        delete marks[undefined] // Just in case
        marks = Object.keys(marks)
        if (marks.length == 1) changeTo = {"white": "whitePoint", "black": "blackPoint"}[marks[0]]

        for (var pos of this.positionsGroup(group)) this.setScore(pos, changeTo)
    }

    finishScoring(player) {
        // TODO: require both players to click it
        this.resigned = false
        if (this.score > 0) this.victor = 0
        else                this.victor = 1 // White wins ties, arbitrarily
    }

    get score() { // Positive is "for black"
        var score = -this.komi
        const scoreChange = {
            "black": 1,
            "blackPoint": 1,
            "white": -1,
            "whitePoint": -1,
            null: 0,
        }
        for (var y=0; y<this.size; y++)
            for (var x=0; x<this.size; x++)
                score += scoreChange[this.getScore({x,y})]
        return score
    } 
}
