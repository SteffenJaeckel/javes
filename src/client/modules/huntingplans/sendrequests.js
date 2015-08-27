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
		Meteor.call('sendrequests', Session.get('sendrequests'), function( e ) {
			modals.pop();
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
