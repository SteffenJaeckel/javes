console.log("Add Huntingplans to modules");
if( window.mods == null ) {
	window.mods = {};
}

window.mods['huntingplans'] = function ()  {
	var modul = { name:"Jagdplanung", pos:2, items:[]};
	if( checkPermission("huntingplans.viewParticipants") )
		modul.items.push({name:"Teilnehmer",id:'participants'});

	if( checkPermission("huntingplans.viewPlans") ) {
		modul.items.push({name:"Kalender",id:'schedule'});
		modul.items.push({name:"Einzelplanung",id:'huntingplans'});
	}

	return modul;
};

getCurrentPlan = function( write ) {
	var path = app.getModulPath();
	if( path.length >= 2 ) {
		var cond = { _id: path[1] };
		if( write ) {
			cond['viewer.'+Meteor.userId()] = {'$lte':1 }; // check for write permissions ....
		}
		return Plans.findOne( cond );
	}
	return null;
}

getCurrentPlanId = function () {
	var path = app.getModulPath();
	if( path.length >= 2 ) {
		return path[1];
	}
	return '';
}

getCurrentDrive = function () {
	var path = app.getModulPath();
	if( path.length >= 3 ) {
		var plan = Plans.findOne( {_id: path[1] });
		if( plan ) {
			if( path.length >= 3 ) {
				var id = path[2].split('-');
				var index = parseInt( id[1] );
				if( plan.drives.length > index ) {
					return plan.drives[index];
				} else {
					return plan.drives[0];
				}
			} else {
				return plan.drives[0];
			}
		}
	}
	return null;
}

getCurrentDriveIndex = function () {
	var path = app.getModulPath();
	if( path.length >= 3 ) {
		var plan = Plans.findOne( {_id: path[1] });
		if( plan ) {
			if( path.length >= 3 ) {
				var id = path[2].split('-');
				var index = parseInt( id[1] );
				if( plan.drives.length > index ) {
					return index;
				} else {
					return 0;
				}
			} else {
				return 0;
			}
		}
	}
	return 0;
}

getCurrentRouteId = function() {
	var path = app.getModulPath();
	if( path.length >= 4 ) {
			return path[3];
	}
	return 0;
}
