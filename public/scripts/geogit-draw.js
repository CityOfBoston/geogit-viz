
var map = L.map('map').setView( [ 42.361207, -71.06506 ], 12 );
map.attributionControl.setPrefix('');

// draw control
var editableLayers = new L.FeatureGroup();
map.addLayer(editableLayers);
var drawControl = new L.Control.Draw({
  draw: {
    rectangle: false,
    circle: false
  },
  edit: {
    featureGroup: editableLayers,
    remove: false
  }
});
map.addControl(drawControl);

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

var drawnLayers = [ ];
map.on('draw:created', function(e){
  // assign ID
  e.layer.id = (new Date()) * 1 - 1200000000000;
  
  // update coords
  if(typeof e.layer.getLatLng == "function"){
    north = Math.max( north, e.layer.getLatLng().lat );
    south = Math.min( south, e.layer.getLatLng().lat );
    east = Math.max( east, e.layer.getLatLng().lng );
    west = Math.min( west, e.layer.getLatLng().lng );
  }
  else if(typeof e.layer.getLatLngs == "function"){
    var pts = e.layer.getLatLngs();
    for(var p=0;p<pts.length;p++){
      var pt = pts[p];
      north = Math.max( north, pt.lat );
      south = Math.min( south, pt.lat );
      east = Math.max( east, pt.lng );
      west = Math.min( west, pt.lng );
    }
  }
  else{
    console.log( e.layer );
  }
  $("#coords").val( south.toFixed(6) + "," + west.toFixed(6) + "," + north.toFixed(6) + "," + east.toFixed(6) );
  
  // update JSON
  var feature = { type: "Feature", id: e.layer.id };
  if(e.layerType == "marker"){
    feature.geometry = {
      type: "Point",
      coordinates: [ e.layer.getLatLng().lng.toFixed(6) * 1, e.layer.getLatLng().lat.toFixed(6) * 1 ]
    };
  }
  else if(typeof e.layer.getLatLngs == "function"){
    // presuming polyline, polygon, rectangle
    var pts = e.layer.getLatLngs();
    feature.geometry = {
      coordinates: [ ]
    };
    if(e.layerType == "polygon" || e.layerType == "rectangle"){
      feature.geometry.type = "Polygon";
      feature.geometry.coordinates.push( [ ] );
    }
    else{
      feature.geometry.type = "LineString";
    }
    for(var p=0;p<pts.length;p++){
      if(feature.geometry.type == "Polygon"){
        feature.geometry.coordinates[0].push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
      }
      else{
        feature.geometry.coordinates.push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
      }
    }
    if(feature.geometry.type == "Polygon"){
      feature.geometry.coordinates[0].push( feature.geometry.coordinates[0][0] );
    }
  }
  else{
    // circle might go here
    console.log( e.layer );
    console.log( e.layerType );
  }
  drawnLayers.push( feature );
  $("#json").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( drawnLayers ) + ' }');
  
  // add to map
  editableLayers.addLayer( e.layer );
});

map.on('draw:edited', function(e){
  // update any edited layers from the GeoJSON
  e.layers.eachLayer(function(layer){
    if(typeof layer.id != "undefined"){
      for(var f=0;f<drawnLayers.length;f++){
        if(drawnLayers[f].id == layer.id){
          var feature = drawnLayers[f];
          if(feature.geometry.type == "Point"){
            var pt = layer.getLatLng();
            feature.geometry.coordinates = [ pt.lng.toFixed(6) * 1, pt.lat.toFixed(6) * 1 ];
          }
          else if(typeof layer.getLatLngs == "function"){
            var pts = layer.getLatLngs();
            if(feature.geometry.type == "Polygon"){
              feature.geometry.coordinates = [ [ ] ];
              for(var p=0;p<pts.length;p++){
                feature.geometry.coordinates[0].push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
              }
            }
            else{
              feature.geometry.coordinates = [ ];
              for(var p=0;p<pts.length;p++){
                feature.geometry.coordinates.push( [ pts[p].lng.toFixed(6) * 1, pts[p].lat.toFixed(6) * 1 ] );
              }
            }
          }
          break;
        }
      }
    }
  });
  $("#json").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( drawnLayers ) + ' }');

});
map.on('draw:deleted', function(e){
  // remove any deleted layers from the GeoJSON
  e.layers.eachLayer(function(layer){
    if(typeof layer.id != "undefined"){
      for(var f=0;f<drawnLayers.length;f++){
        if(drawnLayers[f].id == layer.id){
          drawnLayers.splice(f, 1);
          break;
        }
      }
    }
  });
  $("#json").val('{ "type": "FeatureCollection", "features": ' + JSON.stringify( drawnLayers ) + ' }');
});

// add current GeoJSON
if(gj && gj.length){
  $("#json").val(gj);
  gj = JSON.parse(gj);
  var gjlayer = L.geoJson(gj, {
    onEachFeature: function(feature, layer){
      drawnLayers.push( feature );
    
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
      }
    }
  }).addTo(editableLayers);
  
  var bounds = gjlayer.getBounds();
  north = Math.max(north, bounds.getNorthEast().lat);
  south = Math.min(south, bounds.getSouthWest().lat);
  east = Math.max(east, bounds.getNorthEast().lng);
  west = Math.min(west, bounds.getSouthWest().lng); 
  
  if(north > south){
    // fit all points
    map.fitBounds([ [south, west], [north, east] ]);
  }
  else if(north == south){
    // one point
    map.panTo( new L.LatLng( north, east ) );
  }
}

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