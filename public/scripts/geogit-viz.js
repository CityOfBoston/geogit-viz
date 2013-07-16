var knownFeatures = { };

var map = L.map('map').setView( [ 42.361207, -71.06506 ], 12 );
map.attributionControl.setPrefix('');

var myurl = "http:" + (window.location+"").split(":")[1];

// add an OpenStreetMap tile layer
L.tileLayer('http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg', {
    attribution: 'Tiles &copy; Stamen Design, Data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// wkt
var wktlayer = function(txt){
  var wkt = new Wkt.Wkt();
  wkt.read( txt );
  return wkt.toObject();
};

var mapfeature = function(feature){
  if(typeof feature.geometry != "undefined"){
    // adding geo
    var lyr = wktlayer( feature.geometry );
    var color = "#ccc";
    if(feature.change == "ADDED"){
      color = "#30aa30";
    }
    else if(feature.change == "MODIFIED"){
      color = "#00f";
    }
    else if(feature.change == "REMOVED"){
      color = "#ff0000";
    }
    if(typeof lyr.setStyle != "undefined"){
      // line or polygon
      lyr.setStyle({ color: color });
        //.bindPopup( makeTable( feature.attributes ) );
    }
    else{
      // change marker to circle
      lyr = new L.CircleMarker( lyr.getLatLng(), { color: color, opacity: 0.8, fillOpacity: 0.8 } );
        //.bindPopup( makeTable( feature.attributes ) );
    }
    knownFeatures[ feature.id ] = { geo: lyr };
    map.addLayer(lyr);
  }
  else{
//    if(typeof knownFeatures[ feature.newPath || feature.path || feature ] != "undefined"){

      if( feature.newObjectId == "0000000000000000000000000000000000000000"){
        // removed
        knownFeatures[ feature.newPath || feature.path || feature ].gitid = feature.oldObjectId;
      }
      else{
        // added or modified
        knownFeatures[ feature.newPath || feature.path || feature ].gitid = feature.newObjectId;
      }
//    }
    var fetchid = feature.newObjectId;
    if(fetchid == "0000000000000000000000000000000000000000"){
      fetchid = feature.oldObjectId;
    }
    $.getJSON("/featuredetails?port=" + port + "&url=" + encodeURIComponent(myurl) + "&path=" + encodeURIComponent(feature.newPath || feature.path) + "&gitid=" + fetchid, function(data){
      var table = '<table border="1">';
      for(key in data.attributes){
        var keyfix = key.split('^@^H^A');
        keyfix = keyfix[ keyfix.length - 1 ];
        if(keyfix.indexOf("DTTM") > -1){
          // datetime print
          data.attributes[key] = (new Date( data.attributes[key].split('mapmeld')[0] * 1 )).toUTCString();
        }
        table += '<tr><td><strong>' + keyfix + '</strong></td><td>' + data.attributes[key].split('mapmeld')[0] + '</td></tr>';
      }
      table += '</table>';
      try{
        knownFeatures[ data.path ].geo.bindPopup(table);
      }
      catch(e){
        console.error( data );
      }
    });
  }
};

var mapme = function(json){
  if(json.response.Feature.length){
    for(var f=0;f<json.response.Feature.length;f++){
      mapfeature( json.response.Feature[f] );
    }
  }
  else{
    mapfeature( json.response.Feature );
  }
  var s = document.createElement('script');
  s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&callback=maptoattr";
  s.type = "text/javascript";
  document.body.appendChild(s);
};

var maptoattr = function(json){
  if(json.response.diff.length){
    for(var f=0;f<json.response.diff.length;f++){
      mapfeature( json.response.diff[f] );
    }
  }
  else{
    mapfeature( json.response.diff );
  }
};

var from, to, total, diffs;

var logged = function(json){

  tree_root = json.response.commit[ json.response.commit.length-1 ].tree;

  // call for features
  var s = document.createElement('script');
  s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme";
  s.type = "text/javascript";
  document.body.appendChild(s);

  diffs = [ ];

  var commit_table = document.createElement('table');
  document.getElementById("commitlist").appendChild(commit_table);

  for(var c=0;c<json.response.commit.length;c++){
    diffs.push( json.response.commit[c].id );
  
    var tr = document.createElement("tr");
    tr.className = "commit";
    var mydate = (new Date(json.response.commit[c].committer.timestamp)).toUTCString();
    var fromRadio = '<input id="from' + c + '" name="from" type="radio" onchange="setFrom(' + c + ')"/>';
    if(c == json.response.commit.length-1){
      fromRadio = '<input id="from' + c + '" name="from" type="radio" checked="true" onchange="setFrom(' + c + ')"/>'
    }
    from = json.response.commit.length - 1;
    total = from;
    
    var toRadio = '<input id="to' + c + '" name="todiff" type="radio" onchange="setTo(' + c + ')"/>';
    if(c === 0){
      toRadio = '<input id="to' + c + '" name="todiff" type="radio" checked="true" onchange="setTo(' + c + ')"/>'
    }
    to = 0;
    
    tr.innerHTML = '<td>' + fromRadio + '</td><td>' + toRadio + '</td><td>' + mydate + '</td>';
    commit_table.appendChild(tr);
  }
};

var setFrom = function(i){
  from = i;
  for(var c=0;c<=total;c++){
    if(c <= i){
      document.getElementById("to" + c).style.visibility = "visible";
    }
    else{
      document.getElementById("to" + c).style.visibility = "hidden";
    }
  }
  updateDiff();
};
var setTo = function(i){
  to = i;
  for(var c=0;c<=total;c++){
    if(c >= i){
      document.getElementById("from" + c).style.visibility = "visible";
    }
    else{
      document.getElementById("from" + c).style.visibility = "hidden";
    }
  }
  updateDiff();
};

var updateDiff = function(){
  for(feature in knownFeatures){
    if(knownFeatures[ feature ]){
      map.removeLayer(knownFeatures[ feature ].geo);
      //knownFeatures[ feature ] = null;
    }
  }
  if(from == to){
    return;
  }
  var s = document.createElement('script');
  s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + diffs[from] + "&newRefSpec=" + diffs[to] + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme";
  s.type = "text/javascript";
  document.body.appendChild(s);
}

// call for commit log
var s = document.createElement('script');
s.src = myurl + ":" + port + "/geogit/log?output_format=json&callback=logged";
s.type = "text/javascript";
document.body.appendChild(s);
