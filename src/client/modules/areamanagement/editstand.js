Template.editstand.standname = function () {
	return Session.get('standdata').name;
}

Template.editstand.standdesc = function () {
	return Session.get('standdata').desc;
}

Template.editstand.standtype = function ( i ) {
	return (Session.get('standdata').type == i) ? 'selected':'';
}

Template.editstand.events({
	'click .modal-close': function( e ) {
		modals.pop();
	},
	'click #save': function( e ) {
		var data = Session.get('standdata');
		Meteor.call('editStand', data._id, data.name, data.desc, data.type, function(e) {
			console.log(e);
		})
		modals.pop();
	},
	'click .standtypes': function( e ) {
		$('.standtypes').removeClass('selected');
		$(e.currentTarget).addClass('selected');
		var type = $(e.currentTarget).attr('data');
		setObj('standdata','type',type);
	},
	'blur #stand-name': function( e ) {
		setObj('standdata','name',$('#stand-name').val());
	},
	'blur #stand-desc': function( e ) {
		setObj('standdata','desc',$('#stand-desc').val());
	}
})