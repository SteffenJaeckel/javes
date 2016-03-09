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


Template.roleeditor.created = function () {
  var map = app.getMap();

  app.getLayerByName("Rollen").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",1);
  })

  var stand = new ol.Feature();
  var edit = editor.get();

    selectedFeature = new ol.Feature();
    selectedFeature.setGeometry( new ol.geom.Point( map.getView().getCenter() ) );
    selectedFeature.setId( 'newrole'+Math.random() );
    selectedFeature.set('name', edit.name )
    selectedFeature.set('z-index', 1 )
    app.getLayerByName("Rollen").getSource().addFeature( selectedFeature );

  updateFeatureText();
  selection.push( selectedFeature );

  app.pushTool( getEditPointTool() )
}

Template.roleeditor.destroyed = function () {
  console.log("role editor destroyed");
  app.popTool()
  app.getLayerByName("Rollen").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",null);
  })
}

Template.roleeditor.rendered = function() {
  $('.datetime.date').datetimepicker({
      format: 'D.MM.YYYY',
      locale: 'de',
      maxDate: new Date(),
      viewMode: 'days'
  });

  $('.datetime.time').datetimepicker({
      locale: 'de',
      format: 'HH:mm',
  });
}

Template.roleeditor.helpers({
  name: function() {
    return editor.get().name;
  },
  type: function() {
    return editor.get().type;
  },
  inviteroles: function() {
    var roles = [];
    var myrole = app.getRole();
    console.log( "myrole",myrole );
    return roles;
  },
  permissions: function( ) {
    var myrole = app.getRole();
    var permissions = [];
    var current = editor.get().permissions;
    for( var m in myrole.modules ) {
      var actions = [];
      for( var a in myrole.modules[m].actions ) {
          actions.push( { name: myrole.modules[m].actions[a].name , data : m+"."+a, isChecked: pathlib.get(current , m+"."+a ) }  );
      }
      permissions.push( {name: myrole.modules[m].name , id: m, actions : actions } )
    }
    return permissions;
  }
})

function updateFeatureText() {
  selectedFeature.set('text', "text" );
}

Template.roleeditor.events({
  'click #save' : function ( e ) {
    Session.set( "error",null);
    var location = new ol.format.GeoJSON().writeGeometryObject( selectedFeature.getGeometry() , { featureProjection: mapconfig.projection.name ,dataProjection:'WGS84' });
    setObj('reportdata','location',location);
    var data = Session.get('reportdata');
    if( selectedFeature.getId() == 'newstand'  ) {
      Meteor.call('addReport', data, function(e,id) {
  			console.log(e,id);
        if( e ) {
          Session.set( "error", e);
        } else {
          app.getLayerByName("Rollen").getSource().removeFeature( selectedFeature );
          editor.pop();
        }
  		})
    } else {
      Meteor.call('changeReport', data, function(e) {
  			console.log(e);
        if( e ) {
          Session.set( "error", e);
        } else {
          editor.pop();
        }
  		})
    }
  },
  'click #abort' : function ( e ) {
    if( undo ) {
      selectedFeature.set('name',undo.get('name'));
      selectedFeature.set('color',undo.get('color'));
      selectedFeature.setGeometry( undo.getGeometry() );
      undo = null;
    } else {
      Session.set('reportdata',null);
      app.getLayerByName("Rollen").getSource().removeFeature( selectedFeature );
    }
    editor.pop();
  },
  'click .action' : function( e ) {
    var current = editor.get().permissions;
    if( $(e.currentTarget).attr("checked") == "checked" ) {
      pathlib.set( current , $(e.currentTarget).attr("data"), null );
    } else {
      pathlib.set( current , $(e.currentTarget).attr("data"),"true");
    }
    editor.set("permissions",current)
  },
	'blur #name': function( e ) {
		editor.set('name',$(e.currentTarget).val() )
	}
})
