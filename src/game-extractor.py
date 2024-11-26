import gzip
import io
import json
import sys

# Source: https://archive.org/download/ogs2021/ogs_games_2013_to_2021-08.json.gz
path = "../../sample-100k.json.gz"
outpath = "../games.js"

class NotCool(Exception):
    pass

#def coolEnough(g):
#    coolness = lambda p: -1000*p["professional"] + p["rank"]
#    bRank = coolness(g["players"]["black"])
#    wRank = coolness(g["players"]["white"])
#    return sum(bRank, wRank) < 24

def reparse(g):
    if "outcome" not in g: raise NotCool("Hmm?")
    if g["outcome"] in ["Abandonment", "Timeout", "Cancellation", "Disconnection", "Moderator Decision", "Stone Removal Timeout", "Disqualification"]: raise NotCool(g["outcome"])
    if g["phase"] != "finished": raise NotCool("still unfinished")
    if g["time_control"]["speed"] == "correspondence": raise NotCool("Slow game")

    width = g["width"]
    height = g["height"]
    if width != height: raise NotCool("weird board")
    if width not in [9,13,19]: raise NotCool("weird board")

    black = g["players"]["black"]["username"]
    white = g["players"]["white"]["username"]

    moves = g["moves"]
    winner = "BW"[g["winner"] == g["white_player_id"]]
    handicap = g["handicap"]
    komi = g["komi"]
    rules = g["rules"]
    moves = g["moves"]
    resigned = g["outcome"] == "Resignation"
    total_time = sum(x[2] for x in g["moves"])
    if total_time > 24*60*60*1000: raise NotCool("Slow game")
    if total_time <= 0: raise NotCool("No time information")
    score = None
    if resigned:
        score = "R"
    elif "point" in g["outcome"]:
        score = float(g["outcome"].split()[0])

    if not resigned and score is None:
        raise Exception("Huh")
    outcome = winner + "+" + ("R" if resigned else str(score))

    return {
        "rules": rules,
        "komi": komi,
        "size": width,
        "handicap": handicap,

        "moves": moves, 

        "winner": winner,
        "outcome": outcome,
        "total_time": total_time,
        "score": score,
        "players": {
            "white": white,
            "black": black,
        }
    }


found = 0
total_time = 0
with io.TextIOWrapper(io.BufferedReader(gzip.open(path))) as file:
    with open(outpath, "w") as out:
        print("const games = [", file=out)
        for line in file:
            g = json.loads(line)
            try:
                final = reparse(g)
                found += 1
                print(json.dumps(final), file=out)
                total_time += final["total_time"]
                if found >= 1000: break
                print(",", file=out)
            except NotCool:
                pass
            except Exception:
                print(g)
                raise
        print("]", file=out)
print("Total time: {} hours".format(int(total_time/1000/60/60)))
