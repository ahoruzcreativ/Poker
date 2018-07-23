var deal = function(deck) {
    //console.log("Deck: " + deck);
    var card_1 = deck[Math.floor((Math.random()*(deck.length-1)))];
    //console.log("Card 1: " + card_1);
    //console.log("Card 1 Index: " + deck.indexOf(card_1));
    deck.splice(deck.indexOf(card_1),1);
    var card_2 = deck[Math.floor((Math.random()*(deck.length-1)))];
    //console.log("Card 2: " + card_2);
    //console.log("Card 2 Index: " + deck.indexOf(card_2));
    deck.splice(deck.indexOf(card_2),1);
    //console.log("Deck Length: " + deck.length + "\n");
    return [card_1, card_2];

}

var generateFlop = function(deck) {
    var card_1 = deck[Math.floor((Math.random()*(deck.length-1)))];
    deck.splice(deck.indexOf(card_1),1);
    var card_2 = deck[Math.floor((Math.random()*(deck.length-1)))];
    deck.splice(deck.indexOf(card_2),1);
    var card_3 = deck[Math.floor((Math.random()*(deck.length-1)))];
    deck.splice(deck.indexOf(card_3),1);
    return [card_1, card_2, card_3];
}

var generateCard = function(deck) {
    var card = deck[Math.floor((Math.random()*(deck.length-1)))];
    deck.splice(deck.indexOf(card),1);
    return card;
}
module.exports = {
  deal: deal, // shuffle function
  generateFlop: generateFlop, // generate flop function
  generateCard: generateCard //generate turn
};
