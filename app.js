var express = require('express');
var app = module.exports = express.createServer();

var config = require('./config.js')(app, express);

require('./routes')(app);

app.listen(process.env.PORT || 3000);
