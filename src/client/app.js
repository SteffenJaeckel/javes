Template.app.created = function () {
  this.customers = Meteor.subscribe("customers");
  this.permissions = Meteor.subscribe("permissions");
}

Template.app.removed = function () {
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

app = {
  getPath : function() {
    return Meteor.user().profile.currentpath;
  },
  setPath : function( path ) {
    console.log( "set path " , path )
    Meteor.users.update({_id:Meteor.user()._id}, { $set: { 'profile.currentpath':path } });
    if( path.length >= 2 ) {
      if( window.mods[path[2]] && window.mods[path[2]].selected ) {
        window.mods[path[2]].selected( path );
      }
    }
  },
  getCustomer : function () {
    return app.getPath()[0];
  },
  getDepartment : function () {
    return app.getPath()[1];
  },
  getRole : function() {
    return app.getPath()[2];
  },
  getModulPath: function () {
    return Meteor.user().profile.currentpath.slice(3,Meteor.user().profile.currentpath.length);
  },
  setModulePath : function( path ) {
    var auth = Meteor.user().profile.currentpath;
    app.setPath( [ auth[0],auth[1],auth[2] ].concat( path ) );
  }
}

Template.app.helpers({
  path: function () {

    if(  Meteor.user() == null )
      return [];

    var path = [];
    var selitems = app.getPath();
    var level = 0;

    /* Customer selection */
    var data = [];
    var customers = Customers.find({}).fetch();
    for( var i=0;i < customers.length;i++ ) {
      data.push({index:i, id: customers[i]._id, name: customers[i].name.short, icon: 'fa-book',class:''} );
    }
    var selectedcustomer = getSelectedItem(data, selitems[0]);
    if( data.length == 1 ) {
      var selectedcustomer = data[0];
    } else {
      var selectedcustomer = getSelectedItem(data, selitems[0]);
      path.push( { level: level++, index:0, 'selected': selectedcustomer, 'items': data } );
      if( selectedcustomer == null )
        return path;
    }


    /* Department selection */
    data = [];
    var customer = Customers.findOne({_id: selectedcustomer.id });
    if( customer == null )
      return [];

    for( var department in customer.departments ) {
      data.push({index:0, id: department , name: customer.departments[department].name.long, icon: 'fa-bookmark',class:''} );
    }
    if( data.length == 1 ) {
      var selecteddepartment = data[0];
    } else {
      var selecteddepartment = getSelectedItem(data, selitems[1] );
      path.push( { level: level++, index:1, 'selected': selecteddepartment, 'items': data } );
      if( selecteddepartment == null )
        return path;
    }

    /* Role selection */
    var roles = Meteor.user().customers[selectedcustomer.id].departments[selecteddepartment.id].roles;
    var data = [];
    console.log(roles);
    for( var i=0;i < roles.length; i++ ) {
      data.push({index:i, id: roles[i], name: roles[i], icon: 'fa-user',class:''} );
    }
    if( data.length == 1 ) {
      var selectedrole = data[0];
    } else {
      var selectedrole = getSelectedItem(data, selitems[2]);
      path.push( { level: level++, index:2, 'selected': selectedrole, 'items': data } );
      if( selectedrole == null )
        return path;
    }

    /* Module selection */
    console.log( "User is logged on as ", selectedrole.name );
    var aviablemodules = customer.departments[ selecteddepartment.id ].roles[ selectedrole.name ].modules;
    data = [];
    for( var m in window.mods ) {
      if( m == 'profile' || aviablemodules[m] != null ) {
        data.push( { index: (window.mods[m].index) ? window.mods[m].index : 50, id:m , name: window.mods[m].name, icon: window.mods[m].icon, class: (window.mods[m].enabled ) ? '':'disabled' } )
      }
    }
    if( data.length > 1 ) {
      data = _.sortBy(data,'index');
      for( var i=0;i < data.length;i++ ) {
        if( window.mods[ data[i].id ].divider ) {
          data.splice( i ,0, {divider:true} );
          i++;
        }
      }
    }
    var selectedmodule = getSelectedItem(data, selitems[3]);
    path.push( { level: level++, index:3, 'selected': selectedmodule, 'items': data } );
    if( selectedmodule == null )
        return path;

    /* Submodule selection */
    var modulpath = app.getModulPath();

    var subsel = [];
    for( var i=3;i < selitems.length;i++ ) {
      if( window.mods[ selectedmodule.id ] && window.mods[ selectedmodule.id ].menuitems ) {
        var items = window.mods[ selectedmodule.id ].menuitems( subsel );
        if( items ) {
          var selected = getSelectedItem( items, selitems[i+1] );
          if( selected == null ) {
            var def = window.mods[ selectedmodule.id ].defaultitem( subsel )
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
          var obj = { level: level++, index:(i+1), 'items':items , 'selected': selected };
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
  'click .app-item': function( e ) {
    var index = $(e.currentTarget).attr('data-index');
    var id = $(e.currentTarget).attr('data-id');
    var selitems = app.getPath();
    if( index < selitems.length) {
      selitems[index] = id;
      /*while( index < (selitems.length-1) ) {
        selitems.pop();
      }*/
    } else {
      while( selitems.length <= index ) {
        selitems.push( id );
      }
    }
    app.setPath( selitems );
  },
  'click #logout' : function () {
    Meteor.logout();
  }
})
