function getSelectionTool() {
  select = new ol.interaction.Pointer( {
      handleEvent : function ( e ) {
        if( editor.get() == null  && e.type == 'singleclick') {
          var route = null;
          Session.set('standdata',null);
          Session.set('reportdata',null);
          Session.set('gis-selection', null );
          e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
            if( l ) {
              if( l.get('name') == 'Berichte' ) {
            		if( Session.get('reportdata') == null ) {
            			AreaManagement_SelectReport(f.getId())
                  return false;
            		}
              }
              if( l.get('name') == 'Jagdliche Einrichtungen' ) {
            		if( Session.get('standdata') == null ) {
                  AreaManagement_SelectStand( f.getId() );
                  return false;
            		}
              }
            }
          })
          huntingareastands_layer.getSource().changed();
          huntingareareports_layer.getSource().changed();
      }
      return true;
    }
  });
  return select;
}


var huntingarea_layer = {};
var huntingareastands_layer = {};
var huntingareareports_layer = {};


AreaManagement_SelectStand = function ( id, center, zoom ) {

  var stand = Stands.findOne({_id: id });
  if( stand ) {
    if( this.comments )
      this.comments.stop();

    if( center ) {
      var view = app.getMap().getView();
      var pan = ol.animation.pan({duration: 500, source: view.getCenter()})
      var zm = ol.animation.zoom( {duration: 500, resolution: view.getResolution()} )
      app.getMap().beforeRender(pan,zm)
      view.setCenter( proj4('WGS84',mapconfig.projection.name,stand.location.coordinates) )
      if( zoom )
        view.setZoom( zoom );
    }

    this.comments = Meteor.subscribe("comments",id )
    Session.set('standdata',stand);
    Session.set('gis-selection', id );
  }
}

AreaManagement_SelectReport = function( id, center ) {
  var report = Reports.findOne({_id: id });
  if( report ) {
    if( this.comments )
      this.comments.stop();

    if( center ) {
      var view = app.getMap().getView();
      var pan = ol.animation.pan({duration: 500,source: view.getCenter()})
      app.getMap().beforeRender(pan)
      view.setCenter( proj4('WGS84',mapconfig.projection.name,report.location.coordinates) )
    }

    this.comments = Meteor.subscribe("comments",id )
    Session.set('reportdata',report);
    Session.set('gis-selection', id );
  }
}

function updateStands() {

  if( this.stands )
    this.stands.stop();

  var area = getCurrentArea();
  if( area == null )
    return;

  this.stands = Meteor.subscribe('area_stands', area._id ,function(e) {
    var cursor = Stands.find({});
    cursor.observeChanges({
      added:function( id, fields ) {
        var stand = new ol.Feature();
        stand.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,fields.location.coordinates) ) );
        stand.setId(id);
        stand.set('type',fields.type)
        stand.set('name',fields.name)
        stand.set('route',id);
        stand.set('area', 1 );
        stand.set('color',0);
        stand.set('z-index', huntingareastands_layer.getSource().getFeatures().length )
        huntingareastands_layer.getSource().addFeature( stand );
      },
      removed:function( id ) {
        var stand = huntingareastands_layer.getSource().getFeatureById( id );
        if( stand ) {
          huntingareastands_layer.getSource().removeFeature( stand );
        }
      },
      changed:function( id, fields ) {
        var stand = huntingareastands_layer.getSource().getFeatureById( id );
        if( fields.name ) {
          stand.set('name',fields.name)
        }
        if( fields.type ) {
          stand.set('type',fields.type)
        }
        if( fields.location ) {
          stand.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,fields.location.coordinates) ) );
        }
      }
    });
  });
}

function updateReports() {
  if( this.reports )
    this.reports.stop();

  var area = getCurrentArea();
  if( area == null )
    return;

  this.reports = Meteor.subscribe('area_reports', area._id ,function(e) {
    var cursor = Reports.find({});
    cursor.observeChanges({
      added:function( id, fields ) {
        var report = new ol.Feature();
        report.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,fields.location.coordinates) ) );
        report.setId(id);
        report.set('type',fields.type)
        if( fields.type == 3 ) {
            report.set('text', ((fields.gender==0) ? "M ":"W ")+fields.ageclass );
        }
        report.set('color',fields.gametype );
        report.set('route', id );
        report.set('z-index', huntingareareports_layer.getSource().getFeatures().length )
        huntingareareports_layer.getSource().addFeature( report );
      },
      removed:function( id ) {
        var report = huntingareareports_layer.getSource().getFeatureById( id );
        if( report ) {
          huntingareareports_layer.getSource().removeFeature( report );
        }
      },
      changed:function( id, fields ) {
        var report = huntingareareports_layer.getSource().getFeatureById( id );
        if( fields.name ) {
          report.set('name',fields.name)
        }
        if( fields.type ) {
          report.set('type',fields.type)
        }
        if( fields.location ) {
          report.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,fields.location.coordinates) ) );
        }
      }
    });
  });
}

function updateMap() {
	updateStands();
	updateReports();
  var olmap = app.getMap();
  if( olmap ) {
    olmap.setTarget( document.getElementById('map') );
    var area = getCurrentArea();
		huntingarea_layer.getSource().clear();
    if( area ) {
      var cursor = Areas.find( { _id:area._id, geometry: {$exists:true} } );
      cursor.observeChanges({
        added:function( id, fields ) {
          var geo = new ol.format.GeoJSON().readGeometry( fields.geometry , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
          var polys = geo.getPolygons();
          for( var p=0;p < polys.length;p++ ) {
            var feat = new ol.Feature();
            feat.setGeometry( polys[p] );
            feat.set('width',2);
            feat.set('color',4);
            huntingarea_layer.getSource().addFeature( feat );
          }
          updateStands();
          updateReports();
        },
        removed:function( id ) {
          huntingarea_layer.getSource().clear();
        },
        changed:function( id, fields ) {
          huntingarea_layer.getSource().clear();
          var geo = new ol.format.GeoJSON().readGeometry( fields.geometry , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
          var polys = geo.getPolygons();
          for( var p=0;p < polys.length;p++ ) {
            var feat = new ol.Feature();
            feat.setGeometry( polys[p] );
            feat.set('width',2);
            feat.set('color',4);
            huntingarea_layer.getSource().addFeature( feat );
          }
          updateStands();
          updateReports();
        }
      });
    }
  }
}

fitArea = function( area ) {

	Session.set('gis-selection',null)
	Session.set('standdata',null)
	Session.set('reportdata',null)

  var map = app.getMap();

  if( this.allocations ) {
    this.allocations.stop();
  }
  this.allocations = Meteor.subscribe("allocations", area._id );

  updateMap();

  if( area.geometry != null ) {
    var geo = new ol.format.GeoJSON().readGeometry( area.geometry , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
  }

  if( map && map.getSize() ) {
    var view = app.getMap().getView();
    var pan = ol.animation.pan({duration: 500,source: view.getCenter()})
    var zoom = ol.animation.zoom({duration: 500, resolution: view.getResolution()})
    map.beforeRender(pan, zoom)
    if( geo ) {
      view.fit( geo , map.getSize()  );
    } else {
      var role = app.getRole();
			var geo = new ol.format.GeoJSON().readGeometry( role.location , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
			view.fit( geo , map.getSize()  );
			view.setZoom( 16 );
			console.log( role );
			editor.push("areaeditor",{},"");
    }
  }

}

Template.areamanagement_frame.created = function() {
}

Template.areamanagement_frame.rendered = function() {

	var olmap = app.getMap();

  huntingarea_layer = new ol.layer.Vector({
    source: new ol.source.Vector() ,
    style: function ( f,r ) {
      return getHuntingAreaStyle( f, r);
    }
  });
  huntingarea_layer.set('name','Pirschbezirke');
  olmap.addLayer( huntingarea_layer );

  huntingareastands_layer = new ol.layer.Vector({
    source: new ol.source.Vector() ,
    style: function ( f,r ) {
      return getStandStyle( f, r, false);
    }
  });
  huntingareastands_layer.set('name','Jagdliche Einrichtungen');
  olmap.addLayer( huntingareastands_layer );

  huntingareareports_layer = new ol.layer.Vector({
    source: new ol.source.Vector() ,
    style: function ( f,r ) {
      return getReportStyle( f, r, false );
    }
  });
  huntingareareports_layer.set('name','Berichte');
  olmap.addLayer( huntingareareports_layer );

  app.pushTool( getSelectionTool());
  var area = getCurrentArea();
  if( area ) {
    updateMap();
    fitArea( area );
  }
}

Template.areamanagement_frame.destroyed = function() {
  var olmap = app.getMap();
  if( olmap ) {
    olmap.removeLayer( huntingarea_layer );
    olmap.removeLayer( huntingareareports_layer );
    olmap.removeLayer( huntingareastands_layer );
  }

  if( this.stands ) {
    this.stands.stop();
  }

  if( this.reports ) {
    this.reports.stop();
  }

  if( this.allocations ) {
    this.allocations.stop();
  }

  app.popTool();
}


Template.areamanagement_frame.helpers({
  viewercount: function () {
    return _.keys(getCurrentArea().viewer).length;
  },
  areasize : function () {
    var area = getCurrentArea();
    if( area && area.geometry != null ) {
      var geo = new ol.format.GeoJSON().readGeometry( area.geometry , { dataProjection:'WGS84', featureProjection: mapconfig.projection.name });
      return Math.round( geo.getArea()/1000 ) / 10;
    }
    return 0.0;
  },
  framewidth: function () {
    return ( Session.get('standdata') != null ) ?  600 : ( Session.get('reportdata') != null ) ? 400 : 300;
  },
  isstandselected: function() {
    return Session.get('standdata') != null;
  },
  isreportselected: function() {
    return Session.get('reportdata') != null;
  },
  numstands : function() {
    return Stands.find({type:{$in:[1,2,3]}} ).count();
  },
  numviews: function() {
    return Reports.find({type:1}).count();
  },
  nummisses: function() {
    return Reports.find({type:2}).count();
  },
  numkills: function() {
    return Reports.find({type:3}).count();
  },
  areamessages: function() {
    var area = getCurrentArea();
    if( area )
      return Notifications.find({"msg.areaId":area._id});
    return 0;
  }
})

Template.areamanagement_frame.events({
  'click #area-share' : function() {
    Session.set('modal', { shareinfo: true } );
  },
  'click #adjust-area' : function() {
    editor.push("areaeditor",{},"");
  },
  'click #edit-area' : function() {
    var current = getCurrentArea();
    modals.push("editarea",current,"");
  },
  'click #area-overview' : function() {
    modals.push("areaoverview",{});
  },
  'click #delete-area' : function() {
    if( confirm("Wollen sie wirklich den Pirschbezirk löschen ?" ) ) {
      Meteor.call('deleteArea', getCurrentArea()._id , function( e ) {
        if( e ) {
          console.log( e );
        }
      })
    }
  },
  'click #report-overview' : function() {
    modals.push("reportoverview",{});
  },
  'click #new-stand' : function() {
    Session.set("standdata", { type:1, desc:"", name: "1" });
    editor.push("standeditor",{} );
  },
  'click #new-kill-report' : function() {
    Session.set("reportdata", { type:3, desc:"", gametype:1, hunttype:1, gender:0, ageclass:0, badgeid: 0, date: new Date() });
    editor.push("reporteditor",{} );
  },
  'click #new-view-report' : function() {
    Session.set("reportdata", { type:1, desc:"", gametype:1, date: new Date() });
    editor.push("reporteditor",{} );
  },
  'click #new-miss-report' : function() {
    Session.set("reportdata", { type:2, desc:"", gametype:1, date: new Date() });
    editor.push("reporteditor",{} );
  }
})
