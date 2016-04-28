DistanceToKm = function( dist ) {
  return Math.round(dist/100)/10;
}

var olmap=null;
var dontupdate = false;

mapsources = {};

var source_huntingareas = new ol.source.Vector(
  { features: new ol.Feature() }
)
mapsources[ 'huntingareas' ] = source_huntingareas;

var source_routes = new ol.source.Vector(
  { features: new ol.Feature() }
)

mapsources[ 'routes' ] = source_routes;

var source_stands = new ol.source.Vector(
  { features: new ol.Feature() }
)

mapsources[ 'stands' ] = source_stands;

maplayer = {};

var layer_huntingarea = new ol.layer.Vector({
  source: source_huntingareas,
  style: function( feature , res ) {
    return getHuntingAreaStyle( feature, res, false );
  }
});
layer_huntingarea.set('name','Jagdfläche');

maplayer['huntingareas'] = layer_huntingarea;

var layer_routes = new ol.layer.Vector({
  source: source_routes,
  style: function( feature , res ) {
    return getHuntingAreaStyle( feature, res, false );
  }
});
layer_routes.set('name','Anstellrouten');
maplayer['routes'] = layer_routes;

var layer_dogs = new ol.layer.Vector({
  source: source_stands,
  style: function ( f,r ) {
    return getDogStandStyle( f, r);
  }
});
layer_dogs.set('name','Hunde');
maplayer['dogs'] = layer_dogs;

var layer_stands = new ol.layer.Vector({
  source: source_stands,
  style: function ( f,r ) {
    return getStandStyle( f, r, false);
  }
});
layer_stands.set('name','Jagdliche Einrichtungen');
maplayer['stands'] = layer_stands;

gotoStand = function ( standid ) {
  var s = Stands.findOne( {_id: standid } )
  var view = app.getMap().getView();
  var pan = ol.animation.pan({duration: 500,source: view.getCenter()})
  app.getMap().beforeRender(pan)
  view.setCenter( proj4('WGS84',mapconfig.projection.name,s.location.coordinates) )
}

function getSelectionTool() {
  select = new ol.interaction.Pointer( {
    handleEvent : function ( e ) {
      if( editor.get() == null  && e.type == 'singleclick') {
        console.log("Stands:", Stands.find().count());
        //app.overlay.clear();
        var route = null;
        e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
          if( l ) {
            if( route == null ) {
              if( l == layer_stands ) {
                route = f.get('route');
              } else if( l == layer_routes ) {
                route = f.getId();
              }
            }
          }
        })
        var path = app.getModulPath();
        if( route ) {
          if( path.length == 4) {
            path[3] = route;
          } else {
            path.push( route );
          }
          app.setModulePath(path);
          Session.set('gis-selection', route );
        } else {
          if( path.length == 4) {
            path.pop();
            app.setModulePath(path);
          }
          Session.set('gis-selection', null );
        }
        source_routes.changed();
        source_stands.changed();
      }
      return true;
    }
  })
  return select;
}

Template.huntingplans.created = function() {
	this.plans = Meteor.subscribe("huntingplans");
	this.participants = Meteor.subscribe("participants");
	Session.set('error',null);
}

Template.huntingplans.destroyed = function() {
	this.participants.stop();
	this.plans.stop();
}

function updateStands() {

  if( this.stands ) {
    this.stands.stop();
  }

  this.stands = Meteor.subscribe('plan_stands', getCurrentPlanId(), getCurrentDriveIndex() ,function(e) {
    var cursor = Stands.find({});
    cursor.observeChanges({
      added:function( id, fields ) {

        var plan   = getCurrentPlan();
        var stand = new ol.Feature();
        stand.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,fields.location.coordinates) ) );
        stand.setId(id);
        stand.set('type',fields.type)
        stand.set('name',fields.name)
        stand.set('z-index', source_stands.getFeatures().length )
        var drive = getCurrentDrive();
        if( drive ) {
          s = drive.stands[ id ];
          if( s && s.user && plan.invitestates[s.user] ) {
            var state = plan.invitestates[s.user].state;
            if( state && state != 'refused') {
              stand.set('hunter', s.user );
            }
          }
          if( s && s.route ) {
            stand.set('route', s.route );
          }
        }
        source_stands.addFeature( stand );
      },
      removed:function( id ) {
        var stand = source_stands.getFeatureById( id );
        if( stand ) {
          source_stands.removeFeature( stand );
        }
      },
      changed:function( id, fields ) {
        var stand = source_stands.getFeatureById( id );
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
    })
  });
}

function updateRoutes( routes ) {
  for( id in routes ) {
    var geo = new ol.format.GeoJSON().readGeometry( routes[ id ].path , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
    var feat = source_routes.getFeatureById( id );
    if( feat == null ) {
      feat = new ol.Feature();
      feat.setId( id );
      feat.setGeometry( geo );
      feat.set('width',4);
      source_routes.addFeature( feat );
    }
    feat.set('group', routes[id].group );
    feat.set('color',routes[ id ].color);
    feat.setGeometry( geo );
  }
}

function updateArrangement( stands ) {
  for( id in stands ) {
    var feat = source_stands.getFeatureById( id );
    if( feat ) {
      if( stands[id].user ) {
        feat.set('hunter',stands[id].user );
      } else {
        feat.unset('hunter');
      }
      if( stands[id].route ) {
        feat.set('route',stands[id].route );
      } else {
        feat.unset('route' );
      }
    }
  }
}

getSelectedRoute = function( ) {

  var drive   = getCurrentDrive();
  var routeid = Session.get('gis-selection');
  if( drive ) {
    return  drive.routes[ routeid ];
  }
  return null;
}

getCurrentRoute = function() {
  return getRoute( Session.get('gis-selection') )
}

getRoute = function ( rid ) {
  var plan = getCurrentPlan();
  var drive   = getCurrentDrive();
  if( drive ) {
    var r = drive.routes[ rid ];
    if( r ) {
      var stands = []
      _.map( drive.stands, function ( v,k ) {
        if(v.route == rid ) {
          stands.push( {i:v.index,stand:k, user:v.user } )
        }
      });
      stands = stands.sort( function ( a,b ) {
        return (a.i - b.i);
      })
      r['stands'] = [];
      for( var i=0;i < stands.length;i++ ) {
        var stand = Stands.findOne({_id:stands[i].stand});
        if( stand ) {
          var user = Meteor.users.findOne({_id:stands[i].user});
          if( user && plan.invitestates[ user._id ] && plan.invitestates[ user._id ].state != 'refused') {
            user.state = plan.invitestates[ stands[i].user ].state;
            if( user._id == r.leader ) {
              user.leader = true;
            }
            stand['user'] = user;
          }
          r.stands.push( stand );
        }
      }
      var feat = source_routes.getFeatureById( rid );
      if( feat ) {
        r['length'] = DistanceToKm( feat.getGeometry().getLength() );
        r['setuptime'] = Math.round( (DistanceToKm( r['length'] )/0.41) + 3 * r['stands'].length )
      }
      return r;
    }
  }
  return null;
}

updateMapData = function () {
  olmap = app.getMap();
  if( olmap ) {
    olmap.setTarget( document.getElementById("map") );

    for( var layer in maplayer ) {
      if( maplayer[layer] instanceof ol.layer.Vector ) {
        maplayer[layer].getSource().clear();
      }
    }

    var plan   = getCurrentPlan();
    var drive  = getCurrentDriveIndex();

    if( plan == null ) {
      /*setTimeout( function( ) {
        updateMapData();
      }, 2000)*/
    } else {
      if( plan.drives.length < 1 || plan.drives[drive].shape == null ) {
        editor.push('huntingareaeditor',{ color:4 })
      } else {
        console.log("update map:", plan._id, drive );
        updateStands();
        var cursor = Plans.find( {_id:plan._id } );
        cursor.observeChanges({
          added:function( id, fields ) {
            var drive  = getCurrentDriveIndex();
            var geo = new ol.format.GeoJSON().readGeometry( fields.drives[ drive ].shape , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
            var polys = geo.getPolygons();
            for( var p=0;p < polys.length;p++ ) {
              var feat = new ol.Feature();
              feat.setGeometry( polys[p] );
              feat.set('width',2);
              feat.set('color',4);
              source_huntingareas.addFeature( feat );
              if( fields.drives != null ) {
                var drive  = getCurrentDriveIndex();
                if( fields.drives[drive] != null ) {
                  if( fields.drives[drive].routes != null ) {
                    updateRoutes( fields.drives[drive].routes )
                  }
                  if( fields.drives[drive].stands != null ) {
                    updateArrangement( fields.drives[drive].stands )
                  }
                }
              }
            }
            var map = app.getMap();
            if( map && geo && map.getTarget() ) {
              var view = app.getMap().getView();
              var pan = ol.animation.pan({duration: 500,source: view.getCenter()})
              var zoom = ol.animation.zoom({duration: 500, resolution: view.getResolution()})
              map.beforeRender(pan, zoom)
              view.fit( geo, map.getSize() );
            }

          },
          removed:function( id ) {
            source_huntingareas.clear();
          },
          changed:function( id, fields ) {
            if( fields.drives != null ) {
              var drive  = getCurrentDriveIndex();
              if( fields.drives[drive] != null ) {
                source_huntingareas.clear();
                var geo = new ol.format.GeoJSON().readGeometry( fields.drives[ drive ].shape , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
                var polys = geo.getPolygons();
                for( var p=0;p < polys.length;p++ ) {
                  var feat = new ol.Feature();
                  feat.set('width',2);
                  feat.set('color',4);
                  feat.setGeometry( polys[p] );
                  source_huntingareas.addFeature( feat );
                }
                if( fields.drives[drive].routes != null ) {
                  updateRoutes( fields.drives[drive].routes )
                }
                if( fields.drives[drive].stands != null ) {
                  updateArrangement( fields.drives[drive].stands )
                }
              }
            }
          }
        });
      }
    }
  }
}
hoverstand = null;

Template.huntingplans.helpers({
	mapEnabled: function() {
		return (getCurrentDrive() !=null)
	},
	plans: function() {
		return Plans.find({});
	},
	getSelected: function( _id ) {
		return (getCurrentPlan() && _id == getCurrentPlan()._id) ? 'selected' : '';
	},
  plan: function() {
    return getCurrentPlan();
  },
  route: function() {
    return getCurrentRoute();
  },
	getSelectedDrive : function(index) {
		return ("drive-"+index) == app.getPath()[5] ? 'selected':'';
	},
	routes: function() {
		return _.keys( getCurrentDrive().routes );
	},
	getSelectedRoute : function(id) {
		return getCurrentRouteId() == id ? 'selected':'';
	},
	routeInfo : function( id ) {
		return getCurrentDrive().routes[id].group
	},
  can_add_drives : function() {
    var plan = getCurrentPlan(true);
    if( plan && plan.drives.length < 4 ) {
      return true;
    }
    return false;
  },
  can_delete_drive : function() {
    var plan = getCurrentPlan(true);
    if( plan && plan.drives.length > 1 ) {
      return true;
    }
    return false;
  },
  can_edit_plan: function() {
    return getCurrentPlan(true);
  },
  stats : function () {
    var stats = { freestands: [], usedstands: [], unusedstands:[], placedhunters:0, unplacedhunters:0, standcount:0 , huntercount: 0 };
    var plan  = getCurrentPlan();
    var drive = getCurrentDrive();
    if( drive ) {
      var placeduser={};
      Stands.find({}).forEach( function(stand) {
        if( drive.stands[ stand._id ] == null ) {
          stats.unusedstands.push( {id:stand._id, name:stand.name, type: Standtypes[stand.type] });
        } else {
          var user = Meteor.users.findOne({_id:drive.stands[ stand._id ].user});
          if( user ) {
            placeduser[ user._id ] = 1;
            stats.usedstands.push( {id:stand._id, name:stand.name, type: Standtypes[stand.type], username: user.profile.surname+", "+user.profile.firstname });
          } else {
            var route = drive.routes[ drive.stands[ stand._id ].route ] 
            if( route ) {
              stats.freestands.push( {id:stand._id, name:stand.name, type: Standtypes[stand.type], route: route.group });
            } else {
              stats.unusedstands.push( {id:stand._id, name:stand.name, type: Standtypes[stand.type] });
            }
          }
        }
        stats.standcount ++;
      });
      for( var uid in plan.invitestates ) {
        var user = Meteor.users.findOne({_id:uid} );
        if( user && plan.invitestates[uid].state != 'refused') {
          if( placeduser[ user._id ] == 1 ) {
            stats.placedhunters++;
          } else {
            stats.unplacedhunters++;
          }

          stats.huntercount ++;
        }
      }
    }
    return stats;
  },
  hunting_plan_office : function () {
    return Session.get('huntingplan-office');
  },
  check_office_state : function ( state ) {
    return Session.get('huntingplan-office') == state ;
  },
  dragitem : function () {
    return Session.get('drag-item');
  },
  print_participants : function() {
    var data = {};
    var plan = getCurrentPlan();
    if( plan == null )
      return [];

    var alpha = 'a,ä,b,c,d,e,f,g,h,i,j,k,l,m,n,o,ö,p,q,r,s,t,u,ü,v,w,x,y,z,1,2,3,4,5,6,7,8,9,0'.toUpperCase().split(',');
    for( var c=0;c < alpha.length;c++ ) {
      data[ alpha[c] ] = { name: alpha[c], colspan: (plan.drives.length+1) ,user: [] };
    }
    for( var uid in plan.invitestates ) {
      if( plan.invitestates[uid].state != 'refused' ) {
        var user = Meteor.users.findOne({_id:uid});
        if( user ) {
          var letter = user.profile.surname.charAt(0).toUpperCase();
          user['drives'] = [];
          user['name'] = user.profile.surname;
          for( var d = 0; d < plan.drives.length; d++ ) {
            var item = { index: d+1, value: "-" };
            if( plan.drives[d].stands ) {
              for( var sid in plan.drives[d].stands ) {
                if( plan.drives[d].stands[ sid ].user == uid ) {
                  var stand = Stands.findOne({_id:sid});
                  var route = plan.drives[d].routes[ plan.drives[d].stands[sid].route ];
                  if( stand && route ) {
                    item.value = ((route.group) ? 'G'+route.group : '-' ) +"."+stand.name;
                  } else {
                    item.value = "Los";
                  }
                  break;
                }
              }
            }
            user.drives.push(item);
          }
          data[ letter ].user.push( user );
        }
      }
    }
    /// sort by name and split to pages ...
    var pages = [[]];
    var cp = 0;
    var lines = 0;
    for( var k in data ) {
      if( data[k].user.length > 0 ) {
        data[k].user = _.sortBy( data[k].user, 'name' );
        lines +=  data[k].user.length+1;
        if( lines > 24 ) {
          pages.push([]);
          cp = pages.length-1;
          lines = 0;
        }
        pages[cp].push( data[k] );
      }
    }
    return pages;
  },
  print_routes: function () {
    var plan = getCurrentPlan();
    var drive = getCurrentDrive();
    var data = [];
    var i = 0;
    if( drive ) {
      for( var rid in drive.routes ) {
        var stands = [];
        for( var sid in drive.stands ) {
          if( drive.stands[sid].route == rid ) {
            var stand = Stands.findOne({_id:sid});
            if( stand ) {
                stand['index'] = drive.stands[sid].index;
                var user = Meteor.users.findOne({_id:drive.stands[sid].user});
                if( user && plan.invitestates[ user._id ] && plan.invitestates[ user._id ].state != 'refused' ) {
                  if( user._id == drive.routes[rid].leader ) {
                    user['leader'] = true;
                  }
                  stand['user'] = user;
                }
                stands.push( stand )
            }
          }
        }
        for( var e=stands.length; e < 18;e++ ) {
          stands.push( {index:100} );
        }
        data.push( { index: drive.routes[rid].group,plan: getCurrentPlanId(), drive: ( plan.drives.length > 1) ? (getCurrentDriveIndex()+1):0, group: drive.routes[rid],route: rid, stands: _.sortBy(stands,'index') } );
      }
    }
    return _.sortBy(data,'index');
  },
  print_stands: function() {
    var data = [];
    var plan = getCurrentPlan();
    var drive = getCurrentDrive();
    var data = [];
    var i = 0;
    if( drive ) {
      for( var sid in drive.stands ) {
        var stand = Stands.findOne({ _id:sid });
        if( stand && drive.stands[sid].route && drive.routes[ drive.stands[sid].route] ) {
          stand.route = drive.routes[ drive.stands[sid].route ];
          if( plan.invitestates[drive.stands[sid].user] != 'refused' ) {
            stand.hunter = Meteor.users.findOne({ _id: drive.stands[sid].user });
          }
          stand.index = (parseInt(stand.route.group)*100) + drive.stands[sid].index;
          data.push( stand );
        }
      }
    }
    var rv = _.sortBy( data, 'index' );
    if( rv.length > 0 ) {
      rv[0]['first'] = true;
    }
    return rv;
  },
  print_options : function() {
    return {
      'max_shot_range':70,
      'stand_area_size':500,
      'timetable':[
        {time:'8:00',item:'Treffen am Streckenplatz'},
        {time:'9:00',item:'Begrüßung'},
        {time:'9:30',item:'Ausfahren der Schützen'},
        {time:'10:00',item:'Schnallen der Hunde'},
        {time:'10:30',item:'Begin des Treibens'},
        {time:'12:00',item:'-- 15 min Aufbruchpause nach Ansage --'},
        {time:'14:00',item:'Hahn in Ruh'},
        {time:'15:30',item:'Verblasen der Strecke'},
      ],
      'game_approval' : [
        {text:'<p><b>Schwarzwild</b>:Frischlinge, Überläufer, Sauen und Keiler<sup>1</sup></p>'},
      ],
      'safety_instructions': {

      },
      'additional_hints':{

      }
    }
  }
})

Template.huntingplans.events({

	'click .plan': function( e ) {
		app.setSubPath(4, $(e.currentTarget).attr('data') )
		//updateMapData();
	},
	'click .drive': function( e ) {
		console.log("test");
		app.setSubPath(5, 'drive-'+$(e.currentTarget).attr('data') );
		updateMapData();
	},
	'click .route': function( e ) {
		var path = app.getModulPath();
		path[3] = $(e.currentTarget).attr('data');
		app.setModulePath(path);
		Session.set('gis-selection', path[3] );
		source_routes.changed();
		source_stands.changed();
	},
  'click .standlink' : function ( e ) {
    var id = $(e.currentTarget).attr('data');
    gotoStand(id);
  },
  'click #enter-hunting-office':function() {
    Session.set('huntingplan-office', 'participants' );
  },
  'click #leave-hunting-office':function() {
    Session.set('huntingplan-office', null );
    setTimeout( function() { app.getMap().updateSize(); } , 200);
  },
  'click #participants' : function () {
    Session.set('huntingplan-office', 'participants' );
  },
  'click #routespages' : function () {
    Session.set('huntingplan-office', 'routespages' );
  },
  'click #hunterpages' : function () {
    Session.set('huntingplan-office', 'hunterpages' );
  },
  'click #select-stands': function () {
    editor.push('routeeditor', getSelectedRoute(), 'selectstands' );
  },
  'click #edit-route': function () {
    editor.push('routeeditor', getSelectedRoute(), 'editpath' );
  },
  'click #delete-route': function () {
    Meteor.call('deleteHuntingPlanRoute', getCurrentPlanId(), getCurrentDriveIndex(), Session.get('gis-selection'), function (e) {
      if( e )
        console.log(e);
      Session.set('gis-selection',null)
      updateMapData();
    })
  },
  'click #edit-plan':function( e ) {
    editor.push('huntingareaeditor', {color:4, width: 2} );
  },
  'click #edit-shape': function( e ) {
    editor.push('huntingareaeditor', {color:4, width: 2} );
  },
  'click #new-drive': function( e ) {
    Meteor.call('addHuntingPlanDrive', getCurrentPlanId() , function ( e, r ) {
      if( e == null ) {
        app.setModulePath(['huntingplans', getCurrentPlanId(), 'drive-'+r]);
        updateMapData();
      }
    })
  },
  'click #delete-drive': function ( e ) {
    Meteor.call('deleteHuntingPlanDrive', getCurrentPlanId() , getCurrentDriveIndex(), function ( e ) {
      if( e == null ) {
        app.setModulePath(['huntingplans', getCurrentPlanId(), 'drive-0']);
        updateMapData();
      }
    })
  },
  'click #delete-plan': function( e ) {
    Meteor.call('deleteHuntingPlan', getCurrentPlanId() , function (e ) {
      app.setModulePath(['huntingplans','schedule']);
    })
  },
  'click #new-route' :function( e ) {
    editor.push('routeeditor', { group: '', leader: '', color: (parseInt(Math.random()*100) % Colors.length), width: 4 }, "drawpath");
  },
  'click #arrange-hunter' :function(e) {
    editor.push('arrangehuntereditor', {} );
  }
})

Template.userdragitem.helpers({
  data: function() {
    return Session.get('drag-item');
  },
  user: function () {
    return Meteor.users.findOne({ _id: Session.get('drag-item').user })
  },
  stand: function( ) {
    return null;
  }
})

Template.huntingplankarte.rendered = function() {
	if( this.stands ) {
    this.stands.stop();
  }

	var olmap = app.getMap();

  for( var layer in maplayer ) {
    app.addLayer( maplayer[layer] );
  }
  app.pushTool( getSelectionTool() );
  updateMapData();
}

Template.huntingplankarte.destroyed = function() {
	if( this.stands ) {
		this.stands.stop();
	}
	for( var layer in maplayer ) {
		app.removeLayer( maplayer[layer] );
	}
	app.popTool();
}
