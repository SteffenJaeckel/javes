var counter = 0;
var maps = {};

function createMap( route, source_route, source_stands ) {

  var layer = getBaseLayer(0);

  layer.push( new ol.layer.Vector({
    source: source_route ,
    style: function ( f,r ) {
      return getHuntingAreaStyle( f, 1, false, true );
    }
  }));

  layer.push( new ol.layer.Vector({
    source: source_stands ,
    style: function ( f,r ) {
      return getStandStyle( f, 1, false, true );
    }
  }));

  var map = new ol.Map({
    controls: [ new ol.control.ScaleLine() ],
    layers: layer,
    target: route,
    renderer:'canvas',
    restrictedExtent: [214029, 5621113, 562926, 5993281],
    maxExtent: [215121, 5683205, 486755, 5942287], //25833,
    view: new ol.View({
      projection: mapconfig.projection.name,//'CRS:84',
      center: [	427665, 5808739 ],
      zoom: 17,
      maxZoom:21
    })
  });
  updateMap( map, route , source_route, source_stands );
  map.getInteractions().clear();
  return map;
}

function updateMap( map, route, source_route, source_stands ){

  if( map ) {

    var e = document.getElementById(route);
    if( e ) {
      map.setTarget( document.getElementById(route) );
    }
    var plan = getCurrentPlan();
    var drive = getCurrentDrive();
    var extend = [];

    if( Stands.find().count() > 0 && drive.routes[ route ] != null ) {
      // add route
      source_route.clear();
      var path = new ol.format.GeoJSON().readGeometry( drive.routes[ route ].path , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
      var feature = new ol.Feature( { geometry: path } );
      extend = path.getCoordinates();
      feature.set('color',6);
      source_route.addFeature( feature );

      // add stands
      source_stands.clear();
      for( var sid in drive.stands ) {
        var stand = Stands.findOne({_id:sid});
        if( stand ) {
          var geo = new ol.format.GeoJSON().readGeometry( stand.location , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
          var feature  = new ol.Feature( { geometry: geo } );
          feature.setId(sid);
          feature.set('type',stand.type);
          feature.set('name',stand.name);
          feature.set('z-index', source_stands.getFeatures().length )
          if( drive.stands[sid].route ==  route ) {
            feature.set('color', 6 );
            extend.push( geo.getCoordinates() );
            if( drive.stands[sid].user && plan.invitestates[ drive.stands[sid].user ] ) {
              var state = plan.invitestates[ drive.stands[sid].user ].state;
              if( state && state != 'refused') {
                feature.set('hunter', drive.stands[sid].user );
              }
            }
          } else if( drive.routes[ drive.stands[sid].route ] ){
            feature.set('color', 3 );
          }
          source_stands.addFeature( feature );
        }
      }
      map.getView().fit( new ol.geom.MultiPoint( extend , 'XY'), map.getSize() , {constrainResolution:false, nearest:false, padding: [48,48,48,48] });
    } else {
      //console.log( 'retry, route '+route+" not found "  )
      setTimeout( updateMap , 100, map, route, source_route, source_stands );
    }
  }
}

Template.printroutemap.created = function() {
  var self = this;
  self.autorun( function () {
    var stands = Stands.find();
    if( self.map ) {
      updateMap( self.map, self.data.route, self.souce_route, self.source_stands );
    }
  });
}

Template.printroutemap.rendered = function() {
  this.souce_route = new ol.source.Vector( { features: new ol.Feature() } );
  this.source_stands = new ol.source.Vector( { features: new ol.Feature() } );
  this.map = createMap( this.data.route, this.souce_route, this.source_stands );
}

Template.printroutemap.destroyed = function() {

}

Template.printroutemap.helpers({
  mapid : function() {
    var self = Template.instance();
    updateMap( self.map, this.route, self.souce_route, self.source_stands );
    return this.route;
  }
})
