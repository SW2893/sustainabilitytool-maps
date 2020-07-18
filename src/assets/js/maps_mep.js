var map;
var markers = [];
var current_filters = {}

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function clearMarkers() {
  setMapOnAll(null);
  markers = []
}

function getMepText(mep) {
  var content_string = ""
  for (var [key, value] of Object.entries(mep)) {
    if (key == "lat" || key == "lng") { continue; }
    var parsed_key = key.replace("_", " ")
    content_string += "<b>" + parsed_key + "</b>: " + (typeof value == "string" ? value : JSON.stringify(value)) + "<br/>"
  }
  // Add a link to the directions
  if ((mep.lat) && (mep.lng)) {
    lat_lng = (mep.lat || "") + "," + (mep.lng || "")
    content_string += "<a class='btn btn-sm btn-primary float-right' href='https://www.google.com/maps/dir/?api=1&destination=" + lat_lng + "' target='_blank'>Directions</a>"
  }
  return content_string
}

function addMarker(mep) {
  //console.log("Plotting data for MEP", mep)  //, JSON.stringify(mep, undefined, 4)
  infowindow = new google.maps.InfoWindow({ content: 'holding...' });

  if (!mep.lat || !mep.lng) {
    console.log(" - No lat/lng data for mep. Skipping.")
    return null
  }

  // Set the marker on the map
  var marker = new google.maps.Marker({
      position: {'lat': mep.lat, 'lng': mep.lng},
      map: map,
      title: mep.name,
      content: getMepText(mep)
  });

  // Add a listener to show the content on click
  google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent( this.get("content") );
      infowindow.open(map, this);
  });

  // Add this marker to the global list
  markers.push(marker)
}

function filter_data(data) {
  console.log("Filtering data with", current_filters)
  var filtered_data = data
  for (var [key, values] of Object.entries(current_filters)) {
    if (!values.length) { continue; }
    var value_set = new Set(values)
    console.log("Filtering for key value set", key, value_set)
    filtered_data = filtered_data.filter(i => {
      return value_set.has(i[key])
    })
  }
  console.log("Filtered data", filtered_data)
  return filtered_data
}


function plotMeps() {

  // Load the JSON data
  $.getJSON("/mep/data.json", function(data) {
    console.log("Got MEP data", data)

    // Get only the MEPs with lat/lng keys
    var meps = (data || []).filter(o => ("lat" in o))
    console.log("MEP data with lat/lng", meps)

    meps = filter_data(meps)
    console.log("Filtered MEPS to", meps)

    for (mep of meps) {
      addMarker(mep)
    }
  })

}

// Initialize and add the map
function initMepMap() {
  // The location of the UK
  var uk = {lat: 54.3781, lng: -3.4360};
  var mapOptions = {
    zoom: 6,
    center: uk,
  };

  // The map, centered on the UK
  map = new google.maps.Map(
    document.getElementById('map-canvas'), mapOptions
  );

  // Plot all of the data to start with
  plotMeps();
}

google.maps.event.addDomListener(window, 'load', initMepMap);
