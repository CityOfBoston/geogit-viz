module.exports = function(app, models){

  var request = require('request');
  var libxml = require('libxmljs');
  var fs = require('fs');
  var xml2js = require('xml2js');
  var exec = require('child_process').exec;

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
  
  app.get('/osm', function(req, res){
    res.redirect('http://162.209.88.82/osm');
    //res.render('makeosm');
  });
  
  app.get('/push', function(req, res){
    res.render('localrepo');
  });
  
  app.get('/draw', function(req, res){
    res.render('draw', {
      geojson: "",
      port: 0,
      coords: ""
    });
  });
  app.get('/drawn/:port', function(req, res){
    // quick function to get stored JSON for commits
    models.repos.findOne({ port: 1 * req.params.port }).exec(function(err, repo){
      if(req.query.version == "2"){
        res.send( repo.json.replace('"type": "FeatureCollection"', '"type": "FeatureCollection", "commit": "' + (repo.commit || "draw commit") + '"' ) );      
      }
      else{
        res.send( repo.json );
      }
    });
  });
  app.post('/draw', function(req, res){
    if(req.body.port){
      // updating existing
      models.repos.findOne({ port: 1 * req.body.port }).exec(function(err, repo){
        if(repo && repo.src == "draw"){
          repo.json = req.body.json;
          repo.commit = req.body.commit || "draw commit";
          repo.save(function(err){
            res.redirect('/draw/' + repo.port);
            exec("ps aux", function(err, stdout, stderr){
              var tasks = stdout.split('\n');
              var targettask;
              for(var t=0;t<tasks.length;t++){
                if(tasks[t].indexOf("jetty:run") > -1){
                  // this is a server task
                  var port = tasks[t].split('port=')[1];
                  var tasknum = tasks[t].split("root")[1];
                  if(port == req.body.port){
                    targettask = tasknum;
                    break;
                  }
                }
              }
              var command = "kill -9 ";
              if(!targettask){
                command = "ls ";
                targettask = "";
              }
              exec(command + targettask, function(err, stdout, stderr){
                exec("(cd ../drawn/" + repo.port + "/; python3 updatefromdrawn.py )", function(err, stdout, stderr){
                  exec("mvn jetty:run -pl ../web/app -f /root/GeoGit/src/parent/pom.xml -Dorg.geogit.web.repository=/root/drawn/" + repo.port + " -Djetty.port=" + repo.port, null);
                });
              });
            });
          });
        }
        else{
          res.json({ error: "not drawn repo" });
        }
      });
      return;
    }
    // no port provided - requesting new repo
    models.repos.find({}).sort('-port').limit(1).exec(function(err, lasts){
      var last = lasts[0];
      if(!last || !last.port || isNaN(last.port * 1)){
        last = { port: 2001 };
      }
      var count = (last.port * 1) + 1;
      var repo = new models.repos();
      repo.port = count;
      repo.src = "draw";
      repo.json = req.body.json;
      repo.commit = req.body.commit || "draw commit";
      repo.coords = req.body.coords.split(",");
      repo.save(function(err){
        res.redirect('/draw/' + repo.port );
        // create a directory
        exec("mkdir ../drawn/" + repo.port + " ; cp repo_scripts/*fromdrawn.py ../drawn/" + repo.port + "/", function(err, stdout, stderr){
          exec("(cd ../drawn/" + repo.port + "/; python3 initfromdrawn.py )", function(err, stdout, stderr){
            exec("mvn jetty:run -pl ../web/app -f /root/GeoGit/src/parent/pom.xml -Dorg.geogit.web.repository=/root/drawn/" + repo.port + " -Djetty.port=" + repo.port, null);
          });
        });
      });
    });
  });
  app.get('/draw/:port', function(req, res){
    models.repos.findOne({ port: 1 * req.params.port }).exec(function(err, repo){
      if(err){
        return res.send(err);
      }
      res.render('draw', {
        geojson: repo.json,
        port: repo.port,
        coords: repo.coords
      });
    });
  });
  
  app.post('/addrepo', function(req, res){
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
    var suffix = Math.floor( Math.random() * 900 ) + 100;
    if(req.body.repotype){
      // create an empty repo for pushing
      models.repos.find({}).sort('-port').limit(1).exec(function(err, lasts){
        var last = lasts[0];
        if(!last || !last.port || isNaN(last.port * 1)){
          last = { port: 2001 };
        }
        var count = (last.port * 1) + 1;

        var repo = new models.repos();
        repo.user = user;
        repo.project = project;
        repo.suffix = suffix;
        repo.port = count;

        if(req.body.repotype == "empty"){
          repo.src = "user";
          repo.save(function(err){
            res.redirect("/wait/" + count + "?source=" + repo.src);

            exec("mkdir ../empty/" + user + " ; mkdir ../empty/" + user + "/" + project + "" + suffix + "; cp repo_scripts/*fromrepo.py ../empty/" + user + "/" + project + "" + suffix + "/", function(err, stdout, stderr){
              exec("(cd ../empty/" + user + "/" + project + "" + suffix + "/; geogit init )", function(err, stdout, stderr){
                exec("mvn jetty:run -pl ../web/app -f /root/GeoGit/src/parent/pom.xml -Dorg.geogit.web.repository=/root/empty/" + user + "/" + project + "" + suffix + " -Djetty.port=" + count, null);
              });
            });
          });
        }
        else if(req.body.repotype == "osm"){
          repo.src = "osm";
          var south = req.body.south * 1.0;
          var west = req.body.west * 1.0;
          var north = req.body.north * 1.0;
          var east = req.body.east * 1.0;
          repo.coords = [ south, west, north, east ];
          repo.save(function(err){
            if(!north || !south || !east || !west || north < south || east < west){
              return res.json({ error: "bbox not defined" });
            }
            else{
              res.redirect("/wait/" + count + "?source=" + repo.src);
            }
            exec("mkdir ../makeosm/" + user + " ; mkdir ../makeosm/" + user + "/" + project + "" + suffix + "; cp repo_scripts/*fromosm.py ../makeosm/" + user + "/" + project + "" + suffix + "/", function(err, stdout, stderr){
              exec("(cd ../makeosm/" + user + "/" + project + "" + suffix + " ; python3 initfromosm.py " + south + " " + west + " " + north + " " + east + ' )', function(err, stdout, stderr){
                exec("mvn jetty:run -pl ../web/app -f /root/GeoGit/src/parent/pom.xml -Dorg.geogit.web.repository=/root/makeosm/" + user + "/" + project + "" + suffix + " -Djetty.port=" + count, null);
              });
            });
          });
        }
      });
      return;
    }
    
    models.repos.findOne({ user: user }).exec(function(err, repo){
      if(err){
        return res.json(err);
      }
      if(repo && user != "mapmeld"){
        return res.json({ error: "GitHub user already has a repo" });
      }
      
      models.repos.find({}).sort('-port').limit(1).exec(function(err, lasts){
        var last = lasts[0];
        if(!last || !last.port || isNaN(last.port * 1)){
          last = { port: 2001 };
        }
        var count = (last.port * 1) + 1;
        
        var repo = new models.repos();
        repo.user = user;
        repo.project = project;
        repo.suffix = suffix;
        repo.src = "GitHub";
        repo.port = count;
        repo.save(function(err){
          //return res.json( { success: "added", port: (2000 + count) } );
          res.redirect("/wait/" + count + "?source=" + repo.src);

          exec("mkdir ../github/" + user + " ; mkdir ../github/" + user + "/" + project + "" + suffix +  "; cp repo_scripts/*fromgithub.py ../github/" + user + "/" + project + "" + suffix + "/", function(err, stdout, stderr){
            exec("( cd ../github/" + user + "/" + project + "" + suffix + "; python3 generatefromgithub.py )", function(err, stdout, stderr){
              exec("mvn jetty:run -pl ../web/app -f /root/GeoGit/src/parent/pom.xml -Dorg.geogit.web.repository=/root/github/" + user + "/" + project + "" + suffix + " -Djetty.port=" + count, null);
            });
          });
        });
      });
    });
  });
  
  app.get('/wait/:port', function(req, res){
    res.render('wait', { port: req.params.port, source: req.query.source });
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
      source: "http://boston.maps.arcgis.com/home/webmap/viewer.html?webmap=e36ac8b9b60542b4b834cba686fb8823"
    });
  });
  
  app.get('/projects', function(req, res){
    res.render('map', {
      port: 8081,
      source: "http://gis.cityofboston.gov/Article80_dev/"
    });
  });
  
  app.get('/start_repo_list', function(req, res){
    models.repos.find({}).exec(function(err, repos){
      if(err){
        return res.send(err);
      }
      var timeOffset = 10000; // delay for first server to start
      var runRepo = function(r){
        if(!repos.length || r>=repos.length){
          return res.send('done');
        }
        var repo = repos[r];
        var repotype = "github";
        if(repo.src == "user"){
          repotype = "empty";
        }
        if(repo.src == "osm"){
          repotype = "makeosm";
        }
        if(repo.src == "draw"){
          repotype = "drawn";
          repo.user = repo.port;
          repo.project = '.';
          repo.suffix = "";
        }
        var directoryCheck;
        try{
          directoryCheck = fs.lstatSync("/root/" + repotype + "/" + repo.user + "/" + repo.project + "" + repo.suffix);
          directoryCheck = directoryCheck.isDirectory();
        }
        catch(e){
          directoryCheck = false;
        }
        if(directoryCheck){
          //console.log("refresh " + repo.port);
          req.params.port = repo.port;
          refreshPort( req, res );
        }
        else{
          //console.log("delete " + repo.port);
          repo.remove();
        }
        setTimeout(function(){
          runRepo(r+1);
        }, timeOffset);
        if(timeOffset > 3500){
          timeOffset = 3500;
        }
      };
      runRepo(0);
    });
  });
  app.get('/clear_repo_list', function(req, res){
    models.repos.find({}).remove();
    res.send('done');
  });

  app.get('/map/:port', function(req, res){
    models.repos.findOne({ port: 1 * req.params.port }).exec(function(err, repo){
      if(err){
        return res.send(err);
      }
      if(!repo){
        return res.render('current', {
          port: req.params.port,
          source: "Uninitialized",
          user: "",
          project: ""
        });
      }
      if(!repo.coords || !repo.coords.length){
        repo.coords = [ ];
      }
      res.render('current', {
        port: repo.port,
        source: repo.src,
        user: repo.user,
        project: repo.project,
        coords: repo.coords.join(",")
      });
    });
  });

  app.get('/git/:port', function(req, res){
    models.repos.findOne({ port: 1 * req.params.port }).exec(function(err, repo){
      if(err){
        return res.send(err);
      }
      if(!repo){
        return res.render('map', {
          port: req.params.port,
          source: "Uninitialized",
          user: "",
          project: ""
        });
      }
      if(!repo.coords || !repo.coords.length){
        repo.coords = [ ];
      }
      res.render('map', {
        port: repo.port,
        source: repo.src,
        user: repo.user,
        project: repo.project,
        coords: repo.coords.join(",")
      });
    });
  });
  app.get('/refresh/:port', function(req, res){  
    refreshPort(req, res);
    res.json({ success: "update started" });
  });
  
  function refreshPort(req, res){
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
      var command = "kill -9";
      if(!targettask){
        command = "ls";
        targettask = "";
      }
      models.repos.findOne({ port: req.params.port }).exec(function(err, repo){
        if(err){
          return; // res.json({ error: err });
        }
        //res.json({ success: "update started" });
        exec(command + " " + targettask, function(err, stdout, stderr){
          var repotype = "github";
          if(repo.src == "user"){
            repotype = "empty";
          }
          if(repo.src == "osm"){
            repotype = "makeosm";
          }
          if(repo.src == "draw"){
            repotype = "drawn";
            repo.user = repo.port;
            repo.project = ".";
            repo.suffix = "";
          }
          exec("(cd ../" + repotype + "/" + repo.user + "/" + repo.project + "" + repo.suffix + "/ ; python3 update*.py)", function(err, stdout, stderr){
            exec("(cd ../GeoGit/src/parent ; mvn jetty:run -pl ../web/app -f pom.xml -Dorg.geogit.web.repository=/root/" + repotype + "/" + repo.user + "/" + repo.project + "" + repo.suffix + " -Djetty.port=" + repo.port + ")", null);
          });
        });
      });
    });
  }

  app.get('/gitimport', function(req, res){
    res.render('map', {
      port: 8082,
      source: "GitHub",
      user: "benbalter",
      project: "dc-wifi-social"
    });
  });

  app.get('/osm_sudan', function(req, res){
    res.render('map', {
      port: 8084,
      source: 'osm',
      user: 'OpenStreetMap',
      project: 'Sudan'
    });
  });

  app.get('/divvy', function(req, res){
    res.render('map', {
      port: 8083,
      source: "GitHub",
      user: "stevevance",
      project: "divvy-statuses"
    });
  });

  app.get('/fresh', function(req, res){
    exec("ps aux", function(err, stdout, stderr){
      var tasks = stdout.split('\n');
      var server_tasks = [ ];
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
        // update all layers
        exec("(cd /root/bikes; python update*.py)", function(err, stdout, stderr){
          exec("(cd /root/permits; python update*.py)", function(err, stdout, stderr){
            exec("(cd /root/projects; python update*.py)", function(err, stdout, stderr){
              exec("(cd /root/osm; python update*.py)", function(err, stdout, stderr){
                exec("(cd /root/GeoGit/src/parent; python runall.py)", null);
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
        if(!esriJSON.features || !esriJSON.features.length){
          return res.send('fail');
        }
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
