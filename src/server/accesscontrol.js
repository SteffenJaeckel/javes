/*
  Diese Funktion stellt fest ob der übergebene Benutzer Serveradminrechte hat.
*/
isServerAdmin = function ( userid ) {
  var user = Meteor.users.findOne({_id:userid});
  if( user.isServerAdmin !== true )
    throw new Meteor.Error(403, "You need to be the server admin to do this!");
}
/*
  Diese Funktion stellt fest ob der übergebene Benutzer [user] Zugriff auf die [action] des Moduls [mod] hat.
*/
canAccess = function ( user, mod, action ) {

  if( user.profile.currentpath.length >= 3 ) {
    var cust = user.profile.currentpath[0];
    var dep = user.profile.currentpath[1];
    var rol = user.profile.currentpath[2];
    var customer = Customers.findOne({_id:cust});
    if( customer && customer.departments ) {
      var department = customer.departments[ dep ];
      if( department && department.roles ) {
        var role = department.roles[ rol ];
        if( role ) {
          if( role.modules && role.modules[mod] ) {
            if( role.modules[mod].actions && role.modules[mod].actions[ action ]) {
              console.log("access granted action ["+ action+ "] on module ["+mod+"] from user ["+user.profile.lastname+", "+user.profile.firstname+"] authorized as ["+rol+"]");
              return true;
            }
          }
        }
      }
    }
  }
  console.log("access denied for action ["+ action+ "] on module ["+mod+"] from user ["+user.profile.lastname+", "+user.profile.firstname+"] authorized as ["+rol+"]");
  return false;
}
/*
  Erteilt den admin Rollen jedes Customers den Zugriff auf die funktion in [actions] des Moduls [mod].
*/
propagateActions = function( mod , actions ) {

  Customers.find().forEach( function ( customer ) {
    for( var dep in customer.departments ) {
      for( var rol in customer.departments[dep].roles ) {
        if( customer.departments[dep].roles.admin == null  ) {
          customer.departments[dep].roles["admin"] = {};
        }
        if( customer.departments[dep].roles.admin.modules == null ) {
          customer.departments[dep].roles.admin["modules"] = {};
        }
        if( customer.departments[dep].roles.admin.modules[ mod ] == null ) {
          customer.departments[dep].roles.admin.modules[ mod ] = {};
        }
        if( customer.departments[dep].roles.admin.modules[ mod ].actions == null ) {
          customer.departments[dep].roles.admin.modules[ mod ].actions = {};
        }
        customer.departments[dep].roles.admin.modules[ mod ].actions = actions;
        Customers.update( {_id:customer._id} , customer );
      }
    }
  });
  for( var a in actions ) {
    console.log("add action ["+actions[a].name+"] to module ["+mod+"]");
  }
}
