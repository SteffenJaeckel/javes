Template.editarea.helpers({
	name:function () {
		return modals.get().name;
	},
	desc:function () {
		return modals.get().desc ;
	}
})

Template.editarea.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'blur #area-name': function( e ) {
		modals.set('name', $('#area-name').val() )
	},
	'blur #area-desc': function( e ) {
		modals.set('desc', $('#area-desc').val() )
	},
	'click #save': function( e ) {
		Meteor.call('editArea', modals.get() , function ( e ) {
			if( e ) {
				console.log(e)
			} else
				modals.pop();
		})
	}
})
