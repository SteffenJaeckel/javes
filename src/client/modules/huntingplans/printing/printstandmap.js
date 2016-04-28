var counter = 0;
var maps = {};

function createMap( stand, source_circles, source_stands ) {

  var layer = getBaseLayer(2);

  layer.push( new ol.layer.Vector({
    source: source_circles ,
    style: function ( f,r ) {
      return [
        new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [255,255,255,0.8],
              width: 4
            })
        }),
        new ol.style.Style({
            stroke: new ol.style.Stroke({
              color: [0,0,0,1],
              width: 1
            })
        }),
        new ol.style.Style( {
            text: new ol.style.Text( {
              font:'tahoma',
              scale:2.0,
              text: ''+f.get('dist')+'m',
              offsetX: 0,
              offsetY: (parseInt(f.get('dist'))/r)-2,
              fill: new ol.style.Fill({
                color: [0,0,0,1],
              }),
              stroke: new ol.style.Stroke({
                color: [255,255,255,1],
                width: 2
              }),
            })
        })
      ];
    }
  }));

  layer.push( new ol.layer.Vector({
    source: source_stands ,
    style: function ( f,r ) {
      return getStandStyle( f, 1, false, true );
    }
  }));

  var map = new ol.Map({
    controls: [],
    layers: layer,
    target: stand,
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
  updateMap( map, stand , source_circles, source_stands );
  map.getInteractions().clear();
  return map;
}

function updateMap( map, sid, source_circles, source_stands ){

  if( map ) {

    var e = document.getElementById(sid);
    if( e ) {
      map.setTarget( document.getElementById(sid) );
    }
    var plan = getCurrentPlan();
    var drive = getCurrentDrive();
    var extend = [];

    if( Stands.find().count() > 0 ) {
      console.log( "update map stands ", Stands.find().count() )
      source_circles.clear();
      var stand = Stands.findOne({_id:sid});
      var distances = [70,150,300];//[125,250,375,500];
      if( stand ) {
        var geo = new ol.format.GeoJSON().readGeometry( stand.location , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
        var circle = null;
        for( var i=0;i < distances.length;i++ ) {
          circle = new ol.geom.Circle( geo.getCoordinates() ,distances[i],'XY');
          var feature  = new ol.Feature( { geometry: circle} );
          feature.set('dist',distances[i])
          source_circles.addFeature( feature );
        }
        var alt = new ol.geom.Polygon.fromCircle( circle, 8);
        map.getView().fit( alt , map.getSize(), {constrainResolution:false, nearest:false, padding: [48,48,48,48] });
      }

      source_stands.clear();
      Stands.find().forEach( function( stand ) {
        var geo = new ol.format.GeoJSON().readGeometry( stand.location , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
        var feature  = new ol.Feature( { geometry: geo } );
        feature.setId(stand._id);
        feature.set('type',stand.type);
        feature.set('name',stand.name);
        feature.set('z-index', source_stands.getFeatures().length )
        if( stand._id == sid ) {
          feature.set('color', '0' );
        } else if( drive.stands[stand._id] && drive.routes[ drive.stands[stand._id].route ] ) {
          feature.set('color', '3' );
        }
        source_stands.addFeature( feature );
      })
    } else {
      //console.log( 'retry, route '+route+" not found "  )
      setTimeout( updateMap , 100, map, sid, source_circles, source_stands );
    }
  }
}

Template.printstandmap.created = function() {
  var self = this;
  self.autorun( function () {
    var stands = Stands.find();
    if( self.map ) {
      updateMap( self.map, self.data.route, self.souce_route, self.source_stands );
    }
  });
}

Template.printstandmap.rendered = function() {
  this.source_circles = new ol.source.Vector( { features: new ol.Feature() } );
  this.source_stands = new ol.source.Vector( { features: new ol.Feature() } );
  this.map = createMap( this.data._id, this.source_circles, this.source_stands );
}

Template.printstandmap.destroyed = function() {

}

Template.printstandmap.helpers({
  mapid : function() {
    var self = Template.instance();
    updateMap( self.map, this._id, this.source_circles, self.source_stands );
    return this._id;
  }
})
