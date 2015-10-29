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

function updateEditor() {
  app.setTool( drawpath );
}

var undo = [];

Template.huntingareaeditor.created = function () {
  var map = app.getMap();
  app.addLayer( overlaylayer )
  overlay.getFeaturesCollection().clear();
  undo = [];
  mapsources['huntingareas'].forEachFeature( function ( f ) {
      undo.push( f.clone() );
      overlay.addFeature( f.clone() );
  })
  mapsources['huntingareas'].clear();
  if( overlay.getFeatures().length > 0 ) {
    app.setTool( getEditPathTool() )
  } else {
    app.setTool( getDrawPathTool() )
  }
}

Template.huntingareaeditor.destroyed = function () {
  app.clearTool();
  app.removeLayer( overlaylayer );
}

Template.huntingareaeditor.helpers({
    savestate : function () {
      if( false ) {
        return '';
      }
      return ''
    }
})


Template.huntingareaeditor.events({
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
      Meteor.call('updateHuntingPlanShape', getCurrentPlanId(), getCurrentDriveIndex(), shape, function ( e ) {
        if( e ) {
          console.log( e );
          Session.set( "error", e.reason );
        } else {
          app.clearTool();
          editor.pop();
          updateMapData();
        }
      })
    } else {
      Session.set( "error", {id:'',text:'Es muss mindestens eine Fläche exsitieren.'} );
    }
  },
  'click #abort' : function ( e ) {
    mapsources['huntingareas'].addFeatures( undo );
    app.clearTool();
    editor.pop();
  },
  'click #drawtool' : function()  {
    app.setTool( getDrawPathTool() );
  },
  'click #edittool' : function()  {
    app.setTool( getEditPathTool() );
  },
  'click #deletetool' : function()  {
    app.setTool( getDeletePathTool() );
  }

})
