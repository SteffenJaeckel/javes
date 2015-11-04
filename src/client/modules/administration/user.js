
Template.user.helpers({
  employies : function() {
    return Meteor.users.find();
  },
	typeof: function ( user ) {
		for( var cid in user.customers ) {
			for( var did in user.customers[cid].departments ) {
				return user.customers[cid].departments[did].type;
			}
		}
		return 0;
	},
  rolesof : function ( user ) {
		for( var cid in user.customers ) {
			for( var did in user.customers[cid].departments ) {
				return _.values(user.customers[cid].departments[did].roles);
			}
		}
		return [];
  },
  groupsof : function( user ) {
		for( var cid in user.customers ) {
			for( var did in user.customers[cid].departments ) {
				return _.values(user.customers[cid].departments[did].groups);
			}
		}
    return [];
  }
})

Template.user.events({
	'click #add-user': function() {
		modals.push('adduser',{title:"Neuen Benutzer anlegen"});
	}
})

Template.user.created = function() {
	this.employies = Meteor.subscribe("employies");
}

Template.user.destroyed = function() {
	this.employies.stop();
}
