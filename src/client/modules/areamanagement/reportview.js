
//**********************************************************************
//  Template: View Report
Template.reportview.data = function () {
	var data = Session.get('reportdata');
	if( data && data.type == 3 ) {
		return [
			{name:'Wildart',value: Gametypes[ data.gametype ] },
			{name:'Altersklasse',value: data.ageclass },
			{name:'Geschlecht',value: Gendertypes[parseInt(data.gender)] },
			{name:'Jagdart', value: Huntingtypes[data.hunttype] },
			{name:'Wildmarke',value: data.badgeid }
		];
	}
	return null;
}

Template.reportview.fullname = function() {
	return Session.get('reportdata').reporter.name+" "+Session.get('reportdata').reporter.surname;
}

Template.reportview.date = function() {
	return Session.get('reportdata').date;
}

Template.reportview.remarks = function() {
	return Session.get('reportdata').desc;
}
Template.reportview.is = function( type ) {
	return Session.get('reportdata').type == type;
}

Template.reportview.canEdit = function() {
	return (Session.get('reportdata').reporter.id == Meteor.userId());
}

Template.reportview.events({
	'click .modal-close': function( e ) {
		modals.pop();
		Session.set('reportdata',null);
	},
	'click #edit-report': function( e ) {
		modals.push('editreport')
	},
	'click #delete-report': function( e ) {
		if( confirm('Wollen Sie diesen Bericht wirklich löschen?') ) {
			Meteor.call('deleteReport',Session.get('reportdata')._id, function ( e ) {
				modals.pop();
			})
		}
	}
})

Template.reportview.created = function () {
	this.comments = Meteor.subscribe("comments",Session.get('reportdata')._id)
}


Template.reportview.destroyed = function( ) {
	this.comments.stop();
}
