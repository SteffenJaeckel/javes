// server: publish the rooms collection, minus secret info.
Meteor.publish("customers", function() {
	var user = Meteor.users.findOne({_id:this.userId});
	if( user != null ) {
		if( user.customers instanceof Object ) {
			var cust = _.keys(user.customers);
			return Customers.find({_id:{$in:cust}});
		}
	}
})

// server: publish the rooms collection, minus secret info.
Meteor.publish("permissions", function() {
	return Meteor.users.find({_id:this.userId},{ fields:{ isServerAdmin:1, emails:1, customers:1, profile:1 } } );
})

Meteor.publish("news", function () {
	return News.find({});
});

Meteor.publish("notifications", function () {
	return Notifications.find( {user:this.userId}, { fields: {user:0} });
});
