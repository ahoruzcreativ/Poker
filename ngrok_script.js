// Generate a public url for localhost:3000
const ngrok = require('ngrok');
(async function() {
  const url = await ngrok.connect({proto: 'http', addr: 3000});
  console.log(url); // log the url
})();
