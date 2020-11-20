var map;

function updateDetails(editablePolygon) {
  console.log("Updating path description")
  var points = []
  editablePolygon.getPath().forEach((latLng, i) => {
    points.push([latLng.lat(),latLng.lng()])
  })
  $("#admin-details").empty()
  $("#admin-details").append(JSON.stringify(points))
}

// Initialize and add the map
function initMepMap() {
  // The location of the UK
  var uk = {lat: 54.3781, lng: -3.4360};
  var mapOptions = {
    zoom: 7,
    center: uk,
  };

  // The map, centered on the UK
  map = new google.maps.Map(
    document.getElementById('admin-map-canvas'), mapOptions
  );

  // Add a user-editable polygon
  const editablePolyCoords = [
    { lat: 54.0, lng: -2.0 },
    { lat: 54.0, lng: -1.0 },
    { lat: 54.5, lng: -1.5 }
  ];

  // Load the data and plot the markers and regions
  const editablePolygon = new google.maps.Polygon({
    paths: editablePolyCoords,
    editable: true,
    strokeColor: "#FF0000",
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: "#FF0000",
    fillOpacity: 0.35,
    map: map
  });
  updateDetails(editablePolygon)

 google.maps.event.addListener(editablePolygon, "rightclick", (e) => {
   // Check if click was on a vertex control point
   if (e.vertex == undefined) {
     return;
   }
   console.log("RIGHT-click on vertex. Deleting", e.vertex)
   editablePolygon.getPath().removeAt(e.vertex)
 });

 google.maps.event.addListener(editablePolygon, "mouseup", (e) => {
   updateDetails(editablePolygon)
 });

}

google.maps.event.addDomListener(window, 'load', initMepMap);
