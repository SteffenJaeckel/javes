var workinglayer = null;

var overlaylayer =  new ol.layer.Vector({
  source: new ol.source.Vector({
    features: new ol.Collection(),
    useSpatialIndex: false
  }),
  style: function ( f,r ) {
    if( f.getGeometry() instanceof ol.geom.Point ) {
      return getStandStyle( f,r,true );
    } else {
      return getHuntingAreaStyle(f,r,true);
    }
  },
  updateWhileAnimating: true, // optional, for instant visual feedback
  updateWhileInteracting: true // optional, for instant visual feedback
});

overlaylayer.set("name","Selection");

var overlay = overlaylayer.getSource();

function getDrawPathTool() {
  var drawpath = new ol.interaction.Draw( { style:getHuntingAreaSelectionStyle ,type:'Polygon', source: overlay, minPoints:3, maxPoints: 256 });
  drawpath.set('id','drawtool');
  drawpath.set('cursor','draw-cursor');
  drawpath.set('keydown', function( e ) {
    if( e.keyCode == 27 ) {
      var map = app.getMap();
      map.removeInteraction( drawpath );
      map.addInteraction( drawpath );
    }
  });
  return drawpath;
}


function getEditPathTool() {
  var editpath = new ol.interaction.Modify( {
    style: function (f,r) {
      return getHuntingAreaSelectionStyle(f,r)
    },
    features: overlay.getFeaturesCollection(),
    deleteCondition: function( e ) {
      return ol.events.condition.altKeyOnly(e) && ol.events.condition.singleClick(e);
    }
  });
  editpath.set('id','edittool');
  editpath.set('cursor','add-cursor');
  editpath.set('keydown', function ( e ) {
    if( e.altKey ) {
      $('#map').removeClass('add-cursor').addClass('delete-cursor');
    }
  })
  editpath.set('keyup', function ( e ) {
    if( ! e.altKey ) {
      $('#map').removeClass('delete-cursor').addClass('add-cursor');
    }
  })
  return editpath;
}

function getDeletePathTool() {
  var deletepath = new ol.interaction.Pointer( { handleDownEvent: function( e ) {
    e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
      if( l.getSource() == overlay ){
        overlay.removeFeature( f );
      }
    })
  }});
  deletepath.set('id','deletetool');
  deletepath.set('cursor','delete-cursor');
  return deletepath;
}

var undo = [];

Template.areaeditor.created = function () {

  var map = app.getMap();
  map.addLayer( overlaylayer );
  overlay.getFeaturesCollection().clear();
  undo = [];
  map.getLayers().forEach( function ( layer ) {
    if(layer.get("name") == "Pirschbezirke" ) {
      workinglayer = layer;
    }
  })

  if( workinglayer != null ) {
    workinglayer.getSource().forEachFeature( function ( f ) {
        undo.push( f.clone() );
        overlay.addFeature( f.clone() );
    })
    workinglayer.getSource().clear();
  }

  if( overlay.getFeatures().length > 0 ) {
    app.pushTool( getEditPathTool() )
  } else {
    app.pushTool( getDrawPathTool() )
  }
}

Template.areaeditor.destroyed = function () {
  app.popTool()
  app.removeLayer( overlaylayer );
}

Template.areaeditor.helpers({
    savestate : function () {
      if( false ) {
        return '';
      }
      return ''
    }
})

Template.areaeditor.events({
  'click #save' : function ( e ) {
    Session.set( "error",null);
    var feats = overlay.getFeatures();
    var coords = [];
    for( var i=0;i < feats.length;i++ ) {
      coords.push( feats[i].getGeometry().getCoordinates() );
    }
    if( coords.length > 0 ) {
      var multi = new ol.geom.MultiPolygon( coords,'XY');
      var shape = new ol.format.GeoJSON().writeGeometryObject( multi , { featureProjection: mapconfig.projection.name ,dataProjection:'WGS84' });
      var area = getCurrentArea();
      Meteor.call('updateAreaShape', area._id, shape, function ( e ) {
        if( e ) {
          console.log( e );
          Session.set( "error", e.reason );
        } else {
          editor.pop();
        }
      })
    } else {
      Session.set( "error", {id:'',text:'Es muss mindestens eine Fläche exsitieren.'} );
    }
  },
  'click #abort' : function ( e ) {
    workinglayer.getSource().addFeatures( undo );
    editor.pop();
  },
  'click #drawtool' : function()  {
    app.popTool();
    app.pushTool( getDrawPathTool() );
  },
  'click #edittool' : function()  {
    app.popTool();
    app.pushTool( getEditPathTool() );
  },
  'click #deletetool' : function()  {
    app.popTool();
    app.pushTool( getDeletePathTool() );
  }

})
