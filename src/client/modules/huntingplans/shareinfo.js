//**********************************************************************
//
//  template: shareinfo
//
//**********************************************************************

var sharetypes = ["Verwalter","Vollzugriff","Lesezugriff"];

Template.shareplanuser.events({
	'click .set-owner':function (e) {
		if( confirm('Wollen Sie wirklich die Verwalterrechte übertragen? Es kann immer nur einen Verwalter pro Jagdplanung geben.') ) {
			Meteor.call('updateSharePlanWith',getCurrentPlan()._id, $(e.currentTarget).attr('data'), 0, function(e) {
				console.log( e );
				Deps.flush();
			});
		}
	},
	'click .set-coowner':function (e) {
		Meteor.call('updateSharePlanWith',getCurrentPlan()._id, $(e.currentTarget).attr('data'), 1, function(e) {
			console.log( e );
		});
	},
	'click .set-guest':function (e) {
		Meteor.call('updateSharePlanWith',getCurrentPlan()._id, $(e.currentTarget).attr('data'), 2, function(e) {
			console.log( e );
		});
	},
	'click .remove-share':function (e) {
		Meteor.call('removeSharePlanWith',getCurrentPlan()._id, $(e.currentTarget).attr('data'), function(e) {
			console.log( e );
		});
	}
})

Template.planshareinfo.helpers({
	sharedusers : function () {
		var data = [];
		var plan = getCurrentPlan();
		var type = plan.viewer[ Meteor.userId() ];
		for( var id in plan.viewer ) {
			if( id != Meteor.userId() ) {
				var user = Meteor.users.findOne( {_id:id } );
				if( user ) {
						data.push({
						userid:user._id,
						name:user.profile.name,
						surname:user.profile.surname,
						avatar: ( parseInt(user.profile.avatar) % Avatars.length ),
						type: sharetypes[ plan.viewer[id] ],
						isOwner: (type == 0),
						isCoOwner: (type == 1),
						menuEnabled: ((plan.viewer[id] > type) ? '':'disabled')
					});
				}
			}
		}
		return data;
	},
	canInvite : function() {
		var plan = getCurrentPlan();
		return (plan.viewer[ Meteor.userId() ] < 2);
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
		var plan = getCurrentPlan();
		if( plan ) {
			return sharetypes[ plan.viewer[ Meteor.userId() ]];
		}
		return '';
	},
	sharetypes : function() {
		return sharetypes;
	}
});

var usersubscription = null;

Template.planshareinfo.created = function () {
	usersubscription = Meteor.subscribe('planviewer_profiles', modals.get().planid );
}

Template.planshareinfo.destroyed = function () {
	usersubscription.stop();
	Session.set('error',null);
}

Template.planshareinfo.events({
	'click .close': function () {
		Session.set('modal', null );
	},
	'click #send-invite-email': function (e) {
		var addr = $(e.currentTarget).attr('data').toLowerCase()
		var plan = modals.get().planid;
		
		if( addr != "" && plan ) {
			Meteor.call('sendPlanInvitation',  plan , addr, function(e) {
				usersubscription.stop();
				usersubscription = Meteor.subscribe('planviewer_profiles', modals.get().planid );
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
		var plan = getCurrentPlan();
		if( e.keyCode == 13 && plan ) {
			Session.set('error',null);
			var addr = $('#invite-email').val().toLowerCase();
			Meteor.call('sharePlanWith', plan._id , addr  , function(e) {
				if( e ) {
					if(e.reason == 'user_not_found') {
						Session.set('error', { usernotfound:true , email:addr, name:'', surname:'' } );
					} else {
						Session.set('error', { unknownerror:true } );
					}
				} else {
					usersubscription.stop();
					usersubscription = Meteor.subscribe('viewer_profiles', plan._id );
				}
				$('#invite-email').val('')
			})
		}
	}
})
