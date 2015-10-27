
Meteor.startup( function () {
  console.log("starting module administration ...");
})

Meteor.publish("employies", function () {

  var me = Meteor.users.findOne({ _id:this.userId } );
  if( me && me.profile.currentpath.length >= 2 ) {
    var query = {};
    query[ 'customers.'+me.profile.currentpath[0]+'.departments.'+me.profile.currentpath[1] ] = {$exists:true};
    console.log(query);
    return Meteor.users.find( query );
  }
  return null;
});


Meteor.methods({
  newCustomer: function ( data ) {
    isServerAdmin(this.userId);
    data = Validate( data , DataModels['Customermodel'] );
    Customer.insert( data );
  },
  editCustomer: function( id, data ) {
    checkPermission( this.userId, 'administration.editCustomer' );
    data = Validate( data , DataModels['Customermodel'] );
  },
  deleteCustomer: function( id ) {
    isServerAdmin(this.userId);
    Customer.update({_id:id},{$set:{ enabled:false }});
  }
})
