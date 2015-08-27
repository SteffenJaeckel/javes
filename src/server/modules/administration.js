
Meteor.startup( function () {
  console.log("starting module administration ...");
})

Meteor.methods({
  newCustomer: function ( data ) {
    isServerAdmin(this.userId);
    data = Validate( data , Customermodel );
    Customer.insert( data );
  },
  editCustomer: function( id, data ) {
    checkPermission( this.userId, 'administration.editCustomer' );
    data = Validate( data , Customermodel );
  },
  deleteCustomer: function( id ) {
    isServerAdmin(this.userId);
    Customer.update({_id:id},{$set:{ enabled:false }});
  }
})
