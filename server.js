var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var Worker = require('webworker-threads').Worker;
var List = require("./ListFn"); // List Module
var Poker = require("./poker");
var HoldEm = require("./hold_em_methods");
server.listen(process.env.PORT || 3000);
console.log('Server Running...');

app.use(express.static(__dirname));

app.get('/',function(req,res) {
	res.sendFile(__dirname + '/index.html');
});

var connected = {}; // (socket_id, socket object) pairings
var holdem_handler_1 = new Worker("holdem.js"); // thread that handles blackjack game 1
var current_holdem_players_1 = [] // current players for blackjack 1
var players_copy = [];
var check_holdem_1 = [] // check for current players in blackjack 1
var player_order = [] // maintains the order of the players
var tracking_thread; // thread that manages a game of hold em
var hold_em_1_deck;
var matching_thread; //thread that determines the winner of the game
holdem_handler_1.onmessage = function(e) { // message handler for blackjack game 1
	if (e.data.GameReady != null) {
		current_holdem_players_1 = e.data.GameReady;
		players_copy = e.data.GameReady;
		for (var i = 0; i < e.data.GameReady.length; i++) {
			connected[e.data.GameReady[i]].join("holdem_1");
		}
		io.to("holdem_1").emit("in_game_holdem_1", true); // Notify all in bj_1 that game is beginning
	}
}

io.on('connection', function(socket) { // socket logic
    console.log("Connection");
	connected[socket.id] = socket;

    // Disconnect Handler
    socket.on('disconnect', function() {
		console.log("Disconnection");
		holdem_handler_1.postMessage({"removal": socket.id});
		delete connected[socket.id];
		current_holdem_players_1.splice(current_holdem_players_1.indexOf(socket.id),1);
		check_holdem_1.splice(check_holdem_1.indexOf(socket.id),1);
		players_copy.splice(players_copy.indexOf(socket.id),1);
		socket.leave("holdem_1");
	});

	socket.on('holdem_entry', function(data) {
		holdem_handler_1.postMessage({"member" : data}); //notify handler that a client has joined lobby
	});

	socket.on('connected_holdem_1', function(data) { // make sure all players have changed to holdem gui
		check_holdem_1.push(data);
		if (List.isEqual(check_holdem_1.sort(), current_holdem_players_1.sort())) { // when everyone has connected
			io.to("holdem_1").emit("incoming_players_holdem_1", check_holdem_1.sort());
			current_holdem_players_1 = [];
			check_holdem_1 = [];
		}
	});

 	// Deck for Hold Em Game 1
	socket.on('players_done_holdem1', function(data) { // make sure all players have loaded the requisite information
		check_holdem_1.push(data);
		if (List.isEqual(check_holdem_1.sort(), players_copy.sort())) {
			player_order = check_holdem_1; // assign the order of the players
			hold_em_1_deck = Poker.shuffle(); //generate a shuffled deck
			matching_thread = new Worker("matcher.js"); // initialize matching thread
			matching_thread.onmessage = function(e) {
				console.log("Winner Determined")
				io.to("holdem_1").emit("payout", e.data);
			}
			for (var i = 0; i < player_order.length; i++) {
				var cards = HoldEm.deal(hold_em_1_deck);
				io.to(player_order[i]).emit("Hand", {cards: cards, player:i});
				matching_thread.postMessage({"op" :"SetHand", "hand" : cards, "player" : player_order[i]});
			}
			check_holdem_1 = []; // reset the checking array
		}
	});
	socket.on('start_round', function(data) {  // starts a new iteration of the current texas hold em round
		console.log(data + " Connected!");
		console.log("Starting Round");
		check_holdem_1.push(data);
		if (List.isEqual(check_holdem_1.sort(), players_copy.sort())) {
			check_holdem_1 = [];
			if (tracking_thread == undefined) {
				tracking_thread = new Worker("tracker.js");
				tracking_thread.onmessage = function(e) {
					if (e.data.op ==  "INC") {
						setTimeout(function() {io.to("holdem_1").emit("show_turn", {"player" : e.data.player, "bet": e.data.bet});}, 3000);
						return;
					}
					if (e.data.op == "RES") {
						//console.log("Resetting");
						if (e.data.transition) {
							if (e.data.state == "FLOP") {
								console.log("Showing Flop");
								var flop = HoldEm.generateFlop(hold_em_1_deck);
								matching_thread.postMessage({"op": "setFlop", "flop" : flop});
								setTimeout(function() {io.to("holdem_1").emit('show_flop', {"deck" : flop, "pot" : e.data.pot});}, 3000);
								return;
							}
							if (e.data.state == "TURN") {
								console.log("Showing Turn");
								var turn = HoldEm.generateCard(hold_em_1_deck);
								matching_thread.postMessage({"op" : "setTurn", "turn" : turn});
								setTimeout(function() {io.to("holdem_1").emit('show_t', {"deck" : turn, "pot" : e.data.pot});}, 3000);
								return;
							}
							if (e.data.state == "RIVER") {
								console.log("Showing River");
								var river = HoldEm.generateCard(hold_em_1_deck);
								matching_thread.postMessage({"op" : "setRiver", "river" : river});
								setTimeout(function() {io.to("holdem_1").emit('show_r', {"deck" : river, "pot" : e.data.pot});}, 3000);
								return;
							}
							console.log("Round Over");
							if (e.data.winner != undefined) {
								console.log("No Need For Matching")
								console.log("Winner: " + e.data.winner);
								return;
							}
							matching_thread.postMessage({"op" : "GetWinner", "pot" : e.data.pot});
							return;
						}
						tracking_thread.postMessage({"op" : "SetPlayers", "player_list": player_order});
						return;
					}
				}
			}
			tracking_thread.postMessage({"op" : "SetPlayers", "player_list": player_order}); // restart round, potentiall new players
		}
	});
	
	socket.on('next_turn', function(data) {
		check_holdem_1.push(socket.id);
		if (List.isEqual(check_holdem_1.sort(), players_copy.sort())) { // this ensures that all players have seen the current player's move
			check_holdem_1 = [];
			tracking_thread.postMessage({"op": "Increment", "bet" : data});
		}
	});

	socket.on("bet_clear_timer", function(data) {
		io.to("holdem_1").emit("bet_clear", data);
	});

	socket.on("check_clear_timer", function(data) {
		io.to("holdem_1").emit("check_clear", data);
	});

	socket.on("check_fold_timer", function(data) {
		io.to("holdem_1").emit("fold_clear", data);
	});

	socket.on("remove_player", function(data) {
		check_holdem_1.push(socket.id);
		if (List.isEqual(check_holdem_1.sort(), players_copy.sort())) {
			check_holdem_1 = [];
			tracking_thread.postMessage({"op" : "Remove", "player_to_remove" : data});
		}
	});

	socket.on("payout_done", function(data) {
		check_holdem_1.push(socket.id);
		if (List.isEqual(check_holdem_1.sort(), players_copy.sort())) {
			check_holdem_1 = [];
			console.log("\n");
			console.log("Starting Next Round");

			hold_em_1_deck = Poker.shuffle(); //generate a shuffled deck
			for (var i = 0; i < player_order.length; i++) {
				var cards = HoldEm.deal(hold_em_1_deck);
				io.to(player_order[i]).emit("Hand", {cards: cards, player:i});
				matching_thread.postMessage({"op" :"SetHand", "hand" : cards, "player" : player_order[i]});
			}
		}
	});
});
