var map = L.map('map').setView( [ 42.361207, -71.06506 ], 13 );
map.attributionControl.setPrefix('');

// add an OpenStreetMap tile layer
L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy;2013 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// wkt
var wktlayer = function(txt){
  var wkt = new Wkt.Wkt();
  wkt.read( txt );
  return wkt.toObject();
};

var mapfeature = function(feature){
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
    lyr.setStyle({ clickable: false, color: color });
  }
  else{
    // change marker to circle
    lyr = new L.CircleMarker( lyr.getLatLng(), { clickable: false, color: color, opacity: 0.8, fillOpacity: 0.8 } );
  }
  map.addLayer(lyr);
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
};

var s = document.createElement('script');
s.src = "http://localhost:8080/geogit/diff?oldRefSpec=b6b12e83119dc91f7ad7204c07996b2e50c15665&output_format=json&all=true&showGeometryChanges=true&callback=mapme";
s.type = "text/javascript";
document.body.appendChild(s);