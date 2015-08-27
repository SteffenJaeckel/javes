//**********************************************************************
//
//  Template: sendinvites
//
//**********************************************************************
Template.sendinvites.created = function() {
	Session.set('sendinvites',{ subject:'', text:'', signature:'' });
}

Template.sendinvites.destroyed = function() {
	Session.set('sendinvites',null);
}

Template.sendinvites.rendered = function() {
  this.$('.datetimepicker').datetimepicker({locale: 'de', format:"dddd, D. M. YYYY"} );
}

Template.sendinvites.helpers({
	subject : function() {
		return Session.get('sendinvites').subject;
	},
	text : function() {
		return Session.get('sendinvites').text;
	},
	signature : function() {
		return Session.get('sendinvites').signature;
	}
})

Template.sendinvites.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'click #send':function( e ) {
		$(e.currentTarget).addClass('disabled');
		Meteor.call('sendInvites', Session.get('sendinvites'), function( e ) {
			modals.pop();
		})
	},
	'blur #sendinvites-subject':function( e ) {
		setObj('sendinvites','subject',$(e.currentTarget).val() );
	},
	'blur #sendinvites-text':function( e ) {
		setObj('sendinvites','text',$(e.currentTarget).val() );
	},
	'blur #sendinvites-signature':function( e ) {
		setObj('sendinvites','signature',$(e.currentTarget).val() );
	}
})
