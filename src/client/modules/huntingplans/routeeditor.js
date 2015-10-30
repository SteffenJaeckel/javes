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

function getSelectStandsTool() {
  var selectstands = new ol.interaction.Pointer( { handleDownEvent : function ( e ) {
      e.map.forEachFeatureAtPixel( e.pixel , function ( f , l ) {
        if( l && l.getSource() == mapsources[ 'stands' ] ){
          console.log( f.get('name') , f.getId() );
          var stands = Session.get('selected-routestands');
          if( stands == null ) {
            stands  =[];
          }
          var old = _.indexOf( stands , f.getId() );
          if( old != -1 ) {
            stands.splice(old, 1);
          } else {
            stands.push( f.getId() );
          }
          Session.set('selected-routestands', stands );
          mapsources['stands'].changed();
          return true;
        }
      })
  }})

  selectstands.set( 'keydown', function( e ) {
    console.log( e.keyCode );
    var id = $('.standitem.selected').attr('data');
    console.log( id );
    var stands = Session.get('selected-routestands');
    var index = _.indexOf( stands , id );
    var next = index;
    if( e.keyCode == 38) {
      next--;
    } else if ( e.keyCode == 40) {
      next++;
    }
    if( next >= 0 && next < stands.length ) {
      var buffer =  stands[index];
      stands[index] = stands[next];
      stands[next] = buffer;
      Session.set('selected-routestands', stands );
      mapsources['stands'].changed();
    }
  })

  selectstands.set('cursor','insert-cursor');
  return selectstands;
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

Template.routeeditor.rendered = function () {
  $('#leader-container .typeahead').typeahead({
    hint: true,
    highlight: true,
    minLength: 1
  },
  {
    name: 'states',
    source: function (q, cb) {
        var matches = [];
        Meteor.users.find({ '$or' :
          [
            {'profile.surname': { $regex: '^'+q, $options: 'i' } },
            {'profile.firstname': { $regex: '^'+q, $options: 'i' } }
          ] }).forEach( function (user) {
          matches.push( user.profile.firstname+", "+user.profile.surname)
        })
        cb(matches);
    }
  });
  updateEditor();
}

Template.routeeditor.created = function () {
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

Template.routeeditor.destroyed = function () {
  console.log("route editor destroyed");
  app.popTool()
  overlaylayer.getSource().getFeaturesCollection().clear();
}

function getUserFromString( str ) {
  leader = str.split(', ')
  if( leader.length != 2 ) {
    return null;
  }
  var user = Meteor.users.findOne( {'profile.surname': leader[1], 'profile.firstname': leader[0] } );
  if( user == null  ) {
    return null;
  }
  var plan = getCurrentPlan();
  if( plan.invitestates[ user._id ] == null || plan.invitestates[ user._id ].state == 'refused' ) {
    return null;
  }

  return user;
}

Template.routeeditor.helpers({
    aviablegroups : function() {
      var data=[];
      var drive = getCurrentDrive();
      for(var y=0;y < 4;y++) {
        data.push([]);
        for( var x=0;x < 6;x++) {
          data[0].push();
          var id = (y*6+x)+1;
          var obj = {"id":id};
          obj["aviable"] = true;
          for( var rid in drive.routes ) {
            if(! ( drive.routes[rid].group != id || rid == Session.get('selected-route') ) ) {
              obj["aviable"] = false;
            }
          }
          obj["selected"] = ( id == editor.get().group )
          data[y][x] = obj;
        }
      }
      return data;
    },
    readystate : function( ) {
      if( editor.state('editpath') ) {
        return '';
      }
      return 'disabled';
    },
    savestate : function () {
      if( true ) {
        return '';
      }
      return 'disabled'
    },
    colors : function() {
      var data = []
      for( var c=0;c < Colors.length;c++ ) {
        data.push( { index: c, value: Colors[c], class: ( editor.get().color ==c)? 'selected':'' } )
      }
      return data;
    },
    leader : function() {
      var user = Meteor.users.findOne({ _id: editor.get().leader} );
      if( user ) {
        return user.profile.firstname+', '+user.profile.surname;
      }
      return '';
    },
    data: function() {
      return editor.get();
    },
    routelength: function() {
      var route = Session.get('selected-route');
      if( route ) {
        var feature = mapsources['routes'].getFeatureById( route );
        if( feature ) {
          return DistanceToKm( feature.getGeometry().getLength() );
        }
      }
      return 0;
    },
    setuptime : function () {
      var route = Session.get('selected-route');
      var stands = Session.get('selected-routestands');
      if( route ) {
        var feature = mapsources['routes'].getFeatureById( route );
        if( feature ) {
          return Math.round( (DistanceToKm( feature.getGeometry().getLength() )/0.41) + 3 * stands.length );
        }
      }
      return 0;
    },
    stands : function() {
      var data = [];

      var stands = Session.get('selected-routestands');
      if( stands ) {
        var plan = getCurrentPlan();
        var drive = getCurrentDriveIndex();
        if( plan && plan.drives && plan.drives[drive] ) {
          var leader = plan.drives[drive].routes[ Session.get('selected-route') ].leader;

          for( var i=0;i < stands.length;i++ ) {
            var s = stands[i];
            var stand = Stands.findOne({_id:s});
            if( stand ) {
              var item = plan.drives[drive].stands[s];
              if( item && item.user && plan.invitestates[item.user] && plan.invitestates[item.user].state != 'refused') {
                var user = Meteor.users.findOne({_id:item.user});
                if( user && plan.invitestates[ item.user ] ) {
                  user.state = plan.invitestates[ item.user ].state;
                  if( user._id == leader ) {
                    user.leader = true;
                  }
                  stand['user'] = user;
                }
              }
              data.push(stand);
            }
          }
        }
      }
      return data;
    }
})


Template.routeeditor.events({

  'click #save' : function ( e ) {
    Session.set( "error",null);

    if( editor.getstate() == 'editpath' ) {

      if( overlaylayer.getSource().getFeaturesCollection().getLength() == 1 ) {
        var feature = overlaylayer.getSource().getFeaturesCollection().item(0);
        var path = feature.getGeometry();
        var shape = new ol.format.GeoJSON().writeGeometryObject( path , { featureProjection: mapconfig.projection.name ,dataProjection:'WGS84' });
        var drive = getCurrentDriveIndex();

        var data = { group: editor.get().group, vehicle: $('#vehicle').val() ,color: editor.get().color, path: shape };

        if( $('#leader').val() != '' ) {
          var user = getUserFromString( $('#leader').val() )
          if( user == null  ) {
            Session.set("error", {id:'leader',text: "Der Ansteller '"+$('#leader').val()+"' ist kein gültiger Benutzer oder gehört nicht zu den Teilnehmern der Jagd."});
            return;
          }
          data['leader'] = user._id
        }

        if( undo ) {
          Meteor.call('updateHuntingPlanRoute', getCurrentPlanId(), drive, undo.getId(), data, function ( e ) {
            if( e ) {
              console.log( e );
              Session.set( "error", e.reason );
            } else {
              Session.set('selected-route', undo.getId() );
              overlaylayer.getSource().getFeaturesCollection().clear();
              editor.pop();
              undo = null;
            }
          })
        } else {
          Meteor.call('addHuntingPlanRoute', getCurrentPlanId(), drive, data, function ( e , routeid ) {
            if( e ) {
              console.log( e );
              Session.set( "error", e.reason );
            } else {
              Session.set('selected-route', routeid );
              overlaylayer.getSource().getFeaturesCollection().clear();
              editor.setstate('selectstands')
              updateEditor();
            }
          })
        }
      } else {
        Session.set( "error", {id:'',text:'Sie müssen eine Route zeichen.'} );
      }
    }
    if( editor.getstate() == 'selectstands' ) {
      var stands = Session.get('selected-routestands');
      if( stands ) {
        var planid = getCurrentPlanId();
        var drive  = getCurrentDriveIndex();
        var route  = Session.get('selected-route');
        var plan = Plans.findOne({_id:planid});
        if( plan && plan.drives[ drive ] ) {
          // remove stands
          for( var id in plan.drives[ drive ].stands ) {
            if( plan.drives[ drive ].stands[id].route == route ) {
              plan.drives[ drive ].stands[id].route = null;
              plan.drives[ drive ].stands[id].index = 0;
            }
          }
          // add the new stands in order
          for( var s=0;s < stands.length;s++ ) {
            if ( ! plan.drives[ drive ].stands[ stands[s] ] ) {
              plan.drives[ drive ].stands[ stands[s] ] = {};
            }
            plan.drives[ drive ].stands[ stands[s] ]['route'] = route;
            plan.drives[ drive ].stands[ stands[s] ]['index'] = (s+1);
          }
          Meteor.call('updateHuntingPlanStands',planid,drive,plan.drives[ drive ].stands, function ( e ) {
            if( e ) {
              console.log(e);
            } else {
              Session.set('selected-routestands',null)
              editor.pop();
            }
          })
        }
      }
    }
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
