Template.areaoverview.area = function() {
	return Areas.findOne({_id:Meteor.user().profile.currentSelectedArea });
}
Template.areaoverview.stands = function() {
	var stands = [];
	Stands.find({},{sort: sorting.db() }).forEach( function( stand ) {
		stand['conditioninfo'] = renderConditionInfo( stand.condition );
		stands.push( stand );
	})
	return stands;
}
Template.areaoverview.sortitems = function() {
	return sorting.get();
}
Template.areaoverview.created = function() {
	sorting.init();
	sorting.add('type','Stand');
}

Template.areaoverview.destroed = function() {
	sorting.clear();
}
Template.areaoverview.events({
	'click .close':function (e) {
		modals.pop();
	},
	'click .orderby':function(e) {
		var e = $(e.currentTarget);
		sorting.add( e.attr('data'), e.text(), 1 );
	},
	'click .goto-stand':function (e) {
		var stand = Stands.findOne({_id:$(e.currentTarget).attr('data')});
		if( stand ) {
			Session.set('standdata',stand);
			map = getMap();
			map.panTo( m2gCoords( stand.position ) );
			map.setZoom( 17 );
			modals.push('viewstand')
		}
	}
})
