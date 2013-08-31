var knownFeatures = { };

var map = L.map('map').setView( [ 42.361207, -71.06506 ], 12 );
map.attributionControl.setPrefix('');

var north = -90;
var south = 90;
var east = -180;
var west = 180;

var myurl = "http:" + (window.location+"").split(":")[1];
if(myurl.toLowerCase().indexOf("geoginger.com") > -1){
  myurl = "http://geoginger.com";
}
else if(myurl.toLowerCase().indexOf("162.209.56.237") > -1){
  myurl = "http://162.209.56.237";
}
else if(myurl.toLowerCase().indexOf("162.209.88.82") > -1){
  myurl = "http://162.209.88.82";
}

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tiles.mapbox.com/v3/mapmeld.map-ofpv1ci4/{z}/{x}/{y}.png', {
//http://tile.stamen.com/terrain/{z}/{x}/{y}.jpg', {
    attribution: 'Tiles &copy; MapBox, Data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
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
      var bounds = lyr.getBounds();
      var outofbounds = false;
      if(bounds.getNorthEast().lat < -90 || bounds.getNorthEast().lat > 90 || bounds.getNorthEast().lng > 180 || bounds.getNorthEast().lng < -180){
        outofbounds = true;
      }
      if(bounds.getSouthWest().lat < -90 || bounds.getSouthWest().lat > 90 || bounds.getSouthWest().lng > 180 || bounds.getSouthWest().lng < -180){
        outofbounds = true;
      }
      if(!outofbounds){
        north = Math.max(north, bounds.getNorthEast().lat);
        south = Math.min(south, bounds.getSouthWest().lat);
        east = Math.max(east, bounds.getNorthEast().lng);
        west = Math.min(west, bounds.getSouthWest().lng);
      }
    }
    else{
      // change marker to circle
      lyr = L.circleMarker( lyr.getLatLng(), { color: color, opacity: 0.8, fillOpacity: 0.8, radius: 5 } );

      if(lyr.getLatLng().lat < 90 && lyr.getLatLng().lat > -90 && lyr.getLatLng().lng > -180 && lyr.getLatLng().lng < 180){
        north = Math.max(north, lyr.getLatLng().lat);
        south = Math.min(south, lyr.getLatLng().lat);
        east = Math.max(east, lyr.getLatLng().lng);
        west = Math.min(west, lyr.getLatLng().lng);
      }
        //.bindPopup( makeTable( feature.attributes ) );
    }
    if(typeof knownFeatures[ feature.id ] != "undefined" && knownFeatures[ feature.id ] && typeof knownFeatures[feature.id].geo != "undefined" ){
      map.removeLayer( knownFeatures[ feature.id ].geo );
    }
    knownFeatures[ feature.id ] = { geo: lyr };
    map.addLayer(lyr);
  }
  else{
    if( feature.newObjectId == "0000000000000000000000000000000000000000"){
      // removed
      knownFeatures[ feature.newPath || feature.path || feature ].gitid = feature.oldObjectId;
    }
    else{
      // added or modified
      knownFeatures[ feature.newPath || feature.path || feature ].gitid = feature.newObjectId;
    }
    var fetchid = feature.newObjectId;
    if(fetchid == "0000000000000000000000000000000000000000"){
      fetchid = feature.oldObjectId;
    }
    addClickable( knownFeatures[ feature.newPath || feature.path || feature], port, (feature.newPath || feature.path || feature), fetchid );
  }
};

var addClickable = function(feature, port, rid, fetchid){
  feature.geo.on('click', function(e){
    if(typeof feature.table != "undefined"){
      var mypopup = L.popup()
        .setLatLng( e.latlng )
        .setContent( feature.table );
      map.openPopup(mypopup);
      return;
    }
    $.getJSON("/featuredetails?port=" + port + "&url=" + encodeURIComponent(myurl) + "&path=" + encodeURIComponent(rid) + "&gitid=" + fetchid, function(data){
      var table = '<table border="1">';
      if(typeof data.path != "undefined"){
        var id = data.path.split("/")[1];
        table += '<tr><td><strong>ID</strong></td><td>' + id + '</td></tr>';
      }
      for(key in data.attributes){
        if(data.attributes[key] == "0" || !data.attributes[key].length){
          continue;
        }
        var keyfix = key.split('^@^H^A');
        keyfix = keyfix[ keyfix.length - 1 ];
        keyfix = keyfix.split('�');
        keyfix = keyfix[ keyfix.length - 1 ];
        if(keyfix.indexOf("DTTM") > -1){
          // datetime print
          data.attributes[key] = (new Date( data.attributes[key].split('mapmeld')[0] * 1 )).toUTCString();
        }
        table += '<tr><td><strong>' + keyfix + '</strong></td><td>' + data.attributes[key].split('mapmeld')[0] + '</td></tr>';
      }
      table += '</table>';
      knownFeatures[ data.path ].table = table;
      var mypopup = L.popup()
        .setLatLng( e.latlng )
        .setContent( table );
      map.openPopup(mypopup);
    });
  });
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

  if(north > south){
    // fit all points
    map.fitBounds([ [south, west], [north, east] ]);
  }
  else if(north == south){
    // one point
    map.panTo( new L.LatLng( north, east ) );
  }

  var s = document.createElement('script');
  if(calledback){
    s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&callback=maptoattr&show=3000";
  }
  else{
    s.src = myurl + "/" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&callback=maptoattr&show=3000";
  }
  s.type = "text/javascript";
  $(document.body).append(s);

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
var makingTable = false;

var logged = function(json){
  if($("table").length || makingTable){
    return;
  }
  makingTable = true;
  
  if(typeof json == "undefined"){
    // repo is not initialized
    if(source.indexOf("http:") > -1){
      // ESRI or other set source
      $("#commitlist").text("No content available");
    }
    else if(source == "osm"){
      // OpenStreetMap
      $("#commitlist").text("OpenStreetMap repo may have failed. Please contact ndoiron@mapmeld.com");
    }
    else if(source == "GitHub"){
      // GitHub
      $("#commitlist").text("GitHub repo may have failed. Please contact ndoiron@mapmeld.com");
    }
    else if(source == "user"){
      // local repo
      $("#commitlist").text("GeoGit repo may have failed. Please contact ndoiron@mapmeld.com");
    }
    return;
  }
  else if(typeof json.response.success != "undefined" && typeof json.response.commit == "undefined"){
    // repo exists, but is empty
    if(source.indexOf("http:") > -1){
      // ESRI or other set source
      $("#commitlist").text("No content available");
    }
    else if(source == "osm"){
      // OpenStreetMap
      $("#commitlist").text("OpenStreetMap repo has no commits. Please contact ndoiron@mapmeld.com");
    }
    else if(source == "GitHub"){
      // GitHub
      $("#commitlist").text("GitHub repo has no commits. Does <a href='https://github.com/" + user + "/" + project + "'>your repo</a> contain GeoJSON data? Is the GeoJSON visible on GitHub? Please contact ndoiron@mapmeld.com for help.");
    }
    else if(source == "user"){
      // local repo
      $("#commitlist").text("GeoGinger is ready for your commits. Use 'geogit remote add gg http://geoginger.com:" + port + "' to connect to this repo, then 'geogit push gg' to push GeoGit commits.");
    }
    return;
  }
  else if(typeof json.response.commit.tree != "undefined"){
    // repo has only one commit
    if(source.indexOf("http:") > -1){
      // ESRI or other set source
      $("#commitlist").text("First commit succeeded! Publish changes to the data, then visit " + myurl + "/refresh/" + port);
    }
    else if(source == "osm"){
      // OpenStreetMap
      $("#commitlist").text("First commit succeeded! This site checks for updates to OpenStreetMap daily, or whenever you visit " + myurl + "/refresh/" + port);
    }
    else if(source == "GitHub"){
      // GitHub
      $("#commitlist").text("First commit succeeded! Push a change to your GeoJSON to GitHub, then visit " + myurl + "/refresh/" + port + " to update.");
    }
    else if(source == "user"){
      // local repo
      $("#commitlist").text("First commit succeeded! Make a change to your local GeoGit repo, then push to GeoGinger.");
    }
    return;
  }

  tree_root = json.response.commit[ json.response.commit.length-1 ].tree;

  // call for features
  var s = document.createElement('script');
  if(calledback){
    s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme&show=3000";
  }
  else{
    s.src = myurl + "/" + port + "/geogit/diff?oldRefSpec=" + tree_root + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme&show=3000";
  }
  s.type = "text/javascript";
  $(document.body).append(s);

  diffs = [ ];

  var commit_table = document.createElement('table');
  $("#commitlist")
    .append(commit_table)
    .css({ "max-height": $(document.body).height() + "px" });
  
  var tr = document.createElement('tr');
  tr.innerHTML = '<td><small>From</small></td><td><small>To</small></td><td><small>Commit</small></td>';
  commit_table.appendChild(tr);

  for(var c=0;c<json.response.commit.length;c++){
    diffs.push( json.response.commit[c].id );
  
    var tr = document.createElement("tr");
    tr.className = "commit";

    var mydate = json.response.commit[c].message || mydate;
    var usedDate = false;
    if(!mydate || mydate == "auto update" || mydate == "update from OSM.org" || mydate == "Updated OSM data"){
      usedDate = true;
      mydate = (new Date(json.response.commit[c].committer.timestamp)).toUTCString();
    }
    if((window.location + "").indexOf("label=dateonly") > -1){
      if(usedDate){
        mydate = (new Date(json.response.commit[c].committer.timestamp)).toDateString();
      }
      commit_table.style.fontSize = "8pt";
    }

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
      $("#to" + c).css({ visibility: "visible" });
    }
    else{
      $("#to" + c).css({ visibility: "hidden" });
    }
  }
  updateDiff();
};
var setTo = function(i){
  to = i;
  for(var c=0;c<=total;c++){
    if(c >= i){
      $("#from" + c).css({ visibility: "visible" });
    }
    else{
      $("#from" + c).css({ visibility: "hidden" });
    }
  }
  updateDiff();
};

var updateDiff = function(){
  for(var feature in knownFeatures){
    if(!knownFeatures[feature] || !knownFeatures[feature].geo){
      continue;
    }
    map.removeLayer(knownFeatures[ feature ].geo);
    knownFeatures[ feature ] = null;
  }
  if(from == to){
    return;
  }
  var s = document.createElement('script');
  if(calledback){
    s.src = myurl + ":" + port + "/geogit/diff?oldRefSpec=" + diffs[from] + "&newRefSpec=" + diffs[to] + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme&show=3000";
  }
  else{
    s.src = myurl + "/" + port + "/geogit/diff?oldRefSpec=" + diffs[from] + "&newRefSpec=" + diffs[to] + "&output_format=json&all=true&showGeometryChanges=true&callback=mapme&show=3000";
  }
  s.type = "text/javascript";
  $(document.body).append(s);
}

// shrink key in embed mode
if((window.location + "").indexOf("label=dateonly") > -1){
  $(".key").css({ zoom: 0.8 });
}

// enable download dropdown
if(typeof source != "undefined" && source == "GitHub"){
  var osmoption = $("<option value='osm'>OSM XML</option>");
  $("#download").append( osmoption );
}
$("#download").on("change", function(){
  var format = $("#download").val();
  if(format == ""){
    return;
  }
  switch(format){
    case "shp":
      window.location = "/" + user + "/" + project + "/shp.zip";
      break;
    case "osm":
      window.location = "/" + user + "/" + project + "/osm.osm";
      break;
    case "pg":
      window.location = "/" + user + "/" + project + "/pg.zip";
      break;
    case "sl":
      window.location = "/" + user + "/" + project + "/sl.zip";
      break;
  }
  $("#download").val("");
});

// call for commit log
var calledback = false;
var s = document.createElement('script');
s.src = myurl + ":" + port + "/geogit/log?output_format=json&callback=logged&show=3000";
s.type = "text/javascript";
s.onload = function(){
  calledback = true;
};
s.onerror = function(){
  // firewall - port is timing out
  if(calledback){ return; }
  var s = document.createElement('script');
  s.src = myurl + "/" + port + "/geogit/log?output_format=json&callback=logged&show=3000";
  s.type = "text/javascript";
  $(document.body).append(s);
};
$(document.body).append(s);
setTimeout(s.onerror, 2600);
