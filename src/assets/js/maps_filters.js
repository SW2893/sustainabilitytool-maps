var current_filters;

var exclude_keywords = [
  'name', 'host', 'logo', 'website', 'location',
  'address', 'town', 'postcode', 'county', 'country', 'lat', 'lng', 'place'
]

function useKey(key) {
  for (kw of exclude_keywords) {
    if (key.toLowerCase().includes(kw)) {
      return false
    }
  }
  return true
}

function create_filters(data) {
  console.log("Making filters from data", data)
  var filters = {}
  for (var item of data) {
    for (var [key, value] of Object.entries(item)) {
      if (!useKey(key)) { continue; }
      // Add the key to the filters if it doesn't already exist
      if (!(key in filters)) { filters[key] = new Set(); }
      // Add the value to the set
      filters[key].add(value.trim())
    }
  }
  console.log("Generated filters from data", filters)
  return filters
}

function add_filter(key, values) {
  var id_key = key.replace(/\?/gi, "_q").replace(/\s/gi, "_")
  console.log("Setting up filter UI for", key, id_key, values)

  var text = "<div class='col-sm-3'><label class='map-filter-label'>" + key + "</label>"
  text += "<select class='map-filter' id='" + id_key + "' name='" + id_key + "[]' multiple='multiple'>"
  for (var option of values) {
    text += "<option value='" + option + "'>" + option + "</option>"
  }
  text += "</select></div>"

  $(".map-filters").append(text)

  $("#" + id_key).select2({
    'width': '100%'
  });

  $("#" + id_key).change(function(event) {
    var selected_options = event.target.selectedOptions || []
    var selected_values = []
    for (var o of selected_options) {
      //selected_values.push(o.value)     // This can't handle special characters like single quotes
      selected_values.push(o.outerText)   // Grab the actual option text
    }
    console.log( "Handler for .change() called", id_key, key, selected_values);  //, event, selected_options
    if (!(key in current_filters)) {
      current_filters[key] = []
    }
    //current_filters[key].push(event.target.value)
    current_filters[key] = selected_values
    console.log( "Current filters", current_filters);

    clearMarkers()
    plotMeps()
  });
}

// In your Javascript (external .js resource or <script> tag)
$(document).ready(function() {

  $.getJSON("/mep/data.json", function(data) {
    // Filter only MEPs with lat/lng
    //var meps = (data || []).filter(o => ("lat" in o))
    var meps = (data || [])
    filters = create_filters(meps)

    // Add the dropdown filter selections
    for (var [key, values] of Object.entries(filters)) {
      add_filter(key, values);
    }

    // Add a clear and submit button
    var filter_buttons = "<div class='col-sm-12 mb-2 text-right'>"
    //filter_buttons += "<button id='clear-filters' class='btn btn-sm btn-secondary'>Clear</button>"
    //filter_buttons += "<button id='submit-filters' class='btn btn-sm btn-primary'>Apply</button>"
    filter_buttons += "</div>"
    $(".map-filters").append(filter_buttons)
  })

});
