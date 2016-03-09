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

Template.areaoverview.destroyed = function() {
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
	'dblclick .goto-stand':function (e) {
		AreaManagement_SelectStand( $(e.currentTarget).attr('data') , true, 17 );
		modals.pop();
	},
	'click #save-execel': function(e) {
		//$('#dataset')
		SaveTableAsExcel('dataset','Berichte.xlsx');
		//alert('save excel');
	}
})
