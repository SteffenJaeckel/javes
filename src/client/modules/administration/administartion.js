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
					{name:'Rollen',id:'roles',icon:'fa-credit-card'},
				];
			} else {
				ret = [];

				if( checkPermission("administration.listUsers") )
					ret.push({name:'Benutzer',id:'user',icon:'fa-user'})

				if( checkPermission("administration.listRoles") )
					ret.push( 	{name:'Rollen',id:'roles',icon:'fa-credit-card'} );

				return ret;
			}
		} else if( path.length == 1 ) {
			if( path[0] == 'roles' ) {
				var customer = Customers.findOne({_id:app.getCustomer()});
				if( customer ) {
					var temp = customer.departments[app.getDepartment()].roles;
					var ret = [];
					for( var n in temp ) {
						if( n != 'admin' ) {
							ret.push({name: n, id: n, icon: 'fa-key'});
						}
					}
					return ret;
				}
				return null;
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
					return 'settings';
				case 'user':
					return 'user';
				case 'roles':
					return 'roles';
			}
		}
	}
})

getAviableEditRoles = function() {

}

getCurrentRole = function () {
	var path = app.getModulPath();
	if( path.length >= 2 && path[1] == 'roles' ) {
		var cust = Customers.findOne( {_id: app.getCustomer() });
		if( cust ) {
			var dep = cust.departments[ app.getDepartment() ];
			if( dep  && dep.roles ) {
				return dep.roles[ path[2] ];
			}
		}
	}
	return null;
}
