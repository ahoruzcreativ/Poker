// Code for handling in game logic on the client side

var socket = io.connect(); //socket connection
var in_game = false;
var player_id;
var current_turn; // the current player whose turn must be displayed
var my_turn = false;
var transition_timer;
var current_turn_int;
var player_id;
var id_to_turn = {}; // mapping of socket id to player turn
// When User Chooses To Play Hold'Em
$("#HoldEm").click(function() {
    if (in_game == false) { // make sure that the same person does not enter the queue twice
        socket.emit("holdem_entry", socket.id);
        in_game = true;
    }
});

// Uses has entered a game
socket.on("in_game_holdem_1", function(data) {
    $("#GameSelectionScreen").hide();
    $("#HoldEmGUI").show();
    socket.emit("connected_holdem_1", socket.id);
});

socket.on("incoming_players_holdem_1", function(data) {
    for (var i = 0; i < data.length; i++) {
        id_to_turn[data[i]] = i; // intialize mapping
        $("#p" + i).append("<p " + "id =" + i + "_balance "
        + "class = 'player_balance'> " + "$500" + "</p>");
        $("#p" + i).append("<p " + "id = " + i + "_id>" + data[i] + "</p>");
        //$("#p" + i).text(data[i]);
    }
    socket.emit("players_done_holdem1", socket.id);
});

socket.on("Hand", function(data) {
    //console.log(data.cards[0] + " , " + data.cards[1]);
    player_id = data.player;
    var tag_0 = "#p" + data.player + "_cards_0";
    var tag_1 = "#p" + data.player + "_cards_1";
    var containerTag = "#p" + data.player + "_cards";
    var card_0 = data.cards[0].split("_"); //first card
    var card_1 = data.cards[1].split("_");

    // append first card
    var color_0 = (card_0[0] == "hearts" || card_0[0] == "diams") ? "red" : "black"
    var color_1 = (card_1[0] == "hearts" || card_1[0] == "diams") ? "red" : "black"
    //<p class="card-text black">A</p>
    //<p class="card-img black">&clubs;
    //$(tag).append("<p " + "class=" + "card-text " + color_0 + ">" + card_0[1]+ "</p>");
    $(tag_0).empty(); // remove previous cards
    $(tag_1).empty(); // remove previous cards
    $(tag_0).append("<p " + "class=" + "'card-text " +
    color_0 + "'" + ">" + card_0[1] + "</p>");
    $(tag_0).append("<p class=" + "'card-img " + color_0 + "'" +
    ">&" + card_0[0] + ";</p>");

    $(tag_1).append("<p " + "class=" + "'card-text " +  color_1 + "'" + ">"
    + card_1[1] + "</p>");
    $(tag_1).append("<p class=" + "'card-img " + color_1 + "'" + ">&"
    + card_1[0] + ";</p>");
    $(containerTag).show();
    //$("#p1_cards").show();
    socket.emit('start_round', socket.id);
});

function transition(bet_value) {
    $(current_turn).css("background-color", "red");
    //console.log("Bet Value: " + bet_value);
    if (my_turn) {
        $("#bet_" + player_id).remove();
        $("#check_" + player_id).remove();
        $("#fold_" + player_id).remove();
        $("#bet").remove();
    }
    socket.emit('next_turn', bet_value);
}

function fold_transition(player_id) {
    $(current_turn).css("background-color", "red");
    if (my_turn) {
        $("#bet_" + player_id).remove();
        $("#check_" + player_id).remove();
        $("#fold_" + player_id).remove();
        $("#bet").remove();
    }
    socket.emit('remove_player', player_id);
}
socket.on('show_turn', function(data) {
    current_turn = "#p" + data.player;
    current_turn_int = data.player;
    $(current_turn).css("background-color", "gold");
    //console.log("Yellow");
    if (data.player == player_id) {
        my_turn = true;
        var balance = Number($("#" + player_id+ "_balance").text().trim().substring(1));
        var current_bet = Number($("#balance_" + player_id).text().trim().substring(1));
        //console.log("Current Bet: " + current_bet);
        $("#player_moves").append("<button id = 'bet_" + player_id + "'" + ">BET</button>");
        $("#player_moves").append("<button id = 'check_" + player_id + "'" + ">MIN</button>");
        $("#player_moves").append("<button id = 'fold_" + + player_id + "'" + ">FOLD</button>");
        $("#betting_slider_" + player_id).append("<input id = 'bet' type='range' min='1' max='2'>");
        $("#bet")[0].min = data.bet - current_bet;
        // the amount more a person has to contribute to at least check
        $("#bet")[0].max = balance;
        $("#bet").val($("#bet")[0].min);
        var temp = current_bet + Number($("#bet").val());
        $("#balance_" + player_id).text("$" + temp);
        $("#balance_" + player_id).css("font-weight", "Bold");
        if ($("#bet")[0].min == 0) {
            $("#balance_" + player_id).text("");
        }
        $("#bet").on("input change", function() {
            var bet_val = current_bet + Number($("#bet").val());
            if (bet_val == 0) {
                $("#balance_" + player_id).text("");
            } else {
                $("#balance_" + player_id).text("$" + bet_val);
                $("#balance_" + player_id).css("font-weight", "Bold");
            }
        });
    }
    transition_timer = setTimeout(function() {fold_transition(current_turn_int);},10000);
    $("#bet_" + player_id).click(function() { // set up betting logic
        //console.log("Updating Everyone Else!");
        if (Number($("#bet").val()) > $("#bet")[0].min) {
            socket.emit("bet_clear_timer", {"value" : Number($("#balance_" + player_id).text().trim().substring(1)), "increase" : Number($("#bet").val())});
        }
    });

    $("#check_" + player_id).click(function() {
        socket.emit("check_clear_timer", {"value" : data.bet, "increase" : $("#bet")[0].min});
    });

    $("#fold_" + player_id).click(function() {
        socket.emit("check_fold_timer", player_id);
    });
});

socket.on('show_flop', function(data) {
    $(".balance_label").text(""); // Reset all previous bets
    $("#total_pot").text(data.pot);
    $("#total_pot").css("font-weight", "Bold");
    for (var i = 0; i < data.deck.length; i++) {
        var card = data.deck[i].split("_");
        var color = (card[0] == "hearts" || card[0] == "diams") ? "red" : "black";
        $("#card_" + i).empty();
        $("#card_" + i).append("<p " + "class=" + "'card-text "
        +  color + "'" + ">" + card[1] + "</p>");
        $("#card_" + i).append("<p class=" + "'card-img "
        + color + "'" + ">&" + card[0] + ";</p>");
        $("#card_" + i).show();
    };
    var delay = function() {
        socket.emit("start_round", socket.id);
    }
    setTimeout(delay, 3000);
});

socket.on('show_t', function(data) {
    $(".balance_label").text(""); // Reset all previous bets
    $("#total_pot").text(data.pot);
    $("#total_pot").css("font-weight", "Bold");
    var card = data.deck.split("_");
    var color = (card[0] == "hearts" || card[0] == "diams") ? "red" : "black";
    $("#card_" + 3).empty();
    $("#card_" + 3).append("<p " + "class=" + "'card-text "
    +  color + "'" + ">" + card[1] + "</p>");
    $("#card_" + 3).append("<p class=" + "'card-img "
    + color + "'" + ">&" + card[0] + ";</p>");
    $("#card_" + 3).show();
    var delay = function() {
        socket.emit("start_round", socket.id);
    }
    setTimeout(delay, 3000);
});

socket.on('show_r', function(data) {
    $(".balance_label").text(""); // Reset all previous bets
    $("#total_pot").text(data.pot);
    $("#total_pot").css("font-weight", "Bold");
    var card = data.deck.split("_");
    var color = (card[0] == "hearts" || card[0] == "diams") ? "red" : "black";
    $("#card_" + 4).empty();
    $("#card_" + 4).append("<p " + "class=" + "'card-text "
    +  color + "'" + ">" + card[1] + "</p>");
    $("#card_" + 4).append("<p class=" + "'card-img "
    + color + "'" + ">&" + card[0] + ";</p>");
    $("#card_" + 4).show();
    var delay = function() {
        socket.emit("start_round", socket.id);
    }
    setTimeout(delay, 3000);
});

socket.on("bet_clear", function(data) {
    clearTimeout(transition_timer);
    //console.log($("#" + current_turn_int + "_balance").text().trim().substring(1));
    //console.log(data);
    var new_balance = Number($("#" + current_turn_int
    + "_balance").text().trim().substring(1)) - data.increase;
    $("#" + current_turn_int + "_balance").text("$" + new_balance);
    $("#" + current_turn_int + "_balance").css("font-weight", "Bold");
    $("#balance_" + current_turn_int).text("$" + data.value);
    $("#balance_" + current_turn_int).css("font-weight", "Bold");
    transition(data.value);
});

socket.on("check_clear", function(data) {
    clearTimeout(transition_timer);
    var new_balance = Number($("#" + current_turn_int
    + "_balance").text().trim().substring(1)) - data.increase;
    $("#" + current_turn_int + "_balance").text("$" + new_balance);
    $("#" + current_turn_int + "_balance").css("font-weight", "Bold");
    if (data.value == 0) {
        $("#balance_" + current_turn_int).text("");
    } else {
        $("#balance_" + current_turn_int).text("$" + data.value);
        $("#balance_" + current_turn_int).css("font-weight", "Bold");
    }
    transition(data.value);
});

socket.on("fold_clear", function(data) {
    clearTimeout(transition_timer);
    $("#balance_" + current_turn_int).text("");
    fold_transition(current_turn_int);
});

var resetGame = function() { //clears all cards on the board for next game
    var tag_0 = "#p" + player_id + "_cards_0";
    var tag_1 = "#p" + player_id + "_cards_1";
    $(tag_0).empty();
    $(tag_1).empty();
    $("#p" + player_id + "_cards").hide();
    $(".balance_label").text(""); // Reset all previous bets
    for (var i = 0; i < 5; i++) {
        $("#card_" + i).empty();
        $("#card_" + i).hide();
    }
    var containerTag = "#p" + player_id + "_cards";
    $(containerTag).hide();
}
socket.on("payout", function(data) { // pay out pot to the winners
    setTimeout(function() {
        $("#total_pot").text("");
        if (data.winner != undefined) {
            var turn = id_to_turn[data.winner];
            var new_balance = Number($("#" + turn + "_balance").text().trim().substring(1)) + data.pot;
            $("#" + turn + "_balance").text("$" + new_balance);
        }
        else if (data.info.tie) {
            var winnings = data.pot/data.info.winner.length; // split if more than one winner
            var winners = [];
            for (var i = 0; i < data.info.winner.length; i++) {
                var turn = id_to_turn[data.info.winner[i]];
                winners.push(turn);
                var new_balance = Number($("#" + turn + "_balance").text().trim().substring(1)) + winnings;
                $(turn + "_balance").text(new_balance);
            }
        } else {
            var turn = id_to_turn[data.info.winner];
            var new_balance = Number($("#" + turn + "_balance").text().trim().substring(1)) + data.pot;
            $("#" + turn + "_balance").text("$" + new_balance);
        }
        resetGame();
        socket.emit("payout_done");
    }, 3000);
    return;
});
