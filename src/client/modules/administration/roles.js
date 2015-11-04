var access_layer = {};

function drawRoleShapes( ) {

  access_layer.getSource().clear();

  var customer = Customers.findOne({_id:app.getCustomer()});
  if( customer ) {
    var dep = app.getDepartment();
    for( var role in customer.departments[ dep ].roles ) {
      var geo = customer.departments[ dep ].roles[role].geometry;
      if( geo ) {
        var geo = new ol.format.GeoJSON().readGeometry( geo , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
        var polys = geo.getPolygons();
        for( var p=0;p < polys.length;p++ ) {
          var feat = new ol.Feature();
          feat.setGeometry( polys[p] );
          feat.set('width',2);
          feat.set('color',4);
          feat.set('name', role );
          access_layer.getSource().addFeature( feat );
        }
      } else {
        app.resetView();
      }
    }
  }
}

function updateMap() {
  app.getMap().setTarget( document.getElementById('map'));

  var cursor = Customers.find({_id:app.getCustomer()});
  cursor.observeChanges({
    added:function( id, fields ) {
      drawRoleShapes();
    },
    removed:function( id ) {
      drawRoleShapes();
    },
    changed:function( id, fields ) {
      drawRoleShapes();
    }
  });
}

Template.roles.helpers({
  roles: function() {
    var customer = Customers.findOne({_id:app.getCustomer()});
    if( customer )
      return _.keys(customer.departments[ app.getDepartment() ].roles);

    return [];
  }
})

Template.roles.events({
})

Template.roles.created = function() {

  access_layer = new ol.layer.Vector({
    source: new ol.source.Vector() ,
    style: function ( f,r ) {
      return getHuntingAreaStyle( f, r);
    }
  });
  access_layer.set('name','Rollen');
  app.addLayer( access_layer );
}

Template.roles.rendered = function() {
  updateMap();
}

Template.roles.destroyed = function() {
  app.removeLayer( access_layer );
}
