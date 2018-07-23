/***
The "bouncer" for texas hold_em games. It functions as a lobby
Searches for open rooms and assigns new players to those rooms
*/

var lobby = [];
var min_needed = 2;
var loading_game = false;
var in_game = false;
var start_game = false;
onmessage = function(e) {
    if (e.data.member != null) { // case where new member joins lobby
        lobby.push(e.data.member);
        //console.log("Lobby: " + lobby);
        if (lobby.length == min_needed) {
            postMessage({"GameReady": lobby}); // the set of sockets ready to be added to a new game
        }

    }
    if (e.data.removal != null) { // case where member must be removed
        //console.log("Removing Socket From Lobby: " + e.data.removal);
        lobby.splice(lobby.indexOf(e.data.removal), 1);
        //console.log("Lobby: " + lobby);
    }
}
