var workinglayer = null;
var overlaylayer;
var stands = [];

function getDrawPathTool() {
  var drawpath = new ol.interaction.Draw( { style:getHuntingAreaSelectionStyle ,type:'LineString', source: overlaylayer.getSource(), minPoints:2, maxPoints: 256 });
  drawpath.on('drawend', function ( e ) {
    editor.setstate('editpath')
    setTimeout( function () { updateEditor(); } , 100 );
  })
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
    features: overlaylayer.getSource().getFeaturesCollection(),
    deleteCondition: function( e ) {
      return ol.events.condition.altKeyOnly(e) && ol.events.condition.singleClick(e);
  }})
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

var undo;

function updateEditor() {

  switch( editor.getstate() ) {
    case 'drawpath':
      app.popTool();
      app.pushTool(getDrawPathTool() )
    break;
    case 'editpath':
      if( overlaylayer.getSource().getFeaturesCollection().getLength() == 0 ) {
        var route = Session.get('selected-route');
        if( route ) {
          undo = mapsources['routes'].getFeatureById( route );
          overlaylayer.getSource().addFeature( undo.clone() );
          mapsources['routes'].removeFeature( undo );
          app.popTool();
          app.pushTool( getEditPathTool() )
        } else {
          editor.setstate('drawpath');
          updateEditor();
        }
      } else {
        app.popTool();
        app.pushTool( getEditPathTool())
      }
    break;
    case 'selectstands':
      var route = Session.get('selected-route');
      var drive = getCurrentDrive();
      if( drive ) {
        var stands = []
        _.map( drive.stands, function ( v,k ) {
          if(v.route == route ) {
            stands.push( k )
          }
        });
        stands.sort( function(a,b) { return drive.stands[a].index - drive.stands[b].index; } )
        Session.set('selected-routestands', stands );
      }
      app.popTool();
      app.pushTool( getSelectStandsTool() )
    break;
  }
}

Template.pointeditor.rendered = function () {
  updateEditor();
}

Template.pointeditor.created = function () {
  var map = app.getMap();
  overlaylayer =  new ol.layer.Vector({
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
  app.addLayer( overlaylayer )
  overlaylayer.getSource().getFeaturesCollection().clear();
}

Template.pointeditor.destroyed = function () {
  console.log("route editor destroyed");
  app.popTool()
  overlaylayer.getSource().getFeaturesCollection().clear();
}

Template.pointeditor.helpers({    
    }
})


Template.pointeditor.events({

  'click #save' : function ( e ) {
    Session.set( "error",null);
  },
  'click #abort' : function ( e ) {
    if( undo ) {
      mapsources['routes'].addFeature( undo );
      undo = null;
    }
    Session.set('selected-routestands',null)
    mapsources['stands'].changed();
    editor.pop();
  },
  'click .groupselection': function( e ) {
    var id = $(e.currentTarget).attr('data');
    editor.set( 'group', id );
  },
  'click .colorselector' : function ( e ) {
    var col = parseInt( $(e.currentTarget).attr('data'));
    editor.set( 'color', col );
    overlaylayer.getSource().getFeaturesCollection().forEach( function ( f ) {
      f.set('color', col );
    })
    app.getMap().render();
  },
  'click .standitem' : function(e) {
    $('.standitem').removeClass('selected');
    $(e.currentTarget).addClass('selected');
  }
})
