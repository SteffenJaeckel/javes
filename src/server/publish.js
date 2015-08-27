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

Meteor.publish("areas", function () {
	var querry = {};
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	return Areas.find( querry, { fields: {deleted:0} });
});

Meteor.publish("stands", function ( areaId ) {
	var querry = {};
	querry[ '_id' ] = areaId;
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	var area = Areas.findOne( querry );
	if( area ) {

		var start = new Date();
		var collection = Stands.find({"location": { "$geoWithin": {"$polygon" : area.borders.coordinates }}});
		var end = new Date();
		console.log("request stands ("+collection.count()+") in "+(end.getTime()-start.getTime())+"ms")
		return collection;
		//return Stands.find({ area:areaId , deleted:false }, { fields: {deleted:0} });
	}
	return Stands.find({ unkown: true });
});

Meteor.publish("reports", function ( areaId, days, period ) {

	if(days == null ) {
		days = 14;
	}
	var range = (days*24*60*60*1000);
	var date = new Date();
	range = Math.max( date.getTime() - period.start.getTime(), range );
	var time = date.getTime()-range;
	date.setTime( time );
	var querry = {};
	querry[ '_id' ] = areaId;
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	var area = Areas.findOne( querry );
	if( area ) {
		var start = new Date();
		var collection = Reports.find({"location": { "$geoWithin": {"$polygon" : area.borders.coordinates }},date:{ $gt : date }});
		var end = new Date();
		console.log("request reports ("+collection.count()+") in "+(end.getTime()-start.getTime())+"ms")
		return collection;
	}
	return Reports.find({ unkown: true });
});

Meteor.publish("comments", function ( areaId ) {
	return Comments.find( { area:areaId } );
});

Meteor.publish("allocations", function ( areaId ) {
	return Allocations.find( { area:areaId } );
});

Meteor.publish("viewer_profiles", function ( areaId ) {
	var area = Areas.findOne( {_id:areaId, deleted:false } );
	if( area ) {
		return Meteor.users.find({_id:{ $in:_.keys(area.viewer) } }, { fields:{ profile:1 } } );
	}
	return Meteor.users.find({unknown:true});
});
