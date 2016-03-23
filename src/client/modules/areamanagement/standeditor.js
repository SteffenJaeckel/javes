var selectedFeature = null;
var selection = new ol.Collection()
var undo = null;

function getEditPointTool() {
  var drawpath = new ol.interaction.Modify( { style:getHuntingAreaSelectionStyle ,pixelTolerance: 32,type:'Point', features: selection });
  drawpath.on('drawend', function ( e ) {
  })
  drawpath.set('cursor','draw-cursor');
  drawpath.set('keydown', function( e ) {
  });
  return drawpath;
}


Template.standeditor.created = function () {
  var map = app.getMap();

  app.getLayerByName("Jagdliche Einrichtungen").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",1);
  })
  app.getLayerByName("Berichte").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",1);
  })

  var stand = new ol.Feature();
  if( Session.get('standdata').location != null ) {
    selectedFeature = app.getLayerByName("Jagdliche Einrichtungen").getSource().getFeatureById( Session.get('standdata')._id )
    selectedFeature.set("disabled",null);
    undo = selectedFeature.clone();
  } else {
    selectedFeature = new ol.Feature();
    selectedFeature.setGeometry( new ol.geom.Point( map.getView().getCenter() ) );
    selectedFeature.setId( '0' );
    selectedFeature.set('type', parseInt( Session.get('standdata').type ) )
    selectedFeature.set('name', Session.get('standdata').name )
    selectedFeature.set('area', getCurrentArea()._id);
    selectedFeature.set('color',0);
    selectedFeature.set('z-index', 1 )
    app.getLayerByName("Jagdliche Einrichtungen").getSource().addFeature( selectedFeature );
  }

  selection.push( selectedFeature );

  app.pushTool( getEditPointTool() )
}

Template.standeditor.destroyed = function () {
  console.log("route editor destroyed");
  app.popTool()
  app.getLayerByName("Jagdliche Einrichtungen").getSource().forEachFeature( function( feature )  {
      feature.set("disabled",null);
  })
  app.getLayerByName("Berichte").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",null);
  })
}

Template.standeditor.helpers({
  name: function () {
    return Session.get('standdata').name;
  },
  desc: function() {
    return Session.get('standdata').desc;
  },
  standtype : function( id ) {
    return (id == Session.get('standdata').type) ? "selected":"";
  }
})


Template.standeditor.events({
  'click #save' : function ( e ) {
    Session.set( "error",null);
    var location = new ol.format.GeoJSON().writeGeometryObject( selectedFeature.getGeometry() , { featureProjection: mapconfig.projection.name ,dataProjection:'WGS84' });
    setObj('standdata','location',location);
    var data = Session.get('standdata');
    if( selectedFeature.getId() == '0'  ) {
      Meteor.call('newStand', data.name, data.desc, parseInt(data.type), data.location, function(e,id) {
        if( e ) {
          Session.set( "error", { text: e.reason });
        } else {
          app.getLayerByName("Jagdliche Einrichtungen").getSource().removeFeature( selectedFeature );
          editor.pop();
          Session.set("standdata",null);
        }
  		})
    } else {
      Meteor.call('editStand', data._id, data.name, data.desc, parseInt(data.type), data.location, function(e) {
        if( e ) {
          Session.set( "error", { text: e.reason });
        } else {
          editor.pop();
        }
  		})
    }
  },
  'click #abort' : function ( e ) {
    if( undo ) {
      selectedFeature.set('name',undo.get('name'));
      selectedFeature.set('type',undo.get('type'));
      console.log( undo.getGeometry().getCoordinates() );
      selectedFeature.setGeometry( undo.getGeometry() );
      undo = null;
    } else {
      app.getLayerByName("Jagdliche Einrichtungen").getSource().removeFeature( selectedFeature );
      Session.set('standdata', null );
    }
    editor.pop();
  },
  'click .standtype' : function ( e ) {
    selectedFeature.set("type",$(e.currentTarget).attr("data"))
    setObj('standdata','type', $(e.currentTarget).attr("data"));
  },
	'blur #stand-name': function( e ) {
    selectedFeature.set("name",$('#stand-name').val())
		setObj('standdata','name',$('#stand-name').val());
	},
	'blur #stand-desc': function( e ) {
		setObj('standdata','desc',$('#stand-desc').val());
	}
})
