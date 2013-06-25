module.exports = function(app){

  var request = require('request');

  app.get('/', function(req, res){
    res.render('map', { });
  });
  
  app.get('/geocode', function(req, res){
    var requestOptions = {
      'uri': 'http://geocoder.us/service/csv/geocode?address=' + encodeURIComponent( req.query.address ),
    };
    request(requestOptions, function (err, response, b) {
      b = b.split(',');
      res.json({ x: b[1] * 1.0, y: b[0] * 1.0 });
    });
  });
  
};