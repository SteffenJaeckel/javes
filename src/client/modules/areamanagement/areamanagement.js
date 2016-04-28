
Template.areamanagement.created = function () {
	this.areas = Meteor.subscribe('areas')
	this.notifications = Meteor.subscribe('notifications')
}

Template.areamanagement.rendered = function() {
		console.log("create map")
}

Template.areamanagement.destroyed = function () {
	this.areas.stop();
	this.notifications.stop();
}

Template.areamanagement.helpers({
	areas: function () {
		return Areas.find({},{ sort : { 'name':1 } });
	},
	getSelected: function( id ) {
		return ( id == app.getPath()[4] ) ? 'selected':'';
	},
	mapEnabled: function() {
		return (getCurrentArea() !=null)
	}
})

Template.areamanagement.events({
	'click .new': function(e) {
		modals.push('newarea');
	},
	'click .area' : function(e) {
		app.setSubPath(4,$(e.currentTarget).attr('data'))
		fitArea( getCurrentArea() )
	},
	'click #area-share' : function() {
    Session.set('modal', { shareinfo: true } );
  },
  'click #adjust-area' : function() {
    editor.push("areaeditor",{},"");
  },
  'click #edit-area' : function() {
    var current = getCurrentArea();
    modals.push("editarea",current,"");
  },
  'click #area-overview' : function() {
    modals.push("areaoverview",{});
  },
  'click #delete-area' : function() {
    if( confirm("Wollen sie wirklich den Pirschbezirk löschen ?" ) ) {
      Meteor.call('deleteArea', getCurrentArea()._id , function( e ) {
        if( e ) {
          console.log( e );
        }
      })
    }
  },
  'click #report-overview' : function() {
    modals.push("reportoverview",{});
  },
  'click #new-stand' : function() {
		Session.set('gis-selection',null);
    Session.set("standdata", { type:1, desc:"", name: "1" });
    editor.push("standeditor",{} );
  },
  'click #new-kill-report' : function() {
		Session.set('gis-selection',null);
    Session.set("reportdata", { type:3, desc:"", gametype:1, hunttype:1, gender:0, ageclass:0, badgeid: 0, date: new Date() });
    editor.push("reporteditor",{} );
  },
  'click #new-view-report' : function() {
		Session.set('gis-selection',null);
    Session.set("reportdata", { type:1, desc:"", gametype:1, date: new Date() });
    editor.push("reporteditor",{} );
  },
  'click #new-miss-report' : function() {
		Session.set('gis-selection',null);
    Session.set("reportdata", { type:2, desc:"", gametype:1, date: new Date() });
    editor.push("reporteditor",{} );
  }
})
/*
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
*/
