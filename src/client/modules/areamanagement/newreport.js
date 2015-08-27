//**********************************************************************
// new report template
Template.newreport.isMode = function( type ) {
	return (Session.get('reportdata').hunttype == type);
}
Template.newreport.is = function( type ) {
	return (Session.get('reportdata').type == type);
}
Template.newreport.type = function() {
	return Session.get('reportdata').type;
}
Template.newreport.error = function() {
	return Session.get('report_error');
}
Template.newreport.gender = function() {
	return (Session.get('reportdata').gender == 0)? '♂':'♀';
}
Template.newreport.ageclass = function() {
	return Session.get('reportdata').ageclass;
}
Template.newreport.badgeid = function() {
	return Session.get('reportdata').badgeid;
}
Template.newreport.hunterName = function() {
	return Session.get('reportdata').name;
}
Template.newreport.hunterSurName = function() {
	return Session.get('reportdata').surname;
}
Template.newreport.date = function() {
	return formatDate( Session.get('reportdata').date );
}
Template.newreport.time = function() {
	return formatTime(Session.get('reportdata').date);
}
Template.newreport.selectedGameType = function( id ) {
	return (Session.get('reportdata').gametype == id) ? 'selected':'';
}

Template.newreport.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'click #save': function( e ) {
		var data = Session.get('reportdata');
		data.area = Meteor.user().profile.currentSelectedArea;
		Meteor.call('addReport',data, function(e){
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
