// A collection of general functions necessary for poker

var generateDeck = function () { // deck that generates a deck
    var acc = [];
    suits = ["hearts_", "spades_", "diams_", "clubs_"];
    for (var i = 0; i < 4; i++) {
        for (var j = 2; j < 12; j++) {
            if (j == 10) {
                acc.push(suits[i] + j);
                acc.push(suits[i] + "J");
                acc.push(suits[i] + "Q");
                acc.push(suits[i] + "K");
            } else if (j == 11) {
                acc.push(suits[i] + "A");
            } else {
                acc.push(suits[i] + j);
            }
        }
    }
    return acc;
}

var shuffle = function() { // will shuffle and return a deck of cards
    var shuffle_helper = function (array) {
        var currentIndex = array.length, temporaryValue, randomIndex;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }
    return shuffle_helper(generateDeck());
};

module.exports = {
  shuffle: shuffle // shuffle function
};
