Template.newarea.helpers({
	enabled:function() {
		if( Session.get('newarea').name == '') {
			return 'disabled';
		}
		return '';
	},
	name:function () {
		return Session.get('newarea').name ;
	},
	desc:function () {
		return Session.get('newarea').desc ;
	}
})

Template.newarea.events({
	'click .modal-close': function( e ) {
		Session.set('modal',null);
	},
	'blur #area-name': function( e ) {
		setObj('newarea','name',$('#area-name').val());
	},
	'blur #area-desc': function( e ) {
		setObj('newarea','desc',$('#area-desc').val());
	},
	'click #save': function( e ) {
		app.setModulePath(["areamanagement"])
		Meteor.call('newArea',{name:Session.get('newarea').name,desc:Session.get('newarea').desc } , function ( e , id ) {
			if( e ) {
				console.log(e)
			} else {
				app.setModulePath(["areamanagement",id]);
				modals.pop();
			}
		})
	}
})
