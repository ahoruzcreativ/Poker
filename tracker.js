// Thread that keeps track of a single iteration of a poker game

var current_player = 0; // the current turn
var current_bet = 1; // the current min bet required to "check"
var bets = []; // the current bets among all the players
var players; // the current list of players
var player_status = []; // a map of the state of each player
var state = "PREFLOP";
var transition_state = false;
var pot = 0;
var all_bets_equal = function() {
    for (var i = 0; i < bets.length-1; i++) {
        if (bets[i] != bets[i+1]) {
            return false;
        }
    }
    return true;
}

var get_sum = function() {
    var total = 0;
    for (var i = 0; i < bets.length; i++) {
        total += bets[i]
    }
    return total;
}

var incrState = function() {
    if (state == "PREFLOP") {
        state = "FLOP";
        return;
    }
    if (state == "FLOP") {
        state = "TURN";
        return;
    }
    if (state == "TURN") {
        state = "RIVER";
        return;
    }
    if (state == "RIVER") {
        state = "DONE";
        pot = 0; // reset the pot
        current_bet = 1;
        return;
    }
    if (state == "DONE") {
        state = "FLOP";
        return;
    }
}

var isOver  = function() {
    count = 0;
    for (var i = 0; i < player_status.length; i++) {
        if (player_status[i]) {
            count += 1;
        }
    }
    return count == 1;
}

var getWinner = function() {
    for (var i = 0; i < player_status.length; i++) {
        if (player_status[i]) {
            return players[i];
        }
    }
    throw "No Player Is Still In";
}

onmessage = function(e) {
    //console.log(e.data);
    if (e.data.op == "SetPlayers") {
        console.log("Setting Players");
        players = e.data.player_list;
        if (player_status.length == 0) {
            console.log("Setting True");
            state = "PREFLOP";
            current_bet = 1;
            current_player = 0;
            for (var i = 0; i < players.length; i++) {
                player_status[i] = true;
            }
        }
        while (!player_status[current_player] && current_player != players.length) {
            current_player += 1;
        }
        postMessage({"op" : "INC", "player" : current_player, "bet": current_bet});
    }
    else if (e.data.op == "Increment") {
        current_bet = Math.max(current_bet, e.data.bet);
        if (bets.length != players.length) {
            bets.push(e.data.bet);
        } else {
            bets[current_player] = e.data.bet;
            if (all_bets_equal()) {
                var pot_value = get_sum();
                pot += pot_value;
                current_bet = 0;
                bets = [];
                var old_pot_val = pot;
                incrState();
                postMessage({"op": "RES", "state": state, "transition": true, "pot" : old_pot_val});
                return;
            }
        }
        console.log("Current Bet: " + current_bet);
        console.log("\n");
        //console.log("Current Turn: " + old_player);
        current_player += 1;
        while (!player_status[current_player] && current_player != players.length) {
            current_player += 1;
        }
        if (current_player == players.length) {
            current_player = 0;
            if (all_bets_equal()) {
                var pot_value = get_sum();
                pot += pot_value;
                current_bet = 0;
                bets = [];
                var old_pot_val = pot;
                incrState();
                postMessage({"op": "RES", "state": state, "transition": true, "pot" : old_pot_val});
                return;
            }
            postMessage({"op" : "INC", "player" : current_player, "bet": current_bet});
            return;
        }
        postMessage({"op" : "INC", "player" : current_player, "bet": current_bet});
        return;

    } else if (e.data.op == "Remove") {
        player_status[e.data.player_to_remove] = false;
        current_player += 1;
        if (isOver()) {
            var old_pot_val = pot;
            current_player = 0; // reset player
            pot = 0; // reset the pot
            postMessage({"op": "RES", "state": "DONE", "transition": true, "pot" : old_pot_val, "winner" : getWinner()});
            player_status = [];
            state = "PREFLOP";
            return;
        }
        while (!player_status[current_player] && current_player != players.length) {
            current_player += 1;
        }
        if (current_player == players.length) {
            current_player = 0;
            if (all_bets_equal()) {
                var pot_value = get_sum();
                pot += pot_value;
                current_bet = 0;
                bets = [];
                var old_pot_val = pot;
                incrState();
                postMessage({"op": "RES", "state": state, "transition": true, "pot" : old_pot_val});
                return;
            }
            postMessage({"op" : "INC", "player" : current_player, "bet": current_bet});
            return;
        }
        postMessage({"op" : "INC", "player" : current_player, "bet": current_bet});
        return;
    }
}
