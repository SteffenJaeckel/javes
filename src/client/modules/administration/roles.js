function getSelectionTool() {
  select = new ol.interaction.Pointer( {
      handleEvent : function ( e ) {
        if( editor.get() == null  && e.type == 'singleclick') {
          Session.set('roledata',null);
          Session.set('gis-selection', null );
          e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
            if( l ) {
              if( l.get('name') == 'Rollen' ) {
          			Roles_SelectRole(f.getId())
                return false;
              }
            }
          })
          app.setModulePath( ['administration','roles',Session.get('gis-selection')])
          access_layer.getSource().changed();
      }
      return true;
    }
  });
  return select;
}

Roles_SelectRole = function( id ) {
  console.log("select role ",id)
  Session.set('gis-selection', id );
}

var access_layer = {};

function updateMap() {
  var olmap = app.getMap();

  if( olmap ) {

    olmap.setTarget( document.getElementById('map') );

    access_layer.getSource().clear();

    Customers.find({_id:app.getCustomer()}).forEach( function ( customer ) {
      myrole = app.getRole();
      for( depid in customer.departments ) {
        for( roleid in customer.departments[ depid ].roles ) {
          if( _.indexOf( myrole.inviteroles, roleid ) != -1 ) {
            role = customer.departments[ depid ].roles[roleid];
            var report = new ol.Feature();
            report.setGeometry( new ol.geom.Point( proj4('WGS84',mapconfig.projection.name,role.location.coordinates) ) );
            report.setId(roleid);
            report.set('type',1)
            report.set('text', roleid );
            report.set('color',0 );
            report.set('route', roleid );
            report.set('z-index', access_layer.getSource().getFeatures().length )
            access_layer.getSource().addFeature( report );
          }
        }
      }
    })

    console.log( "ext:",access_layer.getSource().getExtent() );

    if( olmap.getSize() ) {
      var view = olmap.getView();
      var pan = ol.animation.pan({duration: 500,source: view.getCenter()})
      var zoom = ol.animation.zoom({duration: 500, resolution: view.getResolution()})
      olmap.beforeRender(pan, zoom)

      if( access_layer.getSource().getFeatures().length > 0 ) {
        view.setZoom( 16 );
        view.setCenter( ol.extent.getCenter( access_layer.getSource().getExtent() ) )
      } else {
        view.setZoom( 13 );
        //view.setCenter( ol.extent.getCenter( access_layer.getSource().getExtent() ) )
      }
    }
  }
}

Template.roles.helpers({
  roles: function() {
    var customer = Customers.findOne({_id:app.getCustomer()});
    console.log( customer );
    if( customer )
      return _.keys(customer.departments[ app.getDepartment() ].roles);

    return [];
  },
  selected: function () {
    return getCurrentRole();
  },
  selectedmodules: function() {
    var role = getCurrentRole();
    var ret = [];
    if( role ) {
      for( var mod in role.modules ) {
        var actions = [];
        for( var act in role.modules[mod].actions ) {
          actions.push( role.modules[mod].actions[act].name )
        }
        ret.push( {name:mod, actions: actions } )
      }
    }
    return ret;
  }
})

Template.roles.events({
})

Template.roles.created = function() {

  this.rolecursor = Customers.find({_id:app.getCustomer()});

  this.rolecursor.observeChanges({
    added:function( id, fields ) {
      updateMap();
    },
    removed:function( id ) {
      updateMap();
    },
    changed:function( id, fields ) {
      updateMap();
    }
  });

  var olmap = app.getMap();
  access_layer = new ol.layer.Vector({
    source: new ol.source.Vector() ,
    style: function ( feature, res ) {
      var minzoom = 16;

      var text = feature.get('text');
      var zindex = parseInt(feature.get('z-index'));

      if( feature.get("disabled") == 1 ) {
        var img = 'img/role.png';
      } else {
        var img = 'img/role.png';
      }

      var opa =  ( Session.get('gis-selection') && feature.get('route') != Session.get('gis-selection') ) ?  0.3 : 1;
      styles = [];

      styles.push( new ol.style.Style({
        image: new ol.style.Icon(({
          anchor: [0.5, 1],
          scale: 1,
          src: img,
          opacity: opa
        })),
        text: new ol.style.Text({
          text: text,
          scale: 1.0,
          offsetY: 10,
          fill: new ol.style.Fill({
            color: [0, 0, 0, opa]
          }),
          stroke: new ol.style.Stroke({
            color: [0, 0, 0, opa],
            width: 1
          })
        }),
        zIndex: zindex
      }))
      return styles;
    }
  });
  access_layer.set('name','Rollen');
  app.addLayer( access_layer );
  app.pushTool( getSelectionTool() );
}

Template.roles.rendered = function() {
  updateMap();
}

Template.roles.destroyed = function() {
  app.removeLayer( access_layer );
  if( this.rolecursor )
    this.rolecursor.stop();

  app.popTool()
}

Template.roles.events({
  'click #add-role': function( e ) {
    console.log("add role ");
    editor.push("roleeditor", { name:"" , type: 0, location: editor.getScreenCenterPoint() , permissions : {} ,inviteroles : [] } );
  },
  'click #edit-role': function( e ) {
    console.log("edite role ");
    var role = getCurrentRole();
    for( var mod in role.modules ) {
      for( var act in role.modules[mod].actions ) {
        pathlib.set( role , "permissions."+mod+"."+act, true );
      }
    }
    role['name'] = Session.get("gis-selection");
    role['_id'] = Session.get("gis-selection");
    console.log( role);
    editor.push("roleeditor", role );
  }
})
