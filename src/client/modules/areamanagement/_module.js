console.log("Add Areamanagement to modules");
if( window.mods == null ) {
	window.mods = {};
}
window.mods['areamanagement'] = function ()  {

	if( checkPermission("areamanagement.viewAreas") )
		return { name:"Pirschbezirksverwaltung", pos:0, items:[{name:"Pirschbezirksverwaltung",id:'areamanagement'}]};
	else
		return null;
};

getCurrentArea = function( ) {
    var path = app.getModulPath();
    if( path.length >= 1 ){
       return Areas.findOne({_id:path[1]});
    }
    return null;
}
