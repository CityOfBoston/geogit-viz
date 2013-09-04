var map = L.map('map').setView( [ 42.356, -71.05 ], 12 );
map.attributionControl.setPrefix('');

L.tileLayer('http://{s}.tiles.mapbox.com/v3/mapmeld.map-ofpv1ci4/{z}/{x}/{y}.png', {
  attribution: 'Tiles &copy; MapBox, Data &copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

var focusbox = L.rectangle([ [42.3428127, -71.03 ], [42.368183, -71 ] ], { color: "#ff7800", weight: 1 }).addTo(map);

adjustBox();
map.on('moveend', adjustBox);
document.getElementById("osmsubmit").disabled = "disabled";

function adjustBox(){
  document.getElementById("osmsubmit").disabled = "";
  var deltalat = map.getCenter().lat - focusbox.getBounds().getCenter().lat;
  var deltalng = map.getCenter().lng - focusbox.getBounds().getCenter().lng;
  focusbox.setBounds( [
    [ focusbox.getBounds().getSouthWest().lat + deltalat, focusbox.getBounds().getSouthWest().lng + deltalng ],
    [ focusbox.getBounds().getNorthEast().lat + deltalat, focusbox.getBounds().getNorthEast().lng + deltalng ]
  ] );

  document.getElementById("north").value = focusbox.getBounds().getNorthEast().lat.toFixed(6);
  document.getElementById("south").value = focusbox.getBounds().getSouthWest().lat.toFixed(6);
  document.getElementById("east").value = focusbox.getBounds().getNorthEast().lng.toFixed(6);
  document.getElementById("west").value = focusbox.getBounds().getSouthWest().lng.toFixed(6);
}