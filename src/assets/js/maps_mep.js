var map;
//var _data = [];
var markers = [];
var polygons = [];
var current_filters = {}
var region_features = [];
var bounds;

// Sets the map on all markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
  }
}

function clearMarkers() {
  console.log("Clearing markers")
  setMapOnAll(null);
  markers = []
}

function clearRegions() {
  console.log("Clearing regions")
  /*for (var feature of region_features) {
    console.log("Checking to clear feature", feature)
    if (feature.getProperty('hasData') === false) {
      console.log(" - Permanently removing unused feature", feature)
      map.data.remove(feature)
    }
  }*/
  map.data.setStyle({visible: false})
}

function clearPolygons() {
  console.log("Clearing polygons")
  for (var i = 0; i < polygons.length; i++) {
    polygons[i].setMap(null);
  }
  polygons = []
}

function distance(lat1, lon1, lat2, lon2, unit) {
  /* Distance between two points given latitude and longitude
  */
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

function getContentString(include_keys, exclude_keys, parsed_meps, include_title=true, section_title="", section_class="") {

  content_string = section_title ? "<b>" + section_title + "</b>: <br/>" : ""
  content_string += "<div class='" + section_class + "'>"
  content_string = ""
  for (var key of include_keys) {
    if (exclude_keys.includes(key)) { continue; }
    var value = parsed_meps[key]
    if (!value) { continue }
    if (key == "Host" && value == parsed_meps["Name"]) { continue }
    var value_str = (typeof value == "string" ? value : JSON.stringify(value)).trim()
    if (!value_str) { continue; }
    if (key == "Name") {
      value_str = "<b>" + value_str + "</b>"
    }
    content_string += include_title ? "<b>" + key + "</b>: " : ""
    content_string += value_str + "<br/>"
  }
  if (!content_string) {
    return content_string
  }
  // Wrap in a div and give a header
  content_string = "<div class='" + section_class + "'>" + content_string + "</div>"
  content_string = (section_title ? "<b>" + section_title + "</b>: <br/>" : "") + content_string
  return content_string
}

function getMepText(mep) {
  var content_string = ""
  var exclude_keys = (_config.infobox || {}).exclude_fields || []

  parsed_meps = {}
  for (var [key, value] of Object.entries(mep)) {
    if (exclude_keys.includes(key.toLowerCase())) { continue; }
    var parsed_key = key.replace("_", " ")
    var value_str = (typeof value == "string" ? value : JSON.stringify(value)).trim()
    if (!value_str) { continue; }
    // Create a link for websites
    if (parsed_key == "Website") {
      value_str = "<a href='" + value_str + "' target='_blank'>" + value_str + "</a>"
    }
    parsed_meps[key] = value_str
  }
  console.log("PARSED MEP DATA FOR INFO", parsed_meps)

  var header_keys = ["Name", "Host", "Website"]
  var address_keys = ["Address Line 1", "Address Line 2", "Town", "Postcode", "Country"]
  content_string = getContentString(header_keys, [], parsed_meps, false)
  content_string += getContentString(
      Object.keys(parsed_meps),
      header_keys + address_keys + ["Location", "County"],
      parsed_meps,
      true, "", "mt-2 mb-2"
  )
  content_string += getContentString(address_keys, [], parsed_meps, false, "Address", "ml-3 float-left")

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

  // Get the marker color to use
  let colour = (mep["Colour"] || "red")
  colour = colour.trim().toLowerCase()

  // Set the marker on the map
  var marker = new google.maps.Marker({
      position: {'lat': mep.lat, 'lng': mep.lng},
      map: map,
      title: mep.name,
      content: getMepText(mep),
      icon: {
        url: `https://maps.google.com/mapfiles/ms/icons/${colour}-dot.png`
      }
  });
  bounds.extend(marker.getPosition());

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

function styleFeature(feature) {
  // Set the styles and properties of features
  var regionName = feature.getProperty('regionName')
  var regionLevel = feature.getProperty('regionLevel')
  console.log('Setting styles for region: ', regionLevel, regionName)
  // Set the styles
  var color = regionLevel == 'eer' ? 'red' : 'red'
  var opacity = regionLevel == 'eer' ? 0.2 : 0.5
  var zIndex = regionLevel == 'eer' ? 0 : 1
  return ({
    visible: true,
    strokeColor: color,
    strokeOpacity: 0.6,
    strokeWeight: 1,
    fillColor: color,
    fillOpacity: opacity,
    strokeWeight: 0,
    zIndex: zIndex
  });
}

function setFeatureProperties(feature, mep_location_map, set_global=false) {
  var regionName = feature.getProperty('eer18nm') || feature.getProperty('ctyua17nm')
  var regionLevel = feature.getProperty('eer18nm') ? 'eer' : 'county'

  // Get the location keys that are relevant to this region (ie. UK, Ireland, etc.)
  var keys = Object.keys(mep_location_map).filter(i => regionName.includes(i))
  if ((regionLevel == 'eer') || (keys.length)){
    keys = keys.concat(['UK'])
  }

  // Get the meps for this region
  var region_meps = []
  for (var key of keys) {
    region_meps = region_meps.concat(mep_location_map[key] || [])
  }

  // Get the text for these MEPS
  var infoContent = region_meps.map(mep => getMepText(mep)).join('<hr />')
  if (infoContent) {
    infoContent = "<h6>Online listings for region: " + regionName + "</h6><hr />" + infoContent
  } else {
    if (set_global) {
      console.log("Removing region from map", regionLevel, regionName)
      map.data.remove(feature)
    } else {
      map.data.overrideStyle(feature, {
        visible: false,
      });
    }
    return null;
  }
  // Add this to the global list of regions
  if (set_global) {
    region_features.push(feature)
  }
  console.log("Setting properties for region", regionLevel, regionName)
  feature.setProperty('regionLevel', regionLevel)
  feature.setProperty('regionName', regionName)
  feature.setProperty('infoContent', infoContent)

  console.log("Getting bounds from feature", feature)
  feature.getGeometry().forEachLatLng(function(latlng) {
     bounds.extend(latlng);
  });

  map.data.overrideStyle(feature, styleFeature(feature));
}

function setFeaturePropertiesAndStyles(features, mep_location_map, set_global=false) {
  for (var feature of features) {
    setFeatureProperties(feature, mep_location_map, set_global)
  }
}

function setCountySelector(features) {
  console.log("GOT COUNTIES FEATURES", features)
  var county_map = features.reduce((acc, feature) => {return Object.assign(acc, {
    [feature.getProperty('ctyua17cd')]: {
      'name': feature.getProperty('ctyua17nm'),
      'lat': feature.getProperty('lat'),
      'lng': feature.getProperty('long'),
      'st_lengths': feature.getProperty('st_lengths')
    }
  })}, {})
  console.log("GOT COUNTY MAP", county_map)

  // Add this to the selection filter
  var key = "County"
  var id_key = "counties"
  var text = "<div class='col-sm-12'><label class='map-filter-label'>Search by county or location:<small>(<a href='#' id='clearcounty'>clear</a>)</small></label>"
  text += "<select class='map-filter' id='" + id_key + "' name='" + id_key + "[]'>"
  // Order the items before rendering
  let ordered_items = Object.entries(county_map).sort(
    (a, b) => (a[1].name.localeCompare(b[1].name))
  )
  // Generate the option strings
  for (var [code, values] of ordered_items) {
    text += "<option value='" + code + "'>" + values['name'] + "</option>"
  }
  text += "</select></div>"

  $(".county-select").append(text)
  $("#" + id_key).select2({
    'width': '100%'
  });
  $('#' + id_key).val(null).trigger('change');

  $("#" + id_key).change(function(event) {
    var selected_options = event.target.selectedOptions || []
    var selected_values = []
    for (var o of selected_options) {
      selected_values.push(o.value)   // Grab the actual option text
    }
    console.log( "Handler for .change() on counties called", id_key, key, selected_values);  //, event, selected_options
    if (selected_values.length) {
      var code = selected_values[0]
      var details = county_map[code]

      console.log("Centering map and zooming on", details)
      map.setCenter({lat: details['lat'], lng: details['lng']})
      map.setZoom(11)
    } else {
      map.setZoom(7)
      map.setCenter({lat: 54.3781, lng: -3.4360})
    }
  });

  $("#clearcounty").click(function(event) {
    console.log("Clearing county selection");  //, event, selected_options
    $('#' + id_key).val(null).trigger('change');
    map.setZoom(7)
    map.setCenter({lat: 54.3781, lng: -3.4360})
  });

}

function loadRegionFeatures(mep_location_map) {
  if (region_features.length) {
    setFeaturePropertiesAndStyles(region_features, mep_location_map, false)
    return null
  }
  console.log("Loading Region GIS data", region_features)
  // Load the EER and County regions (if not already loaded)
  map.data.loadGeoJson('/assets/geojson/uk_eer_geo.json', null, function(features) {
    setFeaturePropertiesAndStyles(features, mep_location_map, true)
  });
  map.data.loadGeoJson('/assets/geojson/uk_county_geo.json', null, function(features) {
    setCountySelector(features)
    setFeaturePropertiesAndStyles(features, mep_location_map, true)
  });
}

function hasPolygonData(data) {
  return ((data.Polygon || "").trim() != "")
}

function plotRegions(data) {
  data = data || _data;
  console.log("Plotting regions for items with no address or user-defined polygon")
  infowindow = new google.maps.InfoWindow({ content: 'holding...' });

  // Get only the MEPs without lat/lng keys
  var meps = (data || []).filter(o => (!("lat" in o) && !hasPolygonData(o)))
  console.log("MEP data without lat/lng for regions", meps)

  meps = filter_data(meps)
  console.log("Filtered regional MEPS to", meps)

  // construct a map of the online sellers
  var mep_location_map = {}
  for (var mep of meps) {
    mep_location_map[mep.Location] = mep_location_map[mep.Location] || []
    mep_location_map[mep.Location].push(mep)
  }
  console.log('Got region map: ', mep_location_map)

  loadRegionFeatures(mep_location_map)

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

function drawPolygon(data) {
  const pointsArray = JSON.parse( data.Polygon )
  const points = pointsArray.map(p => {
    var pnt = { lat: p[0], lng: p[1] }
    bounds.extend(pnt)
    return (pnt)
  })
  infowindow = new google.maps.InfoWindow({ content: 'holding...' });

  // Load the data and plot the markers and regions
  const polygon = new google.maps.Polygon({
    paths: points,
    strokeColor: "red",
    strokeOpacity: 0.6,
    strokeWeight: 1,
    fillColor: "red",
    fillOpacity: 0.2,
    zIndex: 1,
    map: map
  });

  google.maps.event.addListener(polygon, "click", (event) => {
    console.log("Clicked on polygon", event.latLng)
    infowindow.setContent(getMepText(data));
    infowindow.setPosition(event.latLng);
    infowindow.open(map);
  });

  // Add this marker to the global list
  polygons.push(polygon)
}

function plotUserPolygons(data) {
  console.log("Plotting user defined polygon regions")
  data = data || _data;
  infowindow = new google.maps.InfoWindow({ content: 'holding...' });
  var meps = (data || []).filter(o => hasPolygonData(o))
  meps = filter_data(meps)
  for (var mep of meps) {
    drawPolygon(mep)
  }
}

function plotMarkers(data) {
  data = data || _data;
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
    zoom: 7,
    center: uk,
  };

  // The map, centered on the UK
  map = new google.maps.Map(
    document.getElementById('map-canvas'), mapOptions
  );

  // Load the data and plot the markers and regions
  $.getJSON("./data.json", function(data) {
    _data = data;
    plotMarkers(data);
    plotUserPolygons(data);
    plotRegions(data, setGlobalVis=true);
  })
}

google.maps.event.addDomListener(window, 'load', initMepMap);
