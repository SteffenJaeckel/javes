mapconfig = {};

Template.app.created = function () {
  this.customers = Meteor.subscribe("customers");
  this.permissions = Meteor.subscribe("permissions");
}

Template.app.rendered = function() {
  console.log("Kill editor")
  editor.pop();
}

Template.app.destroed = function () {
  this.customers.stop();
  this.permissions.stop();
}

function getSelectedItem( items , selection ) {
  if( selection == null ) {
    return null;
  }
  for( var i=0;i < items.length;i++ ) {
    if( items[i].id == selection ) {
      return items[i];
    }
  }
  return null;
}

getBaseLayer = function ( type ) {
  var layers = [];
  if( mapconfig.layer.length  == 0 ) {
    return layers;
  }
  if( type == null || type > mapconfig.layer.length-1 ) {
    var selected = 2;
  } else {
    var selected = type;
  }

  for( var l=0;l < mapconfig.layer[selected].ollayers.length;l++  ) {
    var layer = new ol.layer.Tile({
        source: new ol.source.TileWMS({
          attributions:  [ new ol.Attribution( { html: mapconfig.layer[selected].ollayers[l].attribution } )],
          url: mapconfig.layer[selected].ollayers[l].url,
          params: mapconfig.layer[selected].ollayers[l].params,
          mapserver: mapconfig.layer[selected].ollayers[l].server,
        }),
        opacity:mapconfig.layer[selected].ollayers[l].opacity
    });
    layers.push( layer );
  }
  return layers;
}


DataChangeHandler = {
	items: {},
	add : function( key, func ) {
		console.log("add datachange handler "+key );
		DataChangeHandler.items[ key ] = func;
	},
	remove : function( key ) {
		console.log("remove datachange handler "+key );
		delete DataChangeHandler.items[ key ]
	},
	call : function ( path ) {
		for( var k in DataChangeHandler.items ) {
			DataChangeHandler.items[k]( path );
		}
	}
};

app = {

  toolstack : [],

	getMapConfig: function() {
		var auth = Meteor.user().profile.currentpath;
    var path = app.getPath();
    if( path.length >=1 ) {
      var customer = Customers.findOne( {_id: path[0] });
      if( customer ) {
				return customer.mapconfig;
			}
		}
		return {
		  'projection' : { name:'EPSG:25833',code:'+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs' },
		  'layer' : []
		};
	},
  getMap: function() {
      if( app.olmap == null  ) {

				mapconfig = app.getMapConfig();

        proj4.defs( mapconfig.projection.name ,mapconfig.projection.code );
        var layers = getBaseLayer();

      /*  var role = app.getRole();
        if( role == null ) {
          return null;
        }
        var location = new ol.format.GeoJSON().readGeometry( role.location , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
*/
        app.olmap = new ol.Map({
          layers: layers,
          target: 'map',
          renderer:'canvas',
          restrictedExtent: [214029, 5621113, 562926, 5993281],
          maxExtent: [215121, 5683205, 486755, 5942287], //25833,
          view: new ol.View({
            projection: mapconfig.projection.name,//'CRS:84',
            center: [214029, 5621113],//location.getCoordinates(),
            zoom: 17,
            maxZoom:21
          })
        });
      }
      return app.olmap;
  },
  resetView: function( ) {
    if( app.olmap ) {
      var role = app.getRole();
      if( role == null ) {
        return null;
      }
      var location = new ol.format.GeoJSON().readGeometry( role.location , { dataProjection:'WGS84',featureProjection: mapconfig.projection.name });
      if( location ) {
        app.olmap.getView().fit( location, app.olmap.getSize() );
      }
    }
  },
  addLayer: function( layer ) {
    var map = app.getMap();
    if( map == null ){
      console.log("add layer "+ layer.get('name')+" failed ... no map aviable");
      return;
    }
    console.log("add layer "+layer.get('name'),layer );
    map.getLayers().forEach( function(cur ) {
      if( cur == layer ) {
        app.olmap.getLayers().remove(cur);
      }
    });
    map.getLayers().push( layer );
  },
  removeLayer: function( layer ) {
    var map = app.getMap();
    if( map == null ){
      console.log("add layer "+ layer.get('name')+" failed ... no map aviable");
      return;
    }
    console.log("remove layer "+layer.get('name'),layer );
    map.getLayers().remove(layer);
  },
  getLayerByName: function( name ) {
    var map = app.getMap();
    var layer = null;
    map.getLayers().forEach( function(cur ) {
      if( cur.get("name") == name ) {
        layer = cur;
      }
    });
    return layer;
  },
  popTool: function () {
    map = app.getMap();
    app.current_tool = app.toolstack.pop();
    if( app.current_tool ) {
      map.removeInteraction( app.current_tool );
      if( app.current_tool.get('id') ) {
        $('#'+app.current_tool.get('id') ).removeClass( 'selected' );
      }
      if( app.current_tool.get('cursor') ) {
        $('#map').removeClass( app.current_tool.get('cursor') )
      }
      app.current_tool = null;
      if( app.toolstack.length > 0 ) {
        app.current_tool = app.toolstack[app.toolstack.length-1];
        map.addInteraction( app.current_tool )
        if( app.current_tool.get('cursor') ) {
          $('#map').addClass( app.current_tool.get('cursor') );
        }
        if( app.current_tool.get('id') ) {
          $('#'+app.current_tool.get('id') ).addClass( 'selected' );
        }
      }
    }
    console.log("toostack:",app.toolstack)
  },
  pushTool : function( tool ) {
    var map = app.getMap();
    if( app.current_tool ) {
      map.removeInteraction( tool )
      if( tool.get('cursor') ) {
        $('#map').removeClass( tool.get('cursor') );
      }
      if( tool.get('id') ) {
        $('#'+tool.get('id') ).removeClass( 'selected' );
      }
    }
    map.addInteraction( tool )
    if( tool.get('cursor') ) {
      $('#map').addClass( tool.get('cursor') );
    }
    if( tool.get('id') ) {
      $('#'+tool.get('id') ).addClass( 'selected' );
    }
    app.current_tool = tool;
    app.toolstack.push( app.current_tool );
    console.log("toostack:",app.toolstack)
  },
  updateMapConfig: function() {
    var auth = Meteor.user().profile.currentpath;
    var path = app.getPath();
    if( path.length >=1 ) {
      var customer = Customers.findOne( {_id: path[0] });
      if( customer ) {

        if( ! _.isEqual(mapconfig, customer.mapconfig ) ) {
          mapconfig = customer.mapconfig;
          if(app.olmap ) {
            var trg = app.olmap.getTarget();
            // delete old map
            delete app.olmap
            // rebuild map
            app.map = app.getMap();
            app.map.setTarget( trg );
          }
          console.log("update mapconfig")
        }
				Session.set('mapconfig',mapconfig)
      }
    }
  },
  getPath : function() {
    return Meteor.user().profile.currentpath;
  },
  setPath : function( path ) {
    console.log( "set path " , path )
    Meteor.users.update({_id:Meteor.user()._id}, { $set: { 'profile.currentpath':path } });
    // update mapconfig !!!
    app.updateMapConfig();
  },
	setSubPath : function( index , item ) {
		var id = item;
		var selitems = app.getPath();
		if( index < selitems.length) {
			selitems[index] = id;
			while( index < (selitems.length-1) ) {
				selitems.pop();
			}
		} else {
			while( selitems.length <= index ) {
				selitems.push( id );
			}
		}
		app.setPath( selitems );
	},
  getCustomer : function () {
    return app.getPath()[0];
  },
  getDepartment : function () {
    return app.getPath()[1];
  },
  getRole : function() {
    var path = app.getPath();
    if( path.length >=3 ) {
      var customer = Customers.findOne( {_id: path[0] });
      if( customer && customer.departments != null ) {
        if( customer.departments[ path[1]] && customer.departments[ path[1]].roles ) {
          if( customer.departments[ path[1]].roles[ path[2]] ) {
            return customer.departments[ path[1]].roles[ path[2] ];
          }
        }
      }
    }
    Meteor.users.update({_id:Meteor.user()._id}, { $set: { 'profile.currentpath':[] } });
    return null;
  },
  getModule : function() {
    var path = app.getPath();
    if( path.length >= 4) {
      return path[3];
    }
    return null;
  },
  getModulPath: function () {
    return Meteor.user().profile.currentpath.slice(3,Meteor.user().profile.currentpath.length);
  },
  setModulePath : function( path ) {
    var auth = Meteor.user().profile.currentpath;
    app.setPath( [ auth[0],auth[1],auth[2] ].concat( path ) );
  }
}

$(window).on('keydown', function(e) {
  if( app.current_tool ) {
    var func = app.current_tool.get('keydown');
    if( func ) {
      func( e );
    }
  }
});

$(window).on('keyup', function(e) {
  if( app.current_tool ) {
    var func = app.current_tool.get('keyup');
    if( func ) {
      func( e );
    }
  }
});

Template.app.helpers({
	getcurrentrole: function() {
		return Meteor.user().profile.currentpath[2];
	},
	getroles: function() {
		var items = [];
		var user = Meteor.user();
		for( var custid in user.customers ) {
			var customer  = user.customers[custid];
			for( var depid in customer.departments ) {
				var department = customer.departments[depid];
				for( var role in department.roles) {
					items.push({name:department.roles[role],path:""+custid+"/"+depid+"/"+department.roles[role]})
				}
			}
		}
		return items;
	},
	getmodules : function() {
		var modules = [];
		for( var module in window.mods ) {
			var mod = window.mods[module]();
			if( mod && mod.items.length > 0 )
				modules.push( mod )
		}
		return _.sortBy( modules,'pos' );
	},
  getmodul : function () {
    return app.getPath()[3];
  },
  getmodal: function () {
    var m = Session.get('modal');
    if( m ) {
      var names = _.keys(m);
          if( names.length > 0 ) {
        return names[0];
      }
    }
    return false;
  },
  username : function () {
    return Meteor.user().emails[0].address;
  }
})

Template.app.events({
	'click .module': function( e ) {
		app.setSubPath(3,$(e.currentTarget).attr('data'))
	},
	'click .set-role': function( e ) {
		var path = $(e.currentTarget).attr("data");
		items = path.split('/');
		app.setPath( items );
		app.updateMapConfig();
	},
  'click .app-item': function( e ) {
    var index = $(e.currentTarget).attr('data-index');
    var id = $(e.currentTarget).attr('data-id');
    var selitems = app.getPath();
    if( index < selitems.length) {
      selitems[index] = id;
      while( index < (selitems.length-1) ) {
        selitems.pop();
      }
    } else {
      while( selitems.length <= index ) {
        selitems.push( id );
      }
    }
    app.setPath( selitems );
    if( selitems.length >= 3 ) {
      if( window.mods[selitems[3]] && window.mods[selitems[3]].selected ) {
        window.mods[selitems[3]].selected( app.getModulPath() );
      }
    }
  },
  'click #btn-logout' : function () {
    Meteor.logout();
  }
})
