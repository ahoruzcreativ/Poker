module.exports = {
  isEqual: function (l1, l2) { // Determine structural list equality
    if (l1.length != l2.length) {
        return false;
    }
    for (var i = 0; i < l1.length; i++) {
        if (l1[i] != l2[i]) {
            return false;
        }
    }
    return true;
  }
};
