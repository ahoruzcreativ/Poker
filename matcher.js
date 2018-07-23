// Handles the end game logic where we determine the winner of the round
var map = {}; // a mapping of the player id and his corresponding hand
var board; // all the cards on the board
var card_values = {}; // a mapping of card types and their corresponding values
card_values["0"] = 0;
card_values["2"] = 2;
card_values["3"] = 3;
card_values["4"] = 4;
card_values["5"] = 5;
card_values["6"] = 6;
card_values["7"] = 7;
card_values["8"] = 8;
card_values["9"] = 9;
card_values["10"] = 10;
card_values["J"] = 11;
card_values["Q"] = 12;
card_values["K"] = 13;
card_values["A"] = 14;

var hand_values = {}; // a mapping of possible hands and their corresponding values
hand_values["royal_flush"] = 10;
hand_values["straight_flush"] = 9;
hand_values["quads"] = 8;
hand_values["full_house"] = 7;
hand_values["flush"] = 6;
hand_values["straight"] = 5;
hand_values["trips"] = 4;
hand_values["two_pair"] = 3;
hand_values["pair"] = 2;
hand_values["high_card"] = 1;

var logBoard = function() {
    for (var i = 0; i < board.length; i++) {
        console.log(board[i][1] + " " + board[i][0]);
    }
}
// Returns true if the board already has a flush
var boardHasFlush = function() {
    for (var i = 0; i < board.length-1; i++) {
        if (board[i][0] != board[i+1][0]) {
            return false;
        }
    }
    return true;
}
/*** Function for determing all the potential nth matchings, i.e. if n = 2, then we
are looking for all the pairs of two same cards on the board*/
var boardHasN = function(n) {
    var card_to_count = {};
    var acc = []; // all the card values where there are n copies of them on the board
    for (var i = 0; i < board.length; i++) {
        if (card_to_count[board[i][1]] == undefined) {
            card_to_count[board[i][1]] = 1;
        } else {
            card_to_count[board[i][1]] += 1;
            if (card_to_count[board[i][1]] == n) {
                acc.push(board[i][1]);
            }
        }
    }
    return acc;
}

/** Returns an array with the biggest flush available if possible. Returns
null otherwise **/
var determineFlush = function(hand) {
    card_1 = hand[0].split("_"); // [suit, value]
    card_2 = hand[1].split("_"); // [suit, value]
    var flush_exists_already = boardHasFlush();
    if (card_1[0] == card_2[0]) { // case where hand has the same suit
        candidates = [];
        for (var i = 0; i < board.length; i++) {
            if (board[i][0] == card_1[0]) {
                candidates.push(board[i]);
            }
        }
        if (candidates.length < 3) {
            return (flush_exists_already) ? board : null;
        }

        candidates.push(card_1);
        candidates.push(card_2);
        candidates.sort(function(a,b) {
            return card_values[b[1]] - card_values[a[1]];
        });
        return candidates.slice(0,5); // get the best 5
    }

    var candidates_1 = [];
    var candidates_2 = [];

    // check for flush with card_1
    for (var i = 0; i < board.length; i++) {
        if (board[i][0] == card_1[0]) {
            candidates_1.push(board[i]);
        }
    }
    if (candidates_1.length >= 4) {
        candidates_1.push(card_1);
        candidates_1.sort(function(a,b) {
            return card_values[b[1]] - card_values[a[1]];
        });
        candidates_1 = candidates_1.slice(0,5); // get the best 5
        return candidates_1;
    }

    // check for flush with card_2
    for (var i = 0; i < board.length; i++) {
        if (board[i][0] == card_2[0]) {
            candidates_2.push(board[i]);
        }
    }
    if (candidates_2.length >= 4) {
        candidates_2.push(card_1);
        candidates_2.sort(function(a,b) {
            return card_values[b[1]] - card_values[a[1]];
        });
        candidates_2 = candidates_2.slice(0,5); // get the best 5
        return candidates_2;
    }

    return (flush_exists_already) ? board : null;
}

/*** Function for determining if a quad exists
Returns [value], which the is the value of the card where there is 4 of a kind on
the board, and null if no 4 of a kind.
*/
var determineQuad = function(hand) {
    var card_1 = hand[0].split("_");
    var card_2 = hand[1].split("_");
    var boardHasQuad = boardHasN(4);
    if (boardHasQuad.length != 0) {
        return boardHasQuad[0];
    }
    if (card_1[1] == card_2[1]) { // case where both cards are the same
        var pairs = boardHasN(2); // all the pairs on the board
        for (var i = 0; i < pairs.length; i++) {
            if (pairs[i] == card_1[1]) {
                return card_1[1];
            }
        }
        return null; // there can only be one four of a kind on the board
    }

    // check card 1
    var trips = boardHasN(3);
    for (var i = 0; i < trips.length; i++) {
        if (trips[i] == card_1[1]) {
            return card_1[1];
        }
        if (trips[i] == card_2[1]) {
            return card_2[1];
        }
    }
    return null;
}

/*** Returns the value (head) of the biggest possible triple for a player's given hand, if it exists.
Returns null if no triple can be formed */
var determineTrip = function(hand) {
    var card_1 = hand[0].split("_");
    var card_2 = hand[1].split("_");
    var boardHasTrip = boardHasN(3);
    if (card_1[1] == card_2[1]) { // case where both cards are the same
        for (var i = 0; i < board.length; i++) {
            if (card_1[1] == board[i][1]) { // look for a single matching card
                if (boardHasTrip.length != 0) {
                    return (card_values[card_1[1]] > card_values[boardHasTrip[0]]) ? card_1[1] : boardHasTrip[0];
                }
                return card_1[1];
            }
        }
        return (boardHasTrip.length == 0) ? null :  boardHasTrip[0]; // there can only be one four of a kind on the board
    }
    var pairs = boardHasN(2);
    var one_found = false;
    var two_found = false;
    for (var i = 0; i < pairs.length; i++) {
        if (pairs[i] == card_1[1]) {
            one_found = true;
        }
        if (pairs[i] == card_2[1]) {
            two_found = true;
        }
    }
    if (one_found && two_found) {
        return (card_values[card_1[1]] > card_values[card_2[1]]) ? card_1[1] : card_2[1];
    }
    if (one_found) {
        if (boardHasTrip.length == 0) {
            return card_1[1];
        }
        return (card_values[card_1[1]] > card_values[boardHasTrip[0]]) ? card_1[1] : boardHasTrip[0];
    }
    if (two_found) {
        if (boardHasTrip.length == 0) {
            return card_2[1];
        }
        return (card_values[card_2[1]] > card_values[boardHasTrip[0]]) ? card_2[1] : boardHasTrip[0];
    }
    return (boardHasTrip.length == 0) ? null :  boardHasTrip[0];
}

/*** Returns the biggest pair with the given hand, null if pair does not exists */
var determinePair = function(hand) {
    var card_1 = hand[0].split("_");
    var card_2 = hand[1].split("_");
    var pairs = boardHasN(2); // a list of all values that are paired on the board

    if (card_1[1] == card_2[1]) { // pocket pair scenario
        var max = card_values[card_1[1]];
        var val = card_1[1];
        for (var i = 0; i < pairs.length; i++) {
            if (card_values[pairs[i]] > max) {
                max = card_values[pairs[i]];
                val = pairs[i]
            }
        }
        return val;
    }
    var one_paired = false; // whether card 1 has a pairing
    var two_paired = false; // whether card has a pairing
    for (var i = 0; i < board.length; i++) {
        if (board[i][1] == card_1[1]) {
            one_paired = true;
        }
        if (board[i][1] == card_2[1]) {
            two_paired = true;
        }
    }
    var max = "0";
    if (one_paired && two_paired) {
        max = (card_values[card_1[1]] >  card_values[card_2[1]]) ? card_1[1] : card_2[1];
    }
    else if (one_paired) {
        max = card_1[1];
    }
    else if (two_paired) {
        max = card_2[1];
    }

    for (var i = 0; i < pairs.length; i++) {
        if (card_values[pairs[i]] > card_values[max]) {
            max = pairs[i];
        }
    }
    return (max == "0") ? null : max;
}

/*** Returns the biggest two pair with the given hand,
null if two pair does not exist */
var determineTwoPair = function(hand) {
    var card_1 = hand[0].split("_");
    var card_2 = hand[1].split("_");
    var pairs = boardHasN(2);
    if (card_1[1] == card_2[1]) {
        if (pairs.length == 0) {
            return null;
        }
        var first = card_1[1];
        var second = "0";

        for (var i = 0; i < pairs.length; i++) {
            if (card_values[pairs[i]] > card_values[first]) {
                second = first;
                first = pairs[i];
            } else if (card_values[pair[i]] > card_values[second]) {
                second = pairs[i];
            }
        }
        return [first, second];
    }
    var one_paired = false; // whether card 1 has a pairing
    var two_paired = false; // whether card has a pairing
    for (var i = 0; i < board.length; i++) {
        if (board[i][1] == card_1[1]) {
            one_paired = true;
        }
        if (board[i][1] == card_2[1]) {
            two_paired = true;
        }
    }
    var first_h = "0";
    var second_h = "0";
    if (one_paired && two_paired) {
        if (card_values[card_1[1]] > card_values[card_2[1]]) {
            first_h = card_1[1];
            second_h = card_2[1];
        } else {
            first_h = card_2[1];
            second_h = card_1[1];
        }
    }
    else if (one_paired) {
        first_h = card_1[1];
    } else if (two_paired) {
        first_h = card_2[1];
    }

    for (var i = 0; i < pairs.length; i++) {
        if (pairs[i] != first_h && pairs[i] != second_h) {
            if (card_values[pairs[i]] > card_values[first_h]) {
                second_h = first_h;
                first_h = pairs[i]
            } else if (card_values[pairs[i]] > card_values[second_h]) {
                second_h = pairs[i];
            }
        }
    }
    return (first_h == "0" || second_h == "0") ? null : [first_h, second_h];
}

/*** Returns the biggest possible straight that a person can make with
his given hand, null if straight does not exist
*/
var determineStraight = function(hand) {
    var card_1 = hand[0].split("_");
    var card_2 = hand[1].split("_");
    var seven = board.slice(); // make copy of the board
    seven.push(card_1);
    seven.push(card_2);
    seven.sort(function(a,b) {
        return card_values[b[1]] - card_values[a[1]];
    });
    var acc = [];
    for (var i = 0; i < seven.length-1 ; i++) {
        if (card_values[seven[i][1]] == card_values[seven[i+1][1]] + 1) {
            acc.push(seven[i]);
            if (acc.length == 4) {
                acc.push(seven[i+1]);
                return acc;
            }
        } else {
            acc = []; // reset if straight not found
        }
    }
    return null;
}

/*** Determines if the hand constitutes a royal flush, null otherwise */
var determineRoyal = function(hand) {
    var flush = determineFlush(hand); // the biggest possible flush
    var order = ["A", "K", "Q", "J", "10"];
    if (flush == null) {
        return false;
    }
    //console.log("flush exists");
    for (var i = 0; i < flush.length; i++) {
        if (flush[i][1] != order[i]) {
            return false;
        }
    }
    //console.log("royal flush found");
    return true;
}

/*** Determine if a five card sequence is a flush */
var isFlush = function(five) {
    for (var i = 0; i < five.length -1; i++) {
        if (five[i][0] != five[i+1][0]) {
            return false;
        }
    }
    return true;
}

/** Return the greatest straight flush, null if no such hand.
The value returned is the head of that flush */
var determineStraightFlush = function(hand) {
    var straight = determineStraight(hand);
    if (straight == null) {
        return null;
    }
    return (isFlush(straight)) ? straight[0][1] : null;
}

/** Return the biggest possible full house, null if no such Handler
the value is [head_of_triple, head_of_pair] */
var determineFullHouse = function(hand) {
    var trip = determineTrip(hand); // biggest three pair
    if (trip == null) {
        return null;
    }
    var two_pair = determineTwoPair(hand);
    if (two_pair == null) {
        return null;
    }
    return (two_pair[0] != trip) ? [trip, two_pair[0]] : [trip, two_pair[1]];
}

/*** Return the high card for this hand */
var determineHighCard = function(hand) {
    var copy = board.slice();
    copy.push(hand[0].split("_"));
    copy.push(hand[1].split("_"));
    copy.sort(function(a,b) {
        return card_values[b[1]] - card_values[a[1]];
    });
    return copy[0][1]; // return biggest card value
}

/*** Returns a json {player, hand, tiebreaker} where tiebreaker represents the best possible hand that can
 * be derived for this player.
 */
var getBestFive = function(player, hand) {
    if (determineRoyal(hand)) {
        return {"player" : player, "hand" : "royal_flush"};
        
    }
    if (determineStraightFlush(hand) != null) {
        return {"player" : player, "hand" : "straight_flush", "tiebreaker" : determineStraightFlush(hand)}; // tiebreaker is head of flush
        
    }
    if (determineQuad(hand) != null) {
        return {"player" : player, "hand" : "quads", "tiebreaker" : determineQuad(hand)}; // tiebreaker is quad value
        
    }
    if (determineFullHouse(hand) != null) {
        return {"player" : player, "hand" : "full_house", "tiebreaker" : determineFullHouse(hand)}; // tiebreaker is [trip, pair]
        
    }
    if (determineFlush(hand) != null) {
        return {"player" : player, "hand" : "flush", "tiebreaker" : determineFlush(hand)}; // tiebreaker is entire flush
        
    }
    if (determineStraight(hand) != null) {
        return {"player" : player, "hand" : "straight", "tiebreaker" : determineStraight(hand)}; // returns entire straight hand
        
    }
    if (determineTrip(hand) != null) {
        return {"player" : player, "hand" : "trips", "tiebreaker" : determineTrip(hand)}; // returns head of trip
        
    }
    if (determineTwoPair(hand) != null) {
        return {"player" : player, "hand" : "two_pair", "tiebreaker" : determineFlush(hand)}; // tiebreaker is [big, small]
        
    }
    if (determinePair(hand) != null) {
        return {"player" : player, "hand" : "pair", "tiebreaker" : determinePair(hand)};
    }
    return {"player" : player, "hand" : "high_card", "tiebreaker" : determineHighCard(hand)};
        
}

/** Returns the best kickers based off the hand type */
var getRemaining = function(player, hand, hand_val) {
    var copy = board.slice();
    copy.push(map[player][0].split("_"));
    copy.push(map[player][1].split("_"));
    copy.sort(function(a,b) {
        return card_values[b[1]] - card_values[a[1]];
    });

    if (hand == "trips") {   
        var arr = [];
        for (var i = 0; i < copy.length; i++) {
            if (copy[i][1] != hand_val) {
                arr.push(copy[i][1]);
                if (arr.length == 2){
                    return arr;
                }
            }
        }
        throw "Could not find next two best kickers for triple";
    }
    if (hand == "two_pair") {
        for (var i = 0; i < copy.length; i++) {
            if (copy[i][1] != hand_val[0] && copy[i][1] != hand_val[1]) {
                return copy[i][1];
            }
        }
        return "Could not find the best kicker for two_pair";
    }
    if (hand == "pair") {
        var acc = [];

        for (var i = 0; i < copy.length;i++) {
            if (copy[i][1] != hand_val) {
                acc.push(copy[i][1]);
                if (acc.length == 3) {
                    return acc;
                }
            }
        }
        throw "Could not find next two best kickers for pair";
    }
    if (hand == "high_card") {
        return copy.slice(1).map(function(e) {
            return e[1];
        });
    }
 }

/*** Comparison function for the same hand type
 * Returns 1 if player 1 wins the tie, 0 if they are equivalent, and -1 if player 2 wins the tie */
var settleTie = function(p1,p2,hand, t1, t2) {
    if (hand == "straight_flush" || hand == "quads" || hand == "straight") { // for these hands, rank is based on value of the leading card
        if (card_values[t1] > card_values[t2]) {
            return 1;
        } else if (card_values[t1] == card_values[t2]) {
            return 0;
        }
        return -1;
    }

    if (hand == "full_house") {
        if (card_values[t1[0]] > card_values[t2[0]]) {
            return 1;
        }
        if (card_values[t2[0]] > card_values[t1[0]]) {
            return -1;
        }
        // trips must be the same at this point
        if (card_values[t1[1]] > card_values[t2[1]]) {
            return 1;
        }
        if (card_values[t2[1]] > card_values[t1[0]]) {
            return -1;
        }
        return 0;
    }

    if (hand == "flush") {
        for (var i = 0; i < 5; i++) {
            if (card_values[t1[i][1]] > card_values[t2[i][1]]) {
                return 1;
            }
            if (card_values[t1[i][1]] < card_values[t2[i][1]]) {
                return -1;
            }
        }
        return 0;
    }

    if (hand == "trips") {
        if (card_values[t1] > card_values[t2]) {
            return 1;
        }
        if (card_values[t1] < card_values[t2]) {
            return -1;
        }
        var p1_kickers = getRemaining(p1,hand,t1);
        var p2_kickers = getRemaining(p1,hand,t2);

        for (var i = 0; i < p1_kickers.length;i++) {
            if (card_values[p1_kickers[i]] > card_values[p2_kickers[i]]) {
                return 1;
            }
            if (card_values[p1_kickers[i]] < card_values[p2_kickers[i]]) {
                return -1;
            }
        }
        return 0;
    }

    if (hand == "two_pair") {
        if (card_values[t1[0]] > card_values[t2[0]]) {
            return 1;
        }
        if (card_values[t1[0]] < card_values[t2[0]]) {
            return -1;
        }
        var p1_kicker = card_values[getRemaining(p1,hand,t1)];
        var p2_kicker = card_values[getRemaining(p2,hand,t2)];
        if (p1_kicker > p2_kicker) {
            return 1;
        }
        if (p1_kicker < p2_kicker) {
            return -1;
        }
        return 0;
    }
    
    if (hand == "pair") {
        if (card_values[t1] > card_values[t2]) {
            return 1;
        }
        if (card_values[t1] < card_values[t2]) {
            return -1;
        }
        var p1_kickers = getRemaining(p1,hand,t1);
        var p2_kickers = getRemaining(p2,hand,t2);
        for (var i = 0; i < p1_kickers.length;i++) {
            if (card_values[p1_kickers[i]] > card_values[p2_kickers[i]]) {
                return 1;
            }
            if (card_values[p1_kickers[i]] < card_values[p2_kickers[i]]) {
                return -1;
            }
        }
        return 0;
    }
    // high card comparison
    if (card_values[t1] > card_values[t2]) {
        return 1;
    }
    if (card_values[t1] < card_values[t2]) {
        return -1;
    }
    var p1_kickers = getRemaining(p1,hand,t1);
    var p2_kickers = getRemaining(p2,hand,t2);
    for (var i = 0; i < p1_kickers.length;i++) {
        if (card_values[p1_kickers[i]] > card_values[p2_kickers[i]]) {
            return 1;
        }
        if (card_values[p1_kickers[i]] < card_values[p2_kickers[i]]) {
            return -1;
        }
    }
    return 0;
}

/*** Returns the socket-id of the winning player */
var getWinner = function() {
    var winner; // the id of the current player winning
    var hand_description; // the hand of the current player winning
    var tiebreaker; // the tiebreaker of the current player winning

    var tiePool = []; // will be length 0 unless a true tie has occurred among players
    for (var key in map) {
        var description = getBestFive(key, map[key]);
        if (winner == undefined && hand_description == undefined && tiebreaker == undefined) {
            winner = description.player;
            hand_description = description.hand;
            tiebreaker = description.tiebreaker;
        } else {
            if (hand_values[description.hand] > hand_values[hand_description]) {
                winner = description.player;
                hand_description = description.hand;
                tiebreaker = description.tiebreaker;
            } else if (hand_values[description.hand] == hand_values[hand_description]) {
                var verdict = settleTie(winner,description.player,description.hand,tiebreaker,description.tiebreaker);
                if (verdict == 0) {
                    if (tiePool.length == 0) {
                        tiePool.push(winner);
                        tiePool.push(description.player);
                    } else {
                        tiePool.push(description.player);
                    }
                } else if (verdict == -1) { // update the winner
                    winner = description.player; 
                    hand_description = description.hand;
                    tiebreaker = description.tiebreaker;
                }
            }
        }
    }
    return {"winner" : (tiePool.length == 0) ? winner : tiePool, "hand" : hand_description, "tie" : (tiePool.length != 0)};

}
/** On Message Handler For This Thread
 * 
 * Prints out the state of the current iteration of the game
 * */
onmessage = function(e) {
    try {
        if (e.data.op == "SetHand") {
            map[e.data.player] = e.data.hand;
            return;
        }

        if (e.data.op == "GetWinner") {
            board = flop.slice();
            board.push(turn);
            board.push(river);
            board = board.map(function(e) {
                return e.split("_");
            });
            this.postMessage({"info" : getWinner(), "pot" : e.data.pot});
            return;
        }

        if (e.data.op == "setFlop") {
            flop = e.data.flop;
            console.log("Flop");
            console.log(flop);
            console.log("\n")
            return;
        }

        if (e.data.op == "setTurn") {
            turn = e.data.turn;
            console.log("Turn");
            console.log(turn);
            console.log("\n")
            return;
        }

        if (e.data.op == "setRiver") {
            river = e.data.river;
            console.log("River");
            console.log(river);
            console.log("\n")
            return;
        }
    } catch (err) {
        console.log("Bug in matcher.js");
        console.log(err);
    }
}
