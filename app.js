var express = require('express');
var app = module.exports = express.createServer();

var config = require('./config.js')(app, express);

var mongoose = require('mongoose');
var repo_model = require('./models/repo');

var db_uri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URI || process.env.MONGODB_URI || "mongodb://localhost/geogitviz";
mongoose.connect(db_uri);
var models = {};
models.repos = repo_model(mongoose);

require('./routes')(app, models);

app.listen(process.env.PORT || 80);
