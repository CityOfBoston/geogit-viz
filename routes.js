module.exports = function(app, models){

  var request = require('request');
  var libxml = require('libxmljs');
  var fs = require('fs');
  var xml2js = require('xml2js');

  app.get('/', function(req, res){
    res.render('index');
  });

  app.get('/repos', function(req, res){
    models.repos.find({}).exec(function(err, repos){
      if(err){
        return res.send( err );
      }
      res.json( repos );
    });
  });
  
  app.post('/addrepo', function(req, res){
    // currently allowing only one per user
    var user = req.body.user.toLowerCase();
    var project = req.body.project.toLowerCase();
    var acceptChars = [ "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "_", "-" ];
    for(var c = 0; c < user.length; c++){
      if( acceptChars.indexOf(user[c]) == -1 ){
        user = user.substring(0, c);
      }
    }
    for(var c = 0; c < project.length; c++){
      if( acceptChars.indexOf(project[c]) == -1 ){
        project = project.substring(0, c);
      }
    }
    
    models.repos.findOne({ user: user }).exec(function(err, repo){
      if(err){
        return res.json(err);
      }
      if(repo && user != "mapmeld"){
        return res.json({ error: "GitHub user already has a repo" });
      }
      var count = 2000 + Math.floor(Math.random() * 5000);
      var exec = require('child_process').exec;
      exec("( mkdir ../github/" + user + " ; mkdir ../github/" + user + "/" + project + "; cp *fromgithub.py ../github/" + user + "/" + project + "/ )", function(err, stdout, stderr){        
        console.log("on port " + count);

        exec("( cd ../github/" + user + "/" + project + "; python3 generatefromgithub.py )", function(err, stdout, stderr){
          console.log("ran generate script");
          res.redirect("/git/" + count);

          exec("cd ../GeoGit/src/parent; mvn jetty:run -pl ../web/app -f pom.xml -Dorg.geogit.web.repository=/root/github/" + user + "/" + project + " -Djetty.port=" + count  + " & ", function(err, stdout, stderr){
            console.log("started a server");
            var repo = new models.repos();
            repo.user = user;
            repo.project = project;
            repo.src = "GitHub";
            repo.port = count;
            repo.save(function(err){
              console.log(" saved ");
              //return res.json( { success: "added", port: (2000 + count) } );
            });
          });
        });
      });
    });
  });

  app.get('/api', function(req, res){
    res.render('api');
  });
  
  app.get('/github', function(req, res){
    res.render('github');
  });

  app.get('/permits', function(req, res){
    res.render('map', {
      port: 8080,
      source: "http://boston.maps.arcgis.com/home/webmap/viewer.html?webmap=e36ac8b9b60542b4b834cba686fb8823",
      sourceName: "City of Boston"
    });
  });
  
  app.get('/projects', function(req, res){
    res.render('map', {
      port: 8081,
      source: "http://gis.cityofboston.gov/Article80_dev/",
      sourceName: "Boston Redevelopment Authority"
    });
  });

  app.get('/git/:port', function(req, res){
    res.render('map', {
      port: req.params.port * 1,
      source: "https://github.com",
      sourceName: "GitHub"
    });
  });
  app.get('/refresh/:port', function(req, res){
    exec("ps aux", function(err, stdout, stderr){
      var tasks = stdout.split('\n');
      var targettask;
      for(var t=0;t<tasks.length;t++){
        if(tasks[t].indexOf("jetty:run") > -1){
          // this is a server task
          var port = tasks[t].split('port=')[1];
          var tasknum = tasks[t].split("root")[1];
          if(port == req.params.port){
            targettask = tasknum;
            break;
          }
        }
      }
      if(targettask){
        models.repos.findOne({ port: req.params.port }).exec(function(err, repo){
          if(err){
            return res.json({ error: err });
          }
          var exec = require('child_process').exec;
          exec("kill -9 " + targettask, function(err, stdout, stderr){
            exec("(cd ../github/" + repo.user + "/" + repo.project + "/ ; python3 updatefromgithub.py)", function(err, stdout, stderr){
              exec("cd ../GeoGit/src/parent ; mvn jetty:run -pl ../web/app -f pom.xml -Dorg.geogit.web.repository=/root/github/" + repo.user + "/" + repo.project + "/ -Djetty.port=" + repo.port + " &", function(err, stdout, stderr){
                return res.json({ success: "updated", port: repo.port });
              });
            });
          });
        });
      }
      else{
        res.json({ error: 'no matching task' });
      }
    });
  });

  app.get('/gitimport', function(req, res){
    res.render('map', {
      port: 8082,
      source: "https://github.com/benbalter/dc-wifi-social",
      sourceName: "Ben Balter, GitHub"
    });
  });

  app.get('/osm', function(req, res){
    res.render('map', {
      port: 8084,
      source: 'OpenStreetMap',
      sourceName: 'OpenStreetMap'
    });
  });

  app.get('/divvy', function(req, res){
    res.render('map', {
      port: 8083,
      source: "https://github.com/stevevance/divvy-statuses",
      sourceName: "Divvy Bikes"
    });
  });

  app.get('/fresh', function(req, res){
    var exec = require('child_process').exec;
    exec("ps aux", function(err, stdout, stderr){
      var tasks = stdout.split('\n');
      var server_tasks = [ ];
      //return res.send( tasks );
      res.write('found task list');
      for(var t=0;t<tasks.length;t++){
        if(tasks[t].indexOf("jetty:run") > -1){
          // this is a server task
          var port = tasks[t].split('port=')[1];
          var tasknum = tasks[t].split("root")[1];
          while(tasknum[0] == " "){
            tasknum = tasknum.substring(1);
          }
          for(var c=0;c<tasknum.length;c++){
            if(tasknum[c] == " "){
              tasknum = tasknum.substring(0, c);
              break;
            }
          }
          server_tasks.push( tasknum );
        }
      }
      // stop all GeoGit servers
      var phrase = "kill -9 ";
      if(!server_tasks.length){
        phrase = "ls";
      }
      exec(phrase + server_tasks.join(" "), function(err, stdout, stderr){
        res.write('stopped servers');
        // update all layers
        exec("(cd /root/bikes; python update*.py)", function(err, stdout, stderr){
          res.write('updated bikes');
          exec("(cd /root/permits; python update*.py)", function(err, stdout, stderr){
            res.write('updated permits');
            exec("(cd /root/projects; python update*.py)", function(err, stdout, stderr){
              res.write('updated projects');
              exec("(cd /root/GeoGit/src/parent; python runall.py)", function(err, stdout, stderr){
                res.end('restarted!');
              });
            });
          });
        });
      });
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
      if(err || !body || !body.length){
        return res.send('fail');
      }
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
      if(err || !b || !b.length){
        return res.send('fail');
      }
      var esriJSON;
      try{
        esriJSON = JSON.parse( b );
      }
      catch(e){
        return res.send('fail');
      }
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

  app.get('/:port/geogit/*', function(req, res){
    var requestOptions = {
      'uri': 'http://' + req.header('host') + ':' + req.params.port + "/" + req.originalUrl.split("/" + req.params.port + "/")[1]
    };
    request(requestOptions, function (err, response, b) {
      res.send( b );
    });

  });
  
};
