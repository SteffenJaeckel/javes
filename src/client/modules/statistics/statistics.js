console.log("Add Statistics to modules");
if( window.mods == null ) {
	window.mods = {};
}/*
window.mods['statistics'] = { index: 50, name: "Statistiken", icon:"fa-bar-chart", enabled:'disabled', divider:true,
	defaultitem: function() {
		return 'schedule';
	},
	menuitems: function( path ) {
		if( path.length == 0 ) {
			return [
				{name:'Jagd',id:'participants',icon:'fa-crosshairs'},
				{name:'Einschlag',id:'schedule',icon:'fa-tree'},
				{name:'Verjüngung',id:'schedule',icon:'fa-calendar'}
			];
		}
	},
	selected: function( item ) {
		console.log( item )
	}
};
*/
/*
console.log("Add cuttingplans to modules");
window.mods['cuttingplans'] = { index: 5, name: "Einschlagsplanung", icon:"fa-tree", enabled:'disabled', divider:true,
	defaultitem: function() {
		return 'schedule';
	},
	menuitems: function( path ) {
	},
	selected: function( item ) {
		console.log( item )
	}
};

console.log("Add woodbooks to modules");
window.mods['woodbooks'] = { index: 5, name: "Holzbücher", icon:"fa-book", enabled:'disabled',
	defaultitem: function() {
		return 'schedule';
	},
	menuitems: function( path ) {
	},
	selected: function( item ) {
		console.log( item )
	}
};

console.log("Add plantingplans to modules");
window.mods['plantingplans'] = { index: 10, name: "Verjüngungsplanung", icon:"fa-pagelines", enabled:'disabled', divider:true,
	defaultitem: function() {
		return 'schedule';
	},
	menuitems: function( path ) {
	},
	selected: function( item ) {
		console.log( item )
	}
};
*/