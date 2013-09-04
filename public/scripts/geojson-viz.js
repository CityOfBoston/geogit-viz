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
    style: function(feature){
      var randcolor = "#" + (Math.round(Math.random()*16)).toString(16);
      randcolor += (Math.round(Math.random()*16)).toString(16);
      randcolor += (Math.round(Math.random()*16)).toString(16);
      randcolor += (Math.round(Math.random()*16)).toString(16);
      randcolor += (Math.round(Math.random()*16)).toString(16);
      randcolor += (Math.round(Math.random()*16)).toString(16);
      return { opacity: 0.5, fillOpacity: 0.5, color: randcolor, fillColor: randcolor };
    },
    onEachFeature: function(feature, layer){
      if(source == "osm"){
        if(feature.properties.tags){
          map.addLayer(layer);
          var tags = feature.properties.tags.split("|");
          var table = "<table>";
          for(var t=0;t<tags.length;t++){
            table += "<tr><td>" + tags[t] + "</td></tr>";
          }
          table += "</table>";
          layer.bindPopup(table);
        }
      }
    }
  });
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