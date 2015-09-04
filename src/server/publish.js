// server: publish the rooms collection, minus secret info.
Meteor.publish("customer", function() {
	return Customer.find({});
})

Meteor.publish("departments", function( customer ) {
	return Departments.find({ customer: customer });
})

Meteor.publish("news", function () {
	return News.find({});
});

Meteor.publish("notifications", function () {
	return Notifications.find( {user:this.userId}, { fields: {user:0} });
});
