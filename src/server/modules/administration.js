var actions = {
  editConfig: { name: 'Configuration bearbeiten' , dependon: ''},
  listUsers: { name: 'Benutzer anzeigen' , dependon: ''},

  addUser: { name: "Benutzer erstellen" , dependon: 'editUser'},
  deleteUser: { name: "Benutzer löschen" , dependon: 'editUser'},
  editUser: { name: "Benutzer bearbeiten" , dependon: 'listUsers'},

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
    checkPermission( this.userId, 'administration.editCustomer' );
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
  }
})
