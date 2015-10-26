
function updateMap() {
  var olmap = olMap();
  if( olmap ) {
    olmap.setTarget( document.getElementById('map') );

  }
}

Template.areamanagement_frame.rendered = function() {
  updateMap();
}
