//**********************************************************************
// new report template
Template.editreport.isMode = function( type ) {
	return (Session.get('reportdata').hunttype == type);
}
Template.editreport.is = function( type ) {
	return (Session.get('reportdata').type == type);
}
Template.editreport.type = function() {
	return Session.get('reportdata').type;
}
Template.editreport.error = function() {
	return Session.get('report_error');
}
Template.editreport.gender = function() {
	return (Session.get('reportdata').gender == 0)? '♂':'♀';
}
Template.editreport.ageclass = function() {
	return Session.get('reportdata').ageclass;
}
Template.editreport.badgeid = function() {
	return Session.get('reportdata').badgeid;
}
Template.editreport.hunterName = function() {
	return Session.get('reportdata').name;
}
Template.editreport.hunterSurName = function() {
	return Session.get('reportdata').surname;
}
Template.editreport.date = function() {
	return formatDate( Session.get('reportdata').date );
}
Template.editreport.time = function() {
	return formatTime(Session.get('reportdata').date);
}
Template.editreport.selectedGameType = function( id ) {
	return (Session.get('reportdata').gametype == id) ? 'selected':'';
}

Template.editreport.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'click #save': function( e ) {
		var data = Session.get('reportdata');
		Meteor.call('changeReport',data, function(e){
			if( e ) {
				console.log(e);
			} else
				modals.pop();
		})
	},
	'click .select-gt': function( e ) {
		var id = $(e.currentTarget).attr('data');
		setObj('reportdata','gametype',id);
	},
	'click #change-gender': function( e ) {

		var kr = Session.get('reportdata');
		console.log(kr)
		kr.gender = (kr.gender+1)%2;
		Session.set('reportdata',kr);
	},
	'click .hunttype': function( e ) {
		setObj('reportdata','hunttype',parseInt($(e.currentTarget).attr('data')));
	},
	'blur #name': function( e ) {
		setObj('reportdata','name',$(e.currentTarget).val());
	},
	'blur #surname': function( e ) {
		setObj('reportdata','surname',$(e.currentTarget).val());
	},
	'blur #change-ageclass': function( e ) {
		setObj('reportdata','ageclass',$(e.currentTarget).val());
	},
	'blur #change-badgeid': function( e ) {
		setObj('reportdata','badgeid',$(e.currentTarget).val());
	},
	'blur #change-desc': function( e ) {
		setObj('reportdata','desc',$(e.currentTarget).val());
	},
	'blur .datetime': function( e ) {
		try {
			var kr = Session.get('reportdata')
			kr.date = parseDate( $('#change-date').val(), $('#change-time').val()  , kr.date )
			Session.set('reportdata',kr);
			Session.set('report_error',null);
		} catch ( e ) {
			setObj('report_error',e,true);
		}
	},
	'keypress .datetime': function( e ) {
		if( e.keyCode == 13) {
			try {
				var kr = Session.get('reportdata')
				kr.date = parseDate( $('#change-date').val(), $('#change-time').val() , kr.date )
				Session.set('reportdata',kr);
				Session.set('report_error',null);
			} catch ( e ) {
				setObj('report_error',e,true);
			}
		}
	}
})
