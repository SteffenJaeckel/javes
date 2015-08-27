Template.app.created = function () {
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

app = {
  getPath : function() {

    var sel = Meteor.user().profile.currentpath;
    //var sel = Session.get('data-selection');
    if( sel == null || sel == '') {
      sel = 'huntingplans';
    }
    return sel.split('|');
  },
  setPath : function( path ) {
    var s = path[0];
    for( var i=1;i < path.length;i++ ) {
      s += "|"+path[i];
    }
    Meteor.users.update({_id:Meteor.user()._id}, { $set: { 'profile.currentpath':s } });
    if( window.mods[path[0]] && window.mods[path[0]].selected ) {
      window.mods[path[0]].selected( path );
    }
  }
}

Template.app.helpers({
  path: function () {

    if(  Meteor.user() == null )
      return [];

    var path = [];
    var selitems = app.getPath();
    var data = [];

    for( var m in window.mods ) {
      data.push( { index: (window.mods[m].index) ? window.mods[m].index : 50, id:m , name: window.mods[m].name, icon: window.mods[m].icon, class: (window.mods[m].enabled ) ? '':'disabled' } )
    }
    data = _.sortBy(data,'index');


    for( var i=0;i < data.length;i++ ) {
      if( window.mods[ data[i].id ].divider ) {
        data.splice( i ,0, {divider:true} );
        i++;
      }
    }

    data.push( {divider:true} );
    data.push( { id:'logoff' , name: 'Abmelden', icon: 'fa-power-off', class: '' } );

    path.push( { level: 0, 'selected': getSelectedItem(data, selitems[0]), 'items': data } );
    var subsel = [];
    for( var i=0;i < selitems.length;i++ ) {
      if( window.mods[ selitems[0] ] && window.mods[ selitems[0] ].menuitems ) {
        var items = window.mods[ selitems[0] ].menuitems( subsel );
        if( items ) {
          var selected = getSelectedItem( items, selitems[i+1] );
          if( selected == null ) {
            var def = window.mods[ selitems[0] ].defaultitem( subsel )
            if( def ) {
              var selected = getSelectedItem( items, def );
              if( selected ) {
                if( selitems.length == i+1 ) {
                  selitems.push( def );
                } else if(selitems.length >= i+2) {
                  selitems[i+1] = def;
                  for( var c=0;c <  (selitems.length -(i+2));c++ ) {
                    selitems.pop();
                  }
                }
                app.setPath( selitems );
              }
            } else {
              selected = {id:'none',name:'',icon:'fa-reorder'};
            }
          }
          var obj = { level: (i+1), 'items':items , 'selected': selected };
          if( selitems.length > (i+1) ) {
            subsel.push( selitems[i+1] );
          }
          path.push( obj );
        } else {
          break;
        }
      } else {
        break;
      }
    }
    return path;
  },
  getmodul : function () {
    return app.getPath()[0];
  },
  getmodal: function () {
    var m = Session.get('modal');
    if( m ) {
      var names = _.keys(m);
          if( names.length > 0 ) {
        console.log("open modal "+ names[0] )
        return names[0];
      }
    }
    return false;
  },
  userName : function () {
    return Meteor.user().emails[0].address;
  }
})

Template.app.events({
  'click .app-item': function( e ) {
    var level = $(e.currentTarget).attr('data-level');
    var id = $(e.currentTarget).attr('data-id');

    if( id == 'logoff') {
      Meteor.logout();
    } else {
      var selitems = app.getPath();
      if( level < selitems.length) {
        selitems[level] = id;
        while( level < (selitems.length-1) ) {
          selitems.pop();
        }
      } else if( level == selitems.length ) {
        selitems.push( id );
      }
      app.setPath( selitems );
    }
  }
})
