console.log("Add Statistics to modules");
if( window.mods == null ) {
	window.mods = {};
}
window.mods['statistics'] = { name: "Statistiken", icon:"fa-bar-chart", enabled:false,
	defaultitem: function() {
		return 'schedule';
	},
	menuitems: function( path ) {
		if( path.length == 0 ) {
			return [
				{name:'Teilnehmer',id:'participants',icon:'fa-group'},
				{name:'Terminplanung',id:'schedule',icon:'fa-calendar'}
			];
		} else {
			switch( path[0] ) {
				case 'participants':
					return [
						{name:'Neuen Jäger hinzufügen',id:'add-new-hunter',icon:'fa-user-plus'},
						{divider:true},
						{name:'Einladungen veschicken',id:'send-invitations',icon:'fa-envelope'}
					];
				break;
				case 'schedule':
					return null; /*[
						{name:'Neuen Jäger hinzufügen',id:'add-new-hunter',icon:'fa-user-plus'},
						{name:'Einladungen veschicken',id:'send-invitations',icon:'fa-envelope'},
					];*/
				break;
				default:
					return [
						{name:'Plan teilen',id:'huntingplan-share',icon:'fa-share'},

						{name:'Plan löschen',id:'huntingplan-delete',icon:'fa-trash'},
					];
					break;
			}
		}
	},
	selected: function( item ) {
		console.log( item )
		switch( item.attr('id')  ) {
			case 'add-new-hunter':
				modals.push('newhunter', { type:3, managed:true, firstname:'', surname:'', gender:0, title:'',group:'', email:'',phone1:'',phone2:'',isveterinary:false, isdoctor:false, dogs:[] } );			break;
			default:
				console.log( item.attr('id') + " not catched ");
		}
	}
};
