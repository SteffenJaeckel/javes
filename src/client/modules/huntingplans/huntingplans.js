console.log("Add Huntingplans to modules");
if( window.mods == null ) {
	window.mods = {};
}
window.mods['huntingplans'] = { index:2, name: "Jagdplanung", icon:"fa-server", enabled:true,
	defaultitem: function( path ) {
		if( path.length == 0 ) {
			return 'schedule';
		} else if( path.length == 1 ) {
			return 'drive-0';
		}
		return null;
	},
	menuitems: function( path ) {
		console.log("get items " , path )
		if( path.length == 0 ) {
			var items = [
				{name:'Terminplanung',id:'schedule',icon:'fa-calendar'},
				{name:'Teilnehmer',id:'participants',icon:'fa-group'}
			];

			var cursor = Plans.find();
			if( cursor.count() > 0 ) {
				items.push( {divider:true} );
				cursor.forEach( function (plan) {
					items.push( {name: plan.name, id: plan._id,icon:'fa-folder'} )
				})
			}
			return items;
		} else if( path.length == 1 ){
			var plan = Plans.findOne( { _id: path[0] } );
			if( plan ) {
				var items = [];
				for( var d=0;d < plan.drives.length;d++ ) {
					items.push( {name:'Treiben '+(d+1),id:'drive-'+d,icon:'fa-refresh'} )
				}
				return items;
			}
		} else if( path.length == 2 ) {
			var drive = getCurrentDrive();
			var items = [];
			for( var rid in drive.routes ) {
				items.push({ name:'Gruppe '+drive.routes[rid].group, id:rid, icon:'fa-share-alt'} )
			}
			return _.sortBy(items,'name');
		}
	},
	token : function () {
		return {'huntingplan-invitation':'invitation_page','huntingplan-request':'request_page'};
	},
	selected: function( path ) {
		console.log( path );
		if( path.length >= 5 ) {
			switch( path[4] ) {
				case 'participants':
					break;
				case 'schedule':
					break;
				default :
					DataChangeHandler.call( path );
					break;
			}
		}
	}
};

DataChangeHandler = {
	items: {},
	add : function( key, func ) {
		DataChangeHandler.items[ key ] = func;
	},
	remove : function( key ) {
		delete DataChangeHandler.items[ key ]
	},
	call : function ( path ) {
		for( var k in DataChangeHandler.items ) {
			DataChangeHandler.items[k]( path );
		}
	}
}

Template.huntingplans.created = function() {
	this.participants = Meteor.subscribe("participants");
  this.plans = Meteor.subscribe("huntingplans");
}

Template.huntingplans.destroyed = function() {
	this.participants.stop();
	this.plans.stop();
}

Template.huntingplans.helpers({
	getsubmodule : function() {
		var path = app.getPath();
		console.log("render submodule ",path);
		if( path.length >= 5 ) {
			switch( path[4] ) {
				case 'participants':
					return 'participants';
				case 'schedule':
					return 'schedule';
				default :
					return 'huntingplanmap';
			}
		}
	}
})

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
	if( path.length >= 2 ) {
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
