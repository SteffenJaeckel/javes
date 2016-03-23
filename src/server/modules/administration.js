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
  createRole: function( data ) {
    var me = Meteor.users.findOne({ _id: this.userId });
    checkPermission( me, 'administration.addRoles' );
    data = Validate( data , {
        name:{type:'string',name:'Name', min:4,max:20},
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

    console.log( data );

    if( me.profile.currentpath.length > 2 ) {
      var customer = Customers.findOne( { _id: me.profile.currentpath[0] });
      // merge inviteroles and modules ...
      var myrole = customer.departments[ me.profile.currentpath[1] ].roles[ me.profile.currentpath[2] ]
      data['modules'] = {};

      for( var module in data.permissions ) {
        for( var action in data.permissions[module] ) {
          if( myrole.modules[ module ] && myrole.modules[ module ][action] ) {
            data.modules[ module ][ action ] = myrole.modules[ module ][action];
          }
        }
      }
      data['inviteroles'] = _.uniq( data['inviteroles'], myrole.inviteroles );
      console.log( "Module",data );
      // add the new role ...
      if( customer.departments[ me.profile.currentpath[1] ].roles[ data.name ] == null ) {
        customer.departments[ me.profile.currentpath[1] ].roles[ data.name ] =
        {
          inviteroles: data.inviteroles,
          location: data.location,
          modules: data.modules
        }
        Customers.update({_id:customer._id}, customer);
      }
    }
  }
})
