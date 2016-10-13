//**********************************************************************
//
//  Template: sendrequests
//
//**********************************************************************
Template.sendrequests.created = function() {
	Session.set('sendrequests',{ subject:'', text:'', signature:'' });
}

Template.sendrequests.destroyed = function() {
	Session.set('sendrequests',null);
}

Template.sendrequests.rendered = function() {
  this.$('.datetimepicker').datetimepicker({locale: 'de', format:"dddd, D. M. YYYY"} );
}

Template.sendrequests.helpers({
	subject : function() {
		return Session.get('sendrequests').subject;
	},
	text : function() {
		return Session.get('sendrequests').text;
	},
	signature : function() {
		return Session.get('sendrequests').signature;
	}
})

Template.sendrequests.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'click #send':function( e ) {
		$(e.currentTarget).addClass('disabled');
		Meteor.call('sendRequests', Session.get('sendrequests'), function( e ) {
			modals.pop();

			setTimeout( function() {
				alert("In der DemoVersion werden keine E Mails versckickt. In der Lizensierten Version werden jetzt an alle Nutzer, die für eine Interessensbekundung vorgemerkt wurden, eine entsprechende E Mail verschickt. Die verschickte E Mail enthält einen Link mit dem der Jagdgast sein Interesse an einer Einladung signalisieren kann.")
			},500);
			
		})
	},
	'blur #sendrequests-subject':function( e ) {
		setObj('sendrequests','subject',$(e.currentTarget).val() );
	},
	'blur #sendrequests-text':function( e ) {
		setObj('sendrequests','text',$(e.currentTarget).val() );
	},
	'blur #sendrequests-signature':function( e ) {
		setObj('sendrequests','signature',$(e.currentTarget).val() );
	}
})
