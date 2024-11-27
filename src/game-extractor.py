import datetime
import gzip
import io
import json
import sys

# Source: https://archive.org/download/ogs2021/ogs_games_2013_to_2021-08.json.gz
path = "../../sample-100k.json.gz"
outpath = "../games.js"

BOTS = {
    "Spectral-7k",
    "Spectral-13k",
    "amybot-beginner",
    "random-move-nixbot",
    "Fuego",
    "Master Mantis",
    "GnuGo",
    "Kugutsu"
    "TheKid (GnuGo lvl1)",
    "Billy (GnuGo lvl10)",
    "doge_bot_4",
    "noob_bot",
    "DarkGo",
    "doge_bot_3",
    "noob_bot_1",
    "noob_bot_2",
    "Spectral-10k",
    "Spectral-2d",
    "BadukEllington",
    "noob_bot_3",
    "Natsu (Fuego)",
    "Spectral-1k",
    "Master Mantis",
    "Spectral-4k",
    "amybot-ddk",
    "Random Bot",
    "kata-bot",
    "RaspberryPiBot",
    "DreamingElephant",
    "katago-micro",
    "RoyalZero",
    "kata-bot",
    "Budgie 9x9",
    "ELOtest",
    "doge_bot_2",
    "doge_bot_1",
    "Budgie",
    "TheKid (GnuGo lvl1)",
    "Kugutsu",
}

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

    if width != 19: raise NotCool("Only boring games, today!")

    black = g["players"]["black"]["username"]
    white = g["players"]["white"]["username"]
    players = [black, white]

    if any(p in BOTS for p in [black, white]): raise NotCool("Bot Game")

    moves = g["moves"]
    winner = "BW"[g["winner"] == g["white_player_id"]]
    handicap = g["handicap"]
    if handicap > 0:
        if g["free_handicap_placement"]: raise NotCool("Free handicap")
        #moves = moves[handicap:]
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
    game_id = g["game_id"]

    if not resigned and score is None:
        raise Exception("Huh")
    outcome = winner + "+" + ("R" if resigned else str(score))

    date = datetime.datetime.fromtimestamp(g["start_time"]).strftime("%Y-%m-%d")

    return {
        "rules": rules,
        "komi": komi,
        "size": width,
        "handicap": handicap,
        "game_id": game_id,
        "date": date,

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
