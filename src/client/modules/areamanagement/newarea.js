Template.newarea.created = function() {

}

Template.newarea.helpers({

	enabled:function() {
		if( Session.get('newarea').name == '' || Session.get('shapedata').length < 2 ) {
			return 'disabled';
		}
		return '';
	},
	Name:function () {
		return Session.get('newarea').name ;
	},
	Beschreibung:function () {
		return Session.get('newarea').desc ;
	},
	Oberförstereien : function ( ) {
		return _.keys(Oberförstereien);
	},
	IstOberförstereiAusgewählt: function( Obf ) {
		return (Obf == "Hangelsberg");
	},
	Forstreviere : function( ) {
		return Oberförstereien[Session.get('newarea').Obf];
	},
	IstForstrevierAusgewählt: function( Revier ) {
		return Oberförstereien[Session.get('newarea').Revier];
	}
})

Template.newarea.events({
	'click .modal-close': function( e ) {
		Session.set('modal',null);
	},
	'click #edit-border': function( e ) {
		Session.set('editmode',{ editborder:true, source:"shapedata" } );
	},
	'blur #area-name': function( e ) {
		setObj('newarea','name',$('#area-name').val());
	},
	'blur #area-desc': function( e ) {
		setObj('newarea','desc',$('#area-desc').val());
	},
	'click #save': function( e ) {
		Meteor.call('newArea',{name:Session.get('newarea').name,desc:Session.get('newarea').desc,shape: Session.get('shapedata') } , function ( ) {
			Session.set('modal',null);
		})
	}
})
