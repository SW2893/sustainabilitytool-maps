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
    if (key == "lat" || key == "lng" || key == "place_id") { continue; }
    var parsed_key = key.replace("_", " ")
    var value_str = (typeof value == "string" ? value : JSON.stringify(value)).trim()
    if (!value_str) { continue; }
    // Create a link for websites
    if (parsed_key == "Website") {
      value_str = "<a href='" + value_str + "' target='_blank'>" + value_str + "</a>"
    }
    content_string += "<b>" + parsed_key + "</b>: " + value_str + "<br/>"
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

function plotRegions(data) {
  console.log("Plotting regions for items with no address")
  infowindow = new google.maps.InfoWindow({ content: 'holding...' });

  // Get only the MEPs without lat/lng keys
  var meps = (data || []).filter(o => (!("lat" in o)))
  console.log("MEP data without lat/lng for regions", meps)

  meps = filter_data(meps)
  console.log("Filtered regional MEPS to", meps)

  // construct a map of the online sellers
  var mep_location_map = {}
  for (var mep of meps) {
    if (!(mep.location in mep_location_map)) {
      mep_location_map[mep.Location] = []
    }
    mep_location_map[mep.Location].push(mep)
  }
  console.log('Got region map: ', mep_location_map)

  // Load the EER and County regions
  map.data.loadGeoJson(
    '/assets/geojson/uk_eer_geo.json'
  );
  map.data.loadGeoJson(
    '/assets/geojson/uk_county_geo.json'
  );

  // Set the styles and properties of regions
  map.data.setStyle(function(feature) {
    var regionName = feature.getProperty('eer18nm') || feature.getProperty('ctyua17nm')
    var regionLevel = feature.getProperty('eer18nm') ? 'eer' : 'county'
  
    // Get the meps for this region from the mep_location_map
    var keys = Object.keys(mep_location_map).filter(i => regionName.includes(i))
    if ((regionLevel == 'eer') || (keys.length)){
      keys = keys.concat(['UK'])
    }
    if (keys.length) { console.log(' - Relevant keys', keys) }

    // Get the meps for this region
    var region_meps = []
    for (var key of keys) {
      region_meps = region_meps.concat(mep_location_map[key])
    }
    if (region_meps.length) { console.log(' - MEPS', region_meps) }

    // Get the text for these MEPS
    var infoContent = region_meps.map(mep => getMepText(mep)).join('<hr />')
    if (infoContent) { 
      infoContent = "<h6>Online listings for region: " + regionName + "</h6><hr />" + infoContent
      console.log(' - info', infoContent) 
    } else {
      console.log('Removing region from map', regionLevel, regionName)
      return ({
        visible: false
      })
    }

    console.log('Setting properties and styles for region: ', regionLevel, regionName)
    // Set the properties for this feature    
    feature.setProperty('regionName', regionName)
    feature.setProperty('regionLevel', regionLevel)
    feature.setProperty('infoContent', infoContent)
    // Set the styles
    var color = regionLevel == 'eer' ? 'gray' : 'red'
    var opacity = regionLevel == 'eer' ? 0.3 : 0.5
    var zIndex = regionLevel == 'eer' ? 0 : 1
    return ({
      fillColor: color,
      fillOpacity: opacity,
      strokeWeight: 0,
      zIndex: zIndex
    });
  });

  // Toggle on click
  map.data.addListener('click', function(event) {
    var feat = event.feature
    console.log("Clicked event", feat)
    
    // Pop up an infoWindow with the online suppliers
    infowindow.setContent(feat.getProperty('infoContent'));
    infowindow.setPosition(event.latLng);
    //infowindow.setOptions({pixelOffset: new google.maps.Size(0,-34)});
    infowindow.open(map);

    /*
    // Toggle visibility of the region on click
    if (event.feature.getProperty('highlighted')) {
      event.feature.setProperty('highlighted', false);
      map.data.overrideStyle(event.feature, {
        fillOpacity: 0,
      });
    } else {
      event.feature.setProperty('highlighted', true);
      map.data.overrideStyle(event.feature, {
        fillOpacity: 0.5,
      });
    }
    */
 });
}

function plotMarkers(data) {
  // Get only the MEPs with lat/lng keys
  var meps = (data || []).filter(o => ("lat" in o))
  console.log("MEP data with lat/lng for markers", meps)

  meps = filter_data(meps)
  console.log("Filtered marker MEPS to", meps)

  for (mep of meps) {
    addMarker(mep)
  }
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

  // Load the data and plot the markers and regions
  $.getJSON("/mep/data.json", function(data) {
    plotMarkers(data);
    plotRegions(data);
  })
}

google.maps.event.addDomListener(window, 'load', initMepMap);
