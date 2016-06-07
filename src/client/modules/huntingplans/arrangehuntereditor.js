function getType( user ) {
  return user.customers[app.getCustomer()].departments[ app.getDepartment() ].type;
}

function getStandByUser( stands , user ) {
  for( var id in stands ) {
    if( stands[id].user == user )
      return id;
  }
  return '';
}

var MyHunterfilterTypes =  ['Kein Filter','Jäger ohne Stand','Jäger mit Stand'];
var MyDogfilterTypes =  ['Kein Filter','Stöberhunde Alle','Stöberhunde - (Kurz)','Stöberhunde - ((Mittel))','Stöberhunde - (((Weit)))','Schweishunde'];

Template.arrangehuntereditor.helpers({
  selectedhunterfilter: function (e) {
    return MyHunterfilterTypes[ Session.get('hunter-filter') ];
  },
  hunterfiltertypes:function () {
  	return MyHunterfilterTypes;
  },
  selecteddogfilter: function (e) {
    return MyDogfilterTypes[ Session.get('dog-filter') ];
  },
  dogfiltertypes:function () {
  	return MyDogfilterTypes;
  },
  userfilter:function () {
  	return Session.get('user-filter');
  },
  groupfilter:function () {
  	return Session.get('group-filter');
  },
  groups : function() {

    if( Session.get('user-filter') != null && Session.get('user-filter') != '') {
      var userfilter = new RegExp('^'+Session.get('user-filter'), 'i');
    }
    if( Session.get('group-filter') != null && Session.get('group-filter') != '' ) {
      var groupfilter = new RegExp('^'+Session.get('group-filter'), 'i');
    }
    if( Session.get('dog-filter') != null ) {
      var dogfilter = Session.get('dog-filter');
    }
    if( Session.get('hunter-filter') != null ) {
      var hunterfilter = Session.get('hunter-filter');
    }

    if( editor.get() == null )
      return [];

    var plan = getCurrentPlan();
    if( plan ) {

      var groups = {};
      for( id in plan.invitestates ) {
        var user = Meteor.users.findOne({_id:id});
        if( user ) {

          if( plan.invitestates[id].state != 'refused' ) {
            var standid = getStandByUser( editor.get().stands , user._id);
            var stand = Stands.findOne({_id:standid});
            var add = true;

            if( userfilter && user.profile.surname.match( userfilter ) == null ) {
              add = false;
            }

            if( groupfilter && add ) {
              add = false;
              var custgroups = user.customers[ app.getCustomer()].departments[app.getDepartment() ].groups;
              for( var x = 0; custgroups != null  && x <custgroups.length;x++ ) {
                var m = custgroups[x].match( groupfilter )
                if( m != null && m.length > 0) {
                  add = true;
                }
              }
            }

            if( dogfilter && add ) {
              if( dogfilter > 0 ) {
                add = false;

                switch( dogfilter ) {
                  case 1:
                    for( var d=0;d < user.profile.dogs.length;d++ ) {
                      if( user.profile.dogs[d].type < 3 ) {
                        add = true;
                      }
                    }
                  break;
                  case 2:
                    for( var d=0;d < user.profile.dogs.length;d++ ) {
                      if( user.profile.dogs[d].type == 0) {
                        add = true;
                      }
                    }
                  break;
                  case 3:
                    for( var d=0;d < user.profile.dogs.length;d++ ) {
                      if( user.profile.dogs[d].type == 1) {
                        add = true;
                      }
                    }
                  break;
                  case 4:
                    for( var d=0;d < user.profile.dogs.length;d++ ) {
                      if( user.profile.dogs[d].type == 2 ) {
                        add = true;
                      }
                    }
                  break;
                  case 5:
                    for( var d=0;d < user.profile.dogs.length;d++ ) {
                      if( user.profile.dogs[d].type == 3 ) {
                        add = true;
                      }
                    }
                  break;
                }
              }
            }

            if( hunterfilter && add ) {
              if( hunterfilter > 0 ) {
                add = false;
                switch( hunterfilter ) {
                  case 1:
                    // jäger ohne stand
                    if( stand == null ) {
                      add = true;
                    }
                  break;
                  case 2:
                    // jäger mit stand
                    if( stand != null ) {
                      add = true;
                    }
                  break;
                }
              }
            }

            if( add ) {
              var cur = {
                id: user._id,
                firstname:user.profile.firstname,
                surname: user.profile.surname,
                title:user.profile.title,
                isdoctor: (user.profile.isdoctor || user.profile.isveterinary),
                type:'huntertype-'+(getType( user )+1),
                dogs: (user.profile.dogs) ? user.profile.dogs:[],
                state: plan.invitestates[id].state,
                stand: (stand) ? stand.name : ''
              };

              var groupprofile = user.customers[ app.getCustomer() ].departments[ app.getDepartment() ].groups;
              if( groupprofile == null  || groupprofile.length == 0 ) {
                var gr = ' Ohne Gruppe';
                if( groups[ gr ] == null ) {
                  groups[ gr ] = { id:gr, name:gr, user:[] };
                }
                groups[ gr ].user.push(cur);
              } else {
                for( var x=0;x < groupprofile.length;x++ ) {
                  var gr = groupprofile[x];

                  if( groupfilter && gr.match( groupfilter ) == null )
                    continue;

                  if( groups[ gr ] == null ) {
                    groups[ gr ] = { id:gr, name:gr, user:[] };
                  }
                  groups[ gr ].user.push(cur);
                }
              }
            }
          }
        }
      }
      return _.sortBy(_.values( groups ),'name');
    }
    return [];
  }
})

Template.arrangehuntereditor.created = function( ) {

  Session.setDefault('hunter-filter',0);
  Session.setDefault('group-filter','');
  Session.setDefault('user-filter','');
  Session.setDefault('dog-filter',0);

  var plan  = getCurrentPlan();
  var drive = getCurrentDrive();
  if( plan && drive) {
    var buffer = {};
    for( var id in drive.stands ) {
      var d = drive.stands[id];
      /*if( d.user && plan.invitestates[d.user] && plan.invitestates[d.user].state != 'refused') {
        buffer[ id ] = _.clone(d);
      }*/
      buffer[ id ] = _.clone(d);
    }
    console.log( buffer );
    editor.set('stands', buffer )
  }
}

Template.arrangehuntereditor.rendered = function() {
  $(window).on('click', function ( e ) {
    var item = Session.get('drag-item');
    if( item ) {
      if( item.stand ) {
        var f = mapsources['stands'].getFeatureById( item.stand );
        var edit = editor.get();
        if( f ) {
          var old = getStandByUser( edit.stands, item.user );
          if( old != '') {
            edit.stands[ old ].user = '';
          }
          if( edit.stands[ item.stand ] == null ) {
            edit.stands[ item.stand ] = {};
          }
          edit.stands[ item.stand ].user = item.user;
        } else {
          var old = getStandByUser( edit.stands, item.user );
          if( old != '') {
            edit.stands[ old ].user = '';
          }
        }
        editor.set('stands',edit.stands);
        Session.set('drag-item', null )
        setTimeout( function () {
          mapsources['stands'].changed()
        },100)
      }
    }
  }).on('mousemove', function ( e ) {
    var item = Session.get('drag-item');
    if( item ) {
      var map = app.getMap();
      item.stand = '';
      var off = $('#map').offset();
      map.forEachFeatureAtPixel( [e.pageX-off.left, e.pageY-off.top ], function( f,l ) {
        if( l && l == maplayer['stands'] ) {
          item.stand = f.getId();
        }
      })
      item.x = e.pageX+20;
      item.y = e.pageY+20;
      Session.set('drag-item',item);
    }
  });
  $('#map').click( function ( e ) {
    if( Session.get('drag-item') == null ) {
      var map = app.getMap();
      var off = $('#map').offset();
      map.forEachFeatureAtPixel( [e.pageX-off.left, e.pageY-off.top ], function( f,l ) {
        if( l && l == maplayer['stands'] && editor.get() ) {
          var stands = editor.get().stands;
          if( stands && stands[ f.getId() ] && stands[f.getId() ].user != '' ){
            var obj = {x: e.pageX+20, y: e.pageY+20, user: stands[f.getId() ].user };
            Session.set('drag-item', obj );
            return;
          }
        }
      })
      e.stopPropagation();
      return true;
    }
  })
}

Template.arrangehuntereditor.destroyed = function () {
  $(window).off('click').off('mousemove')
  $('#map').off('click');
}

Template.arrangehuntereditor.events({
  'keyup #user-filter': function( e ) {
    if( $(e.currentTarget).val() == '' ) {
      Session.set('user-filter',null);
    } else {
      Session.set('user-filter',$(e.currentTarget).val() );
    }
  },
  'keyup #group-filter': function( e ) {
    if( $(e.currentTarget).val() == '' ) {
      Session.set('group-filter',null);
    } else {
      Session.set('group-filter',$(e.currentTarget).val() );
    }
  },
  'click .hunterfilter-switch': function (e ) {
    Session.set( 'hunter-filter', _.indexOf( MyHunterfilterTypes, $(e.currentTarget).text()) );
  },
  'click .dogfilter-switch': function (e ) {
    Session.set( 'dog-filter', _.indexOf( MyDogfilterTypes, $(e.currentTarget).text()) );
  },
  'click .group-item.user': function( e ) {
    if( e.shiftKey ) {
      var user = $(e.currentTarget).attr('data-user');
      var drive = getCurrentDrive();
      if( drive ) {
        for( var standid in drive.stands ) {
          var stand = drive.stands[ standid ];
          if( stand.user == user ) {
            gotoStand(standid);
            return;
          }
        }
      }
    } else {
      var obj = {x: e.pageX+20, y: e.pageY+20, user: $(e.currentTarget).attr('data-user') };
      Session.set('drag-item', obj )
      e.stopPropagation();
    }
  },
  'click #hunterlist' : function() {
    console.log("hunterlist delete")
    var item = Session.get('drag-item');
    if( item ) {

      var edit = editor.get();
      var old = getStandByUser( edit.stands, item.user );
      if( old != '') {
        edit.stands[ old ].user = '';
      }
      editor.set('stands',edit.stands);
      Session.set('drag-item', null );
      setTimeout( function () {
        mapsources['stands'].changed()
      },100)
    }
  },
  'click .clear-filter':function (e) {
    Session.set($(e.currentTarget).attr('data'),null );
  },
  'click #abort': function() {
    editor.pop();
    mapsources['stands'].changed();
  },
  'click #save': function() {
    var path = app.getPath();
    Meteor.call('updateHuntingPlanStands', getCurrentPlanId(), getCurrentDriveIndex(), editor.get().stands, function( e ) {
      if( e ) {
        console.log( e );
      } else {
        editor.pop();
        //updateMapData();
      }
    })
  }
})
