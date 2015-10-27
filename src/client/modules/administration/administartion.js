/*
	Um das Administrationsmodul nutzen zu können benötigen Sie admin rechte,
	zur Zeit können diese aus sicherheits gründen nur über die Datenbank selbst
	vergeben werden.

	[user].isServerAdmin : true

*/
console.log("Add Administration to modules");

if( window.mods == null ) {
	window.mods = {};
}
window.mods['administration'] = { index:1, name: "Administration", icon:"fa-group", enabled:true,
	defaultitem: function() {
		return 'user';
	},
	menuitems: function( path ) {
		if( path.length == 0 ) {
			if( Meteor.user().isServerAdmin == true ) {
				return [
					{name:'Einstellungen',id:'settings',icon:'fa-cogs'},
					{name:'Benutzer',id:'user',icon:'fa-user'},
				];
			} else {
				return [
					{name:'Benutzer',id:'user',icon:'fa-user'},
				];
			}
		}
	},
	selected: function( item ) {
		console.log( "on select item ",item );
	}
};

Template.administration.helpers({
	getsubmodule : function() {
		var path = app.getModulPath();
		if( path.length >= 2 ) {
			switch( path[1] ) {
				case 'settings':
					return 'customer';
				case 'user':
					return 'user';
			}
		}
	}
})
