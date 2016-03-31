var actions = {
  editConfig: { name: 'Configuration bearbeiten' , dependon: ''},
  listUsers: { name: 'Benutzer anzeigen' , dependon: ''},

  addUser: { name: "Benutzer erstellen" , dependon: 'editUser'},
  deleteUser: { name: "Benutzer löschen" , dependon: 'editUser'},
  editUser: { name: "Benutzer bearbeiten" , dependon: 'listUsers'},

  listRoles: { name: 'Benutzerrollen anzeigen' , dependon: '' },
  addRoles: { name: 'Benutzerrollen erstellen' , dependon: 'editRoles'},
  deleteRoles: { name: 'Benutzerrollen löschen' , dependon: 'editRoles'},
  editRoles: { name: 'Benutzerrollen bearbeiten' , dependon: 'listUsers'},
};

Meteor.startup( function () {
  console.log("starting module administration ...");
  propagateActions( "administration", actions );
})

Meteor.publish("employies", function () {
  var me = Meteor.users.findOne({ _id:this.userId } );
  if( canAccess( me , "administration", "listUsers") ) {
    if( me && me.profile.currentpath.length >= 2 ) {
      var query = {};
      query[ 'customers.'+me.profile.currentpath[0]+'.departments.'+me.profile.currentpath[1] ] = {$exists:true};
      console.log(query);
      return Meteor.users.find( query );
    }
  }
});


Meteor.methods({
  newCustomer: function ( data ) {
    isServerAdmin(this.userId);
    data = Validate( data , DataModels['Customermodel'] );
    Customers.insert( data );
  },
  editCustomer: function( id, data ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.editCustomer' );
    data = Validate( data , DataModels['Customermodel'] );
  },
  deleteCustomer: function( id ) {
    isServerAdmin(this.userId);
    Customers.update({_id:id},{$set:{ enabled:false }});
  },
  saveMapconfig: function( id, newconfig ) {
    isServerAdmin( this.userId );
    data = Validate( newconfig , DataModels['MapConfigmodel'] );
    Customers.update({_id:id},{$set:{ mapconfig: data }});
  },
  deleteRole: function( roleid ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.deleteRoles' );
    if( me.profile.currentpath.length > 1 ) {
      var customer = me.profile.currentpath[0];
      var department = me.profile.currentpath[1];

      var cust = Customers.findOne({_id:customer});
      if( cust && cust.departments[department] != null ) {
        for( var role in cust.departments[department].roles ) {
          cust.departments[department].roles[role].inviteroles = _.without(cust.departments[department].roles[role].inviteroles, roleid );
        }
        delete cust.departments[department].roles[roleid];
        console.log( cust.departments[department].roles );
        Customers.update({_id:customer } , cust);
        var q = {};
        q[ "customers."+customer+".departments."+department+".roles" ] = roleid;
        console.log( q );
        Meteor.users.update({}, {$pull:q}, {multi:true} );
      }
    }
  },
  renameRole: function( oldname, newname ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.editRoles' );

    if( me.profile.currentpath.length > 2 ) {
      var customer = Customers.findOne( { _id: me.profile.currentpath[0] });
      var departmentid = me.profile.currentpath[1];
      if( customer.departments[ departmentid] == null)
        throw new Meteor.Error(400, { id:key ,text:'Es keine Verwaltungseinheit '+deparmentid+' gefunden werden'});

      // update users
      customer.departments[ departmentid ].roles[ newname ] = customer.departments[ departmentid ].roles[ oldname ];
      Customers.update({_id:customer._id},customer);

      var q1 = {};
      q1["customers."+me.profile.currentpath[0]+".departments."+me.profile.currentpath[1]+".roles"] = oldname;
      var q2 = {};
      q2["customers."+me.profile.currentpath[0]+".departments."+me.profile.currentpath[1]+".roles"] = newname;

      Meteor.users.update({},{'$pull':q1},{multi:true});
      Meteor.users.update({},{'$push':q2},{multi:true});
    }
  },
  updateRole: function( data ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.editRoles' );

    if( me.profile.currentpath.length > 2 ) {
      var customer = Customers.findOne( { _id: me.profile.currentpath[0] });
      var departmentid = me.profile.currentpath[1];
      if( customer.departments[ departmentid] )
        throw new Meteor.Error(400, { id:key ,text:'Es keine Verwaltungseinheit '+deparmentid+' gefunden werden'});

      }
  },
  createRole: function( data ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.addRoles' );
    data = Validate( data , {
        name:{type:'string',name:'Name', min:4,max:64},
        permissions: {
          type:"map", name: "Module", max: 12, items: {
            type: "map", name: "Funktionen", max: 50, items : {
              type: "bool", name:"Enabled"
            }
        }},
        location : { type:'object', name:'Position', optional:true ,model:'Pointmodel' },
        inviteroles: { type: 'array', name: 'Rollen', max: 100, items: {
    			type:"string", max: 255
    		}}
    });

    if( me.profile.currentpath.length > 2 ) {
      var customer = Customers.findOne( { _id: me.profile.currentpath[0] });
      // merge inviteroles and modules ...
      var myrole = customer.departments[ me.profile.currentpath[1] ].roles[ me.profile.currentpath[2] ]
      data['modules'] = {};

      for( var mod in data.permissions ) {
        for( var action in data.permissions[mod] ) {
          if( myrole.modules[ mod ] && myrole.modules[ mod ].actions[action] ) {
            console.log("add permission ", mod, action );
            if( data.modules[mod] == null ) {
              data.modules[mod] = {actions:{} };
            }
            data.modules[ mod ].actions[ action ] = myrole.modules[ mod ].actions[action];
          }
        }
      }
      data['inviteroles'] = _.intersection( data['inviteroles'], myrole.inviteroles );
      // add the new role ...
      if( customer.departments[ me.profile.currentpath[1] ].roles[ data.name ] == null ) {
        // add the new role to the inviteroles of the current role
        customer.departments[ me.profile.currentpath[1] ].roles[ me.profile.currentpath[2] ].inviteroles = _.union( customer.departments[ me.profile.currentpath[1] ].roles[ me.profile.currentpath[2] ].inviteroles, [data.name] );
        // create the new role
        customer.departments[ me.profile.currentpath[1] ].roles[ data.name ] = {
          location: data.location,
          inviteroles: data.inviteroles,
          modules: data.modules,
        };
        Customers.update({_id:customer._id}, customer);
        // add the new role to the current user
        var obj = {};
        obj[ "customers."+me.profile.currentpath[0]+".departments."+me.profile.currentpath[1]+".roles" ] = data.name;
        Meteor.users.update({_id:this.userId }, {'$push':obj} )
      }
    }
  }
})
