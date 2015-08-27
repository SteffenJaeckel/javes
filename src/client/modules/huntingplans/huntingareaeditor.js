var current_tool = null;

function getDrawPathTool() {
  var drawpath = new ol.interaction.Draw( { style:getHuntingAreaSelectionStyle ,type:'Polygon', source: overlay, minPoints:3, maxPoints: 256 });
  drawpath.set('id','drawtool');
  drawpath.set('cursor','draw-cursor');
  drawpath.set('keydown', function( e ) {
    if( e.keyCode == 27 ) {
      var map = olMap();
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


function clearTool( map ) {
  if( map == null ) {
    map = olMap();
  }
  if( current_tool ) {
    map.removeInteraction( current_tool );
    if( current_tool.get('id') ) {
      $('#'+current_tool.get('id') ).removeClass( 'selected' );
    }
    if( current_tool.get('cursor') ) {
      $('#map').removeClass( current_tool.get('cursor') )
    }
  }
}

function setTool( tool ) {
  var map = olMap();
  clearTool( map );
  map.addInteraction( tool )
  if( tool.get('cursor') ) {
    $('#map').addClass( tool.get('cursor') );
  }
  if( tool.get('id') ) {
    $('#'+tool.get('id') ).addClass( 'selected' );
  }
  if( tool.get('keydown') ) {
    $(window).on('keydown', tool.get('keydown') )
  }
  if( tool.get('keyup') ) {
    $(window).on('keyup', tool.get('keyup') )
  }
  current_tool = tool;
}

function updateEditor() {
  setTool( drawpath );
}

var undo = [];

Template.huntingareaeditor.rendered = function () {
  console.log("huntingarea editor created");
  var map = olMap();
  undo = [];
  mapsources['huntingareas'].forEachFeature( function ( f ) {
      undo.push( f.clone() );
      overlay.addFeature( f.clone() );
  })
  mapsources['huntingareas'].clear();
  if( overlay.getFeatures().length > 0 ) {
    setTool( getEditPathTool() )
  } else {
    setTool( getDrawPathTool() )
  }
}

Template.huntingareaeditor.destroyed = function () {
  console.log("huntingarea editor destroyed");
  clearTool()
  overlay.getFeaturesCollection().clear()
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
          clearTool();
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
    clearTool();
    editor.pop();
  },
  'click #drawtool' : function()  {
    setTool( getDrawPathTool() );
  },
  'click #edittool' : function()  {
    setTool( getEditPathTool() );
  },
  'click #deletetool' : function()  {
    setTool( getDeletePathTool() );
  }

})
