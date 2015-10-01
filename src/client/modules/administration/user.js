Template.user.created = function() {
	this.employies = Meteor.subscribe("employies");
}

Template.user.destroyed = function() {
	this.employies.stop();
}

Template.user.helpers({
  employies : function() {
    return Meteor.users.find();
  },
  role : function ( id ) {
    return "Admin";
  },
  groups : function( id ) {
    return ["Heidegarten","Hangelsberg"];
  }
})

Template.user.events({

})
