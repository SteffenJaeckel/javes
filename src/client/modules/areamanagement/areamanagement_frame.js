function getSelectionTool() {
  select = new ol.interaction.Pointer( {
      handleEvent : function ( e ) {
        if( editor.get() == null  && e.type == 'singleclick') {
          var route = null;
          e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
          if( l ) {
            if( l.get('name') == 'Jagdliche Einrichtungen' ) {
              var stand = Stands.findOne({_id: f.getId() });
          		if( stand && Session.set('standdata') == null ) {
          			Session.set('standdata',stand);
          			modals.push('viewstand');
                return false;
          		}
            }
            if( l.get('name') == 'Berichte' ) {
              var report = Reports.findOne({_id: f.getId() });
          		if( report && Session.set('reportdata') == null ) {
          			Session.set('reportdata',report);
          			modals.push('reportview');
                return false;
          		}
            }
          }
        })
      }
      return true;
    }
  });
  return select;
}


var huntingarea_layer = {};
var huntingareastands_layer = {};
var huntingareareports_layer = {};

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
  var olmap = app.getMap();
  if( olmap ) {
    olmap.setTarget( document.getElementById('map') );
    var area = getCurrentArea();
    if( area ) {
      huntingarea_layer.getSource().clear();
      var cursor = Areas.find( {_id:area._id, geometry: {$exists:true} } );
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

function fitArea( area ) {
  var map = app.getMap();
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
      console.log( role );
    }
}

Template.areamanagement_frame.created = function() {

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


  DataChangeHandler.add("areamap", function ( path ) {
     console.log("call areamap Datachange handler ...");
     updateMap();
     if( area ) {
       fitArea( area );
     }
  })
}

Template.areamanagement_frame.rendered = function() {
  app.pushTool( getSelectionTool());
  updateMap();
  var area = getCurrentArea();
  if( area ) {
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
  DataChangeHandler.remove("areamap");
  if( this.stands ) {
    this.stands.stop();
  }
  if( this.reports ) {
    this.reports.stop();
  }
  app.popTool();
}

Template.areamanagement_frame.events({
  'click #area-share' : function() {
    Session.set('modal', { shareinfo: true } );
  },
  'click #adjust-area' : function() {
    editor.push("areaeditor",{},"");
  },
  'click #area-overview' : function() {
    modals.push("areaoverview",{});
  },
  'click #report-overview' : function() {
    modals.push("reportoverview",{});
  }
})
