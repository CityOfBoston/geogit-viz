var knownFeatures = { };

var map = L.map('map').setView( [ 42.361207, -71.06506 ], 12 );
map.attributionControl.setPrefix('');

var south = 90;
var west = 180;
var north = -90;
var east = -180;

if(coords && coords.length){
  south = coords[0];
  west = coords[1];
  north = coords[2];
  east = coords[3];
  map.fitBounds([ [ south, west ], [ north, east ] ]);
}

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

// add current GeoJSON
$.getJSON("/" + user + "/" + project + "/current.geojson", function(gj){
  L.geoJson(gj, {
    onEachFeature: function(feature, layer){
      var randcolor = "#" + (Math.floor(Math.random()*16)).toString(16);
      randcolor += (Math.floor(Math.random()*16)).toString(16);
      randcolor += (Math.floor(Math.random()*16)).toString(16);
      randcolor += (Math.floor(Math.random()*16)).toString(16);
      randcolor += (Math.floor(Math.random()*16)).toString(16);
      randcolor += (Math.floor(Math.random()*16)).toString(16);
      var randstyle = { opacity: 0.5, fillOpacity: 0.5, color: randcolor, fillColor: randcolor, radius: 5 };
      
      if(typeof layer.getLayers == "function"){
        var features = layer.getLayers();
        for(var f=0;f<features.length;f++){
          features[f].setStyle( randstyle );
        }
      }
      else if(typeof layer.setStyle == "function"){
        layer.setStyle( randstyle );
      }
      
      if(feature.geometry.type == "Point"){
        // convert Leaflet marker to a circle marker
        var randcolor = "#" + (Math.round(Math.random()*16)).toString(16);
        randcolor += (Math.round(Math.random()*16)).toString(16);
        randcolor += (Math.round(Math.random()*16)).toString(16);
        randcolor += (Math.round(Math.random()*16)).toString(16);
        randcolor += (Math.round(Math.random()*16)).toString(16);
        randcolor += (Math.round(Math.random()*16)).toString(16);
        layer = L.circleMarker( layer.getLatLng(), randstyle );
        north = Math.max( north, layer.getLatLng().lat );
        south = Math.min( south, layer.getLatLng().lat );
        east = Math.max( east, layer.getLatLng().lng );
        west = Math.min( west, layer.getLatLng().lng );
      }
      else if(layer.getLatLngs()){
        var latlngs = layer.getLatLngs();
        for(var pt=0;pt<latlngs.length;pt++){
          north = Math.max( north, latlngs[pt].lat );
          south = Math.min( south, latlngs[pt].lat );
          east = Math.max( east, latlngs[pt].lng );
          west = Math.min( west, latlngs[pt].lng );
        }
      }
      if(source == "GitHub"){
        if( typeof feature.properties != "undefined" && Object.keys(feature.properties).length ){
          var table = "<table border='1'>";
          var taglength = 0;
          for(var key in feature.properties){
            if(!isNaN(key*1)){
              continue;
            }
            if(key.indexOf("source:") == 0 || key.indexOf("attribution:") == 0){
              // tags added to points - not useful for user's view
              continue;
            }
            taglength++;
            table += "<tr><td>" + key + "</td><td>" + feature.properties[key] + "</td></tr>";
          }
          table += "</table>";
          if(taglength){
            map.addLayer(layer);
            layer.bindPopup(table);
          }
        }
      }
      if(source == "osm" || source == "user"){
        if(feature.properties.tags){
          var tags = feature.properties.tags.split("|");
          var table = "<table border='1'>";
          var taglength = 0;
          for(var t=0;t<tags.length;t++){
            if(tags[t].indexOf("source:") == 0 || tags[t].indexOf("attribution:") == 0){
              // tags added to points - not useful for user's view
              continue;
            }
            taglength++;
            table += "<tr><td>" + tags[t] + "</td></tr>";
          }
          table += "</table>";
          if(taglength){
            map.addLayer(layer);
            layer.bindPopup(table);
          }
        }
      }
    }
  });
  if(north > south){
    // fit all points
    map.fitBounds([ [south, west], [north, east] ]);
  }
  else if(north == south){
    // one point
    map.panTo( new L.LatLng( north, east ) );
  }
});

// shrink key and hide download in embed mode
if((window.location + "").indexOf("label=dateonly") > -1){
  $(".key div").css({
    padding: "6px 12px",
    "border-radius": "9px",
    "font-size": "12px"
  });
  $("#download").css({ display: "none" });
}

// enable download dropdown
if((typeof source != "undefined") && ((source == "GitHub") || (source == "osm" && coords && coords.length))){
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
      if(typeof source != "undefined"){
        if(source == "GitHub"){
          window.location = "/" + user + "/" + project + "/osm.osm";
        }
        else if(source == "osm"){
          // [s,w,n,e] to [w,s,e,n]
          window.location = "http://openstreetmap.org/api/0.6/map?bbox=" + coords[1] + "," + coords[0] + "," + coords[3] + "," + coords[2];
        }
      }
      break;
    case "gj":
      window.location = "/" + user + "/" + project + "/current.geojson";
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