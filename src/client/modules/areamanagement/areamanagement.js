console.log("Add Areamanagement to modules");
if( window.mods == null ) {
	window.mods = {};
}
window.mods['areamanagement'] = { index:2,name: "Revierverwaltung", icon:"fa-compass", enabled:true, divider:true,
	defaultitem: function ( path ) {
		return "dashboard";
	},
	menuitems: function( path ) {
		if( path.length == 0 ) {
			var areas = []
			Areas.find().forEach( function ( area ) {
				areas.push( { name:area.name, id:area._id, icon:'fa-tree' } )
			})
			if( areas.length == 0 ) {
				return [{name:"Neuen Pirschbezik anlegen ...",id:"new_area",icon:"fa-plus"}];
			} else {
				areas.unshift( {divider:true} );
				areas.unshift( {name:"Übersicht",id:"dashboard",icon:"fa-inbox"} );
				return areas;
			}
		} else {
			switch( path[0] ) {
				case 'dashboard':
					return null; /*[
						{name:'Neuen Jäger hinzufügen',id:'add-new-hunter',icon:'fa-user-plus'},
						{name:'Einladungen veschicken',id:'send-invitations',icon:'fa-envelope'},
					];*/
				break;
				default:
					return [
						{id:"new-area" , name:"Neues Revier" ,icon:'fa-plus'},
						{divider:true},

						{id:"edit-borders", name:"Pirschbezirksgrenzen anpassen ..." ,icon:'fa-pencil'},
						{id:"rename-area", name:"Pirschbezirk umbennen ..." ,icon:'fa-edit'},
						{id:"share-info", name:"Pirschbezirk teilen ..." ,icon:'fa-share'},
						{divider:true},

						{id:"report-overview", name:"Übersicht Berichte ..." ,icon:'fa-table'},
						{id:"area-overview", name:"Übersicht jagdliche Einrichtungen ..." ,icon:'fa-table'},
						{divider:true},

						{id:"new-stand", name:"Neue jagdliche Einrichtung ..." ,icon:'fa-plus'},
						{divider:true},

						{id:"new-view-report", name:"Sichtung eintragen ..." ,icon:'fa-binoculars'},
						{id:"new-miss-report", name:"Anschuss eintragen ..." ,icon:'fa-pagelines fa-rotate-90'},
						{id:"new-kill-report", name:"Abschuss eintragen ..." ,icon:'fa-crosshairs '},
						{divider:true},
						{id:"delete-area", name:"Revier entfernen", icon:'fa-trash'},
					];
					break;
			}
		}
	}
};

Template.areamanagement.created = function () {
	this.areas = Meteor.subscribe('areas')
}

Template.areamanagement.helpers({
	showdashboard: function () {
		return app.getPath()[1] == "dashboard";
	},
	selectedAreaName: function() {
		var area = Areas.findOne( { _id:Meteor.user().profile.currentSelectedArea } );
		if( area ) {
			return area.name;
		}
		return "Revier auswählen";
	},
	areas: function () {
		return Areas.find();
	},
	canEdit: function () {
		var area = Areas.findOne({_id:Meteor.user().profile.currentSelectedArea });
		if( area ) {
			return area.viewer[ Meteor.userId() ] < 2;
		}
		return false;
	}
})

Template.areamanagement.events({
	'click .area-item':function ( e ) {
		var area = Areas.findOne({_id:$(e.currentTarget).attr('id')})
		if( area ) {
			Meteor.call('selectArea',$(e.currentTarget).attr('id'), function() {
				SelectArea(Meteor.user().profile.currentSelectedArea)
			})
		}
	},
	'click #new-view-report':function(e) {
		Session.set('reportdata',{ hunttype:0,gender:0,gametype:1,type:1,date:new Date(),shortdesc:'',desc:'' });
		Session.set('modal', { newviewreport: true } );
		Session.set('editmode',{ editreportposition: true });
	},
	'click #new-kill-report':function(e) {
		Session.set('reportdata',{ hunttype:1,ageclass:0,badgeid:'',gender:0,gametype:1,type:3,date:new Date(),desc:'' });
		Session.set('modal', { newkillreport: true } );
		Session.set('editmode',{ editreportposition: true });
	},
	'click #new-miss-report':function(e) {
		Session.set('reportdata',{ hunttype:0,gender:0,ageclass:0,gender:0,gametype:1,type:2,date:new Date(),desc:'' });
		Session.set('modal', { newmissreport: true } );
		Session.set('editmode',{ editreportposition: true });
	},
	'click #edit-borders': function (e) {
		var area = Areas.findOne({_id:Meteor.user().profile.currentSelectedArea});
		Session.set('shapedata',area.shape );
		Session.set('editmode',{ editborder:true, source:"shapedata",hide: area._id } );
	},
	'click #report-overview': function( e ) {
		modals.push('reportoverview');
	},
	'click #area-overview':function( e ) {
		modals.push('areaoverview');
	},
	'click #new-stand':function ( e ) {
		newWizzard('stand')
		/*Session.set('standdata',{ name:'Neue jagdliche Einrichtung',desc:'',type:1 });
		Session.set('modal', { newstand: true } );
		Session.set('editmode',{ editstandposition:true } );*/
	},
	'click #share-info':function ( e ) {
		Session.set('modal', { shareinfo: true } );
	},
	'click #new-area':function ( e ) {
		Session.set('shapedata',[]);
		Session.set('newarea', {
			name:'',
			desc:'',
			obf:'Hangelsberg',
			revier:'Heidegarten',
			shape:[]
		});
		Session.set('editmode', { editborder: true } );
		Session.set('modal', { newarea: true } );
	},
	'click #rename-area': function ( e ) {
		var area = Areas.findOne({_id:Meteor.user().profile.currentSelectedArea});
		Session.set('areadata', { id:area._id,name:area.name,desc:area.desc } );
		Session.set('shapedata',area.shape );
		Session.set('modal', { editarea: true } );
	},
	'click #delete-area': function ( e ) {
		if( confirm('Wollen Sie das Revier wirklich löschen?') ) {
			var ca = Meteor.user().profile.currentSelectedArea;
			var temp = Areas.findOne( { _id:{ $not: ca }} );
			if( temp ) {
				Meteor.call('deleteArea',ca , temp._id );
			} else {
				Meteor.call('deleteArea',ca , null );
			}
		}
	},
	'click .rename-area-modal':function (e) {
		if( e.currentTarget.id == 'save' ) {
			Areas.update( { _id:Meteor.user().profile.currentSelectedArea }, { $set:{ name: $('#area-name').val() } } );
		}
	}
})
