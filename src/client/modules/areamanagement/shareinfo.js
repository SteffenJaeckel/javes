//**********************************************************************
//
//  template: shareinfo
//
//**********************************************************************

var sharetypes = ["Verwalter","Vollzugriff","Lesezugriff"];

Template.shareuser.events({
	'click .set-owner':function (e) {
		if( confirm('Wollen Sie wirklich die Verwalterrechte übertragen? Es kann immer nur einen Verwalter pro Pirschbezirk geben.') ) {
			Meteor.call('updateShareWith',getCurrentArea()._id, $(e.currentTarget).attr('data'), 0, function(e) {
				console.log( e );
				Deps.flush();
			});
		}
	},
	'click .set-coowner':function (e) {
		Meteor.call('updateShareWith',getCurrentArea()._id, $(e.currentTarget).attr('data'), 1, function(e) {
			console.log( e );
		});
	},
	'click .set-guest':function (e) {
		Meteor.call('updateShareWith',getCurrentArea()._id, $(e.currentTarget).attr('data'), 2, function(e) {
			console.log( e );
		});
	},
	'click .remove-share':function (e) {
		Meteor.call('removeShareWith',getCurrentArea()._id, $(e.currentTarget).attr('data'), function(e) {
			console.log( e );
		});
	}
})

Template.shareinfo.helpers({
	sharedusers : function () {
		var data = [];
		var area = getCurrentArea();
		var type = area.viewer[ Meteor.userId() ];
		for( var id in area.viewer ) {
			if( id != Meteor.userId() ) {
				var user = Meteor.users.findOne( {_id:id } );
				if( user ) {
						data.push({
						userid:user._id,
						name:user.profile.name,
						surname:user.profile.surname,
						avatar: ( parseInt(user.profile.avatar) % Avatars.length ),
						type: sharetypes[ area.viewer[id] ],
						isOwner: (type == 0),
						isCoOwner: (type == 1),
						menuEnabled: ((area.viewer[id] > type) ? '':'disabled')
					});
				}
			}
		}
		return data;
	},
	canInvite : function() {
		var area = getCurrentArea();
		return (area.viewer[ Meteor.userId() ] < 2);
	},
	error : function() {
		return Session.get('error');
	},
	profile : function() {
		return Meteor.user().profile;
	},
	avatar : function() {
		return Avatars[ parseInt( Meteor.user().profile.avatar ) % Avatars.length ];
	},
	sharetype : function() {
		var area = getCurrentArea();
		if( area ) {
			return sharetypes[ area.viewer[ Meteor.userId() ]];
		}
		return '';
	},
	sharetypes : function() {
		return sharetypes;
	}
});

var usersubscription = null;

Template.shareinfo.created = function () {
	usersubscription = Meteor.subscribe('viewer_profiles', getCurrentArea()._id );
}

Template.shareinfo.destroyed = function () {
	usersubscription.stop();
	Session.set('error',null);
}


Template.shareinfo.events({
	'click .close': function () {
		Session.set('modal', null );
	},
	'click #send-invite-email': function (e) {
		var addr = $(e.currentTarget).attr('data').toLowerCase()
		var area = getCurrentArea();
		if( name && name != '' && surname && surname != '' && area ) {
			Meteor.call('sendInvitation',  area._id , addr, name, surname, function(e) {
				Session.set('error',{ emailsend: true, email:addr, name:name, surname:surname } );
				usersubscription.stop();
				usersubscription = Meteor.subscribe('viewer_profiles', area._id );
				setTimeout( function() {
					Session.set('error',null)
				}, 6000)
			})
		} else {
			Session.set('error', { invitefail:true , email:addr, name:name, surname:surname } );
		}
	},
	'click #abort-send-invite-email': function (e) {
		Session.set('error',null)
	},
	'keypress #invite-email': function (e) {
		var area = getCurrentArea();
		if( e.keyCode == 13 && area ) {
			Session.set('error',null);
			var addr = $('#invite-email').val().toLowerCase();
			Meteor.call('shareWith', area._id , addr  , function(e) {
				if( e ) {
					if(e.reason == 'user_not_found') {
						Session.set('error', { usernotfound:true , email:addr, name:'', surname:'' } );
					} else {
						Session.set('error', { unknownerror:true } );
					}
				} else {
					usersubscription.stop();
					usersubscription = Meteor.subscribe('viewer_profiles', area._id );
				}
				$('#invite-email').val('')
			})
		}
	}
})
