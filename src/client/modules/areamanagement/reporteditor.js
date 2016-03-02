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


Template.reporteditor.created = function () {
  var map = app.getMap();

  app.getLayerByName("Jagdliche Einrichtungen").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",1);
  })
  app.getLayerByName("Berichte").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",1);
  })

  var stand = new ol.Feature();
  if( Session.get('reportdata').location != null ) {
    selectedFeature = app.getLayerByName("Berichte").getSource().getFeatureById( Session.get('reportdata')._id )
    selectedFeature.set("disabled",null);
    undo = selectedFeature.clone();
  } else {
    selectedFeature = new ol.Feature();
    selectedFeature.setGeometry( new ol.geom.Point( map.getView().getCenter() ) );
    selectedFeature.setId( 'newstand' );
    selectedFeature.set('type',Session.get('reportdata').type)
    selectedFeature.set('name',Session.get('reportdata').name)
    selectedFeature.set('color',Session.get('reportdata').gametype);
    selectedFeature.set('z-index', 1 )
    app.getLayerByName("Berichte").getSource().addFeature( selectedFeature );
  }

  selection.push( selectedFeature );

  app.pushTool( getEditPointTool() )
}

Template.reporteditor.destroyed = function () {
  console.log("route editor destroyed");
  app.popTool()
  app.getLayerByName("Jagdliche Einrichtungen").getSource().forEachFeature( function( feature )  {
      feature.set("disabled",null);
  })
  app.getLayerByName("Berichte").getSource().forEachFeature( function( feature )  {
    feature.set("disabled",null);
  })
}

Template.reporteditor.helpers({
  is: function( type ) {
    return Session.get('reportdata').type == type;
  },
  isMode : function( type ) {
    return (Session.get('reportdata').hunttype == type);
  },
  type: function( ) {
    return Session.get('reportdata').type;
  },
  selectedGameType : function( t ) {
    return Session.get('reportdata').gametype == t;
  },
  name: function () {
    return Session.get('reportdata').name;
  },
  desc: function() {
    return Session.get('reportdata').desc;
  },
  error : function() {
  	return Session.get('report_error');
  },
  gender : function() {
  	return (Session.get('reportdata').gender == 0)? '♂':'♀';
  },
  ageclass : function() {
  	return Session.get('reportdata').ageclass;
  },
  badgeid : function() {
  	return Session.get('reportdata').badgeid;
  },
  hunterName : function() {
  	return Session.get('reportdata').name;
  },
  hunterSurName : function() {
  	return Session.get('reportdata').surname;
  },
  date : function() {
  	return formatDate( Session.get('reportdata').date );
  },
  time : function() {
  	return formatTime(Session.get('reportdata').date);
  },
  selectedGameType : function( id ) {
  	return (Session.get('reportdata').gametype == id) ? 'selected':'';
  }
})


Template.reporteditor.events({
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
          app.getLayerByName("Berichte").getSource().removeFeature( selectedFeature );
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
      console.log( undo.getGeometry().getCoordinates() );
      selectedFeature.setGeometry( undo.getGeometry() );
      undo = null;
    } else {
      Session.set('reportdata',null);
      app.getLayerByName("Berichte").getSource().removeFeature( selectedFeature );
    }
    editor.pop();
  },
	'click #change-gender': function( e ) {

		var kr = Session.get('reportdata');
		console.log(kr)
		kr.gender = (kr.gender+1)%2;
		Session.set('reportdata',kr);
	},
	'click .hunttype': function( e ) {
		setObj('reportdata','hunttype',parseInt($(e.currentTarget).attr('data')));
	},
	'click .gametype': function( e ) {
		setObj('reportdata','gametype',parseInt($(e.currentTarget).attr('data')));
	},
	'blur #name': function( e ) {
		setObj('reportdata','name',$(e.currentTarget).val());
	},
	'blur #surname': function( e ) {
		setObj('reportdata','surname',$(e.currentTarget).val());
	},
	'blur #change-ageclass': function( e ) {
		setObj('reportdata','ageclass',$(e.currentTarget).val());
	},
	'blur #change-badgeid': function( e ) {
		setObj('reportdata','badgeid',$(e.currentTarget).val());
	},
	'blur #change-desc': function( e ) {
		setObj('reportdata','desc',$(e.currentTarget).val());
	},
	'blur .datetime': function( e ) {
		try {
			var kr = Session.get('reportdata')
			kr.date = parseDate( $('#change-date').val(), $('#change-time').val()  , kr.date )
			Session.set('reportdata',kr);
			Session.set('report_error',null);
		} catch ( e ) {
			setObj('report_error',e,true);
		}
	},
	'keypress .datetime': function( e ) {
		if( e.keyCode == 13) {
			try {
				var kr = Session.get('reportdata')
				kr.date = parseDate( $('#change-date').val(), $('#change-time').val() , kr.date )
				Session.set('reportdata',kr);
				Session.set('report_error',null);
			} catch ( e ) {
				setObj('report_error',e,true);
			}
		}
	}
})
