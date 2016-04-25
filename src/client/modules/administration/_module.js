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
window.mods['administration'] = function ()  {

	var modul = { name:"Administration", pos:7, items:[] };

	if( checkPermission("administration.listUsers") )
		modul.items.push({name:"Benutzerverwaltung",id:"user"});

	if( checkPermission("administration.listRoles") )
		modul.items.push({name:"Nutzergruppen",id:"roles"});

	if( checkPermission("administration.editConfig") )
		modul.items.push({name:"Einstellungen",id:"settings"});

	return modul;
};

getAviableEditRoles = function() {

}

getCurrentRole = function () {
	var path = app.getModulPath();
	if( path.length >= 1 ) {
		var cust = Customers.findOne( {_id: app.getCustomer() });
		if( cust ) {
			var dep = cust.departments[ app.getDepartment() ];
			if( dep  && dep.roles ) {
				return dep.roles[ path[1] ];
			}
		}
	}
	return null;
}
