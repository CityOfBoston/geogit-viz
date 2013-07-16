module.exports = function(app){

  var request = require('request');
  var libxml = require('libxmljs');
  var fs = require('fs');
  var xml2js = require('xml2js');

  app.get('/', function(req, res){
    res.redirect('/permits');
  });

  app.get('/permits', function(req, res){
    res.render('map', {
      port: 8080
    });
  });
  
  app.get('/projects', function(req, res){
    res.render('map', {
      port: 8081
    });
  });
  
  app.get('/featuredetails', function(req, res){
    var path = req.query.path;
    var gitid = req.query.gitid;
    var requestOptions = {
      'uri': req.query.url + ':' + req.query.port + '/geogit/repo/objects/' + gitid
    };
    request(requestOptions, function (err, response, b) {
      var details = b.split('|');
      var attributes = {};
      for(var a=0;a<details.length;a++){
        attributes[ details[a].split(":")[0] ] = details[a].split(":")[1];
      }
      res.json({
        gitid: gitid,
        path: path,
        attributes: attributes
      });
    });
  });
  
  app.get('/update_dev_projects', function(req, res){
    var requestOptions = {
      'uri': 'http://140.241.251.224/BRAWebServices/Article80.asmx/GetProjects'
    };
    request(requestOptions, function (err, response, body) {
      // parse XML
      xml2js.parseString(body, function(err, result){
        if(err){
          return res.json( err );
        }

        var osmdoc = new libxml.Document().node('osm').attr({
          version: "0.6",
          generator: "geogit-viz"
        });
        for(var i=0;i<result.items.item.length;i++){
          var item = result.items.item[i];
          var project = osmdoc.node('node').attr({
            id: item.projectid[0],
            lat: item.lat[0] * 1.0,
            lon: item.lon[0] * 1.0,
            user: 'mapmeld',
            uid: '0',
            visible: 'true',
            version: '1',
            changeset: '1',
            timestamp: '2008-09-21T00:00:00Z'
          });
          for(key in item){
            if(key == "lat" || key == "lon" || key == "x" || key == "y" || key == "icon" || key == "projectmanager" || key == "managersemail" || key == "managersphone" || key == "managersextension" || key == "email" || key == "projectid" || key == "phone"){
              continue;
            }
            project.node('tag').attr({
              k: key,
              v: item[key][0]
            });
          }
        }
        fs.writeFile('devlocations.osm', osmdoc.toString(), function(err){
          if(err){
            res.json( err );
          }
          else{
            res.send('File done!');
          }
        });
      });
    });
  });
  
  app.get('/update_from_gis', function(req, res){
    var requestOptions = {
      'uri': 'http://maps.cityofboston.gov/ArcGIS/rest/services/Permitting/Permits/MapServer/0/query?text=&geometry=&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&objectIds=&where=1%3D1&time=&returnCountOnly=false&returnIdsOnly=false&returnGeometry=true&maxAllowableOffset=&outSR=4326&outFields=*&f=pjson'
    };
    request(requestOptions, function (err, response, b) {
      var esriJSON = JSON.parse( b );
      var points = esriJSON.features;
      var osmdoc = new libxml.Document().node('osm').attr({
        version: "0.6",
        generator: "geogit-viz"
      });
      for(var pt=0;pt<points.length;pt++){
        var permit = osmdoc.node('node').attr({
          id: points[pt].attributes.APBLDGKEY, // I think this is a unique key
          lat: points[pt].geometry.y,
          lon: points[pt].geometry.x,
          user: 'mapmeld',
          uid: '0',
          visible: 'true',
          version: '1',
          changeset: '1',
          timestamp: '2008-09-21T00:00:00Z'
        });
        for(key in points[pt].attributes){
          if(key == "APBLDGKEY" || key == "GPSY" || key == "GPSX"){
            continue;
          }
          permit.node('tag').attr({
            k: key,
            v: points[pt].attributes[key]
          });
        }
      }
      //res.setHeader('Content-Type', 'text/xml');
      //res.send( osmdoc.toString() );
      fs.writeFile('osmout.osm', osmdoc.toString(), function(err){
        if(err){
          res.json( err );
        }
        else{
          res.send('File done!');
        }
      });
    });
  });
  
};