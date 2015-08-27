console.log("Add Profile to modules");
if( window.mods == null ) {
	window.mods = {};
}

window.mods['profile'] = { index: 99, name: "Profil", icon:"fa-user", enabled:true, divider:true,
	defaultitem: function() {
		return 'me';
	},
	menuitems: function( path ) {
		if( path.length == 0 )
			return [ {id:'me',name:'Meine Daten', icon:"fa-archive"} ];
		return null;
	},
	selected: function( item ) {
		console.log( item )
	}
};

Template.profile.helpers({
	name : function () {
		return Meteor.user().profile.firstname;
	},
	surname : function () {
		return Meteor.user().profile.surname;
	},
	selectedAvatar : function ( id ) {
		return (Meteor.user().profile.avatar == id) ? "selected":"";
	},
	selectedTime : function ( days ) {
		return (Meteor.user().profile.reportdisplaytime == days) ? 'selected':"";
	},
	apikeys : function () {
		var data = [];
		for( i=0;i < 5;i++ ) {
			data.push( MD5("test"+i) );
		}
		return data;
	}
})

Template.profile.events({
	'click .modal-close': function () {
		modals.pop();
	},
	'click .userimage':function(e) {
		setObj("editprofile","avatar",$(e.currentTarget).attr("data"));
	},
	'change #profile-reportdisplaytime': function (e) {
		setObj("editprofile","reportdisplaytime",parseInt($(e.currentTarget).val()));
	},
	'click #save':function (e) {
		Meteor.call('updateProfile',Session.get('editprofile'),function(e) {
			if( Meteor.user().profile.currentMode == 0 ) {
				SelectArea( Meteor.user().profile.currentSelectedArea, true )
			}
			modals.pop();
		})
	},
	'click #new-api-key':function (e) {
		Meteor.call('creatApiKey',function(e) {
		})
	}
});
