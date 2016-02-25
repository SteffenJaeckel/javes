//**********************************************************************
//
//  Template: View Stand
//
//**********************************************************************

function isBetween( start, end, time ) {
	if( start > end ) {
		return (start >= time && time >= end );
	} else {
		return (start <= time && time <= end );
	}
}

Template.viewstand.rendered = function() {
/*
	var data = google.visualization.arrayToDataTable([
		['Jahr', 'Rotwild', 'Rehwild', 'Schwarzwild'],
		['2010',  1,1,0],
		['2011',  0,1,0],
		['2012',  2,1,1],
		['2013',  2,3,0]
	]);

	var options = {
		title: 'Erlegtes Wild im 200m Umkreis',
		hAxis: {title: 'Jahr', titleTextStyle: {color: 'black'}}
	};

	var chart = new google.visualization.ColumnChart(document.getElementById('statistic'));
	chart.draw(data, options);
	*/
}

Template.viewstand.canEdit = function () {
	var area = Areas.findOne({_id:Meteor.user().profile.currentSelectedArea });
	if( area ) {
		return area.viewer[ Meteor.userId() ] < 2;
	}
	return false;
}

Template.viewstand.allocation = function() {

	var sid = Session.get('standdata')._id;

	var aday = 24*60*60*1000;
	var now = new Date();
	var yesterday = new Date(now.getTime() - aday);
	yesterday.setHours(0);
	yesterday.setMinutes(0);
	yesterday.setSeconds(0);
	yesterday.setMilliseconds(0);

	var tomorrow = new Date(now.getTime() + aday);
	var reservations = [
		{_id:'3xb4iJxdNR3Z9mmxu',stand:'hPFzPyzYTqJq2L2y5',user:{id:'3xb4iJxdNR3Z9mmxu',name:'Steffen',surname:'Jäckel'},from:now, to: tomorrow }
	];

	var wds  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

	var hour = 60*60*1000;
	var days = [];
	var timecode = yesterday.getTime();
	var state = Session.get('allocationstate');

	if( Session.get('editallocation') ) {
		var selected = Session.get('editallocation')._id;
	} else if( Session.get('allocationinfo') ) {
		var selected = Session.get('allocationinfo')._id;
	}

	for( var d=0;d < 5;d++) {
		var hours = [];
		var classes = ['free','notaviable','reserved'];


		if( d==0) {
			var str = 'Gestern'
		} else if ( d == 1 ) {
			var str = 'Heute'
		} else if ( d == 2 ) {
			var str = 'Morgen'
		} else {
			var str = wds[cur.getDay()];
		}

		for( var i=0;i < 24;i++ ) {

			var cl = '';
			Allocations.find({ stand:sid, to :{ $gt:yesterday }}).forEach( function (obj ) {
				if( isBetween( obj.from,obj.to, timecode ) ) {
					if( obj.user.id == Meteor.userId() ) {
						cl = 'reserved';
					} else {
						cl = 'notaviable';
					}

					if( selected == obj._id ) {
						cl += ' current';
					}

					if( timecode < now.getTime() ) {
						cl += " disabled";
					}

					hours.push({ 'class':cl, data: obj._id });
					return false;
				}
			})

			if( cl == '' ) {
				cl = 'free';
				if( timecode < now.getTime() ) {
					cl += " disabled";
				} else {
					cl += " available"
				}

				if( state ) {
					if( state.start ) {
						if( state.start.getTime() == timecode ) {
							cl += " start";
						}

						if( state.end ) {
							if( isBetween( state.start.getTime() , state.end.getTime(), timecode ) ) {
								cl += " between";
							}

							if( state.end.getTime() == timecode ) {
								cl += " end";
							}
						}
					}
				}
				hours.push({ 'class':cl, data: timecode });
			}
			timecode +=hour ;
		}
		var cur = new Date( timecode );



		days.push( {day:str,date: cur,hours:hours } );
	}
	return days;
}

Template.viewstand.allocationinfo = function() {
	return Session.get('allocationinfo')
}

Template.viewstand.allocationstate = function() {
	return Session.get('allocationstate')
}

Template.viewstand.editallocation = function() {
	return Session.get('editallocation')
}

Template.viewstand.standname = function () {
	return Session.get('standdata').name;
}

Template.viewstand.standdesc = function () {
	return Session.get('standdata').desc;
}

Template.viewstand.standtype = function ( i ) {
	return Session.get('standdata').type;
}

Template.viewstand.conditionInfo = function () {
	return renderConditionInfo( Session.get('standdata').condition )
}

Template.viewstand.events({
	'click .modal-close': function( e ) {
		modals.pop()
	},
	'click #move-stand': function( e ) {
		Session.set('editmode',{ editstandposition:true } );
	},
	'click #delete-stand': function( e ) {
		if( confirm('Wirklich löschen?') ) {
			Meteor.call('deleteStand',Session.get('standdata')._id, function ( e ) {
				modals.pop();
			})
		}
	},
	'click .notaviable' : function ( e ) {
		var alloc = Allocations.findOne({_id:$(e.currentTarget).attr('data')});
		Session.set('allocationinfo',alloc);
		Session.set('editallocation',null);
		Session.set('allocationstate',null )
	},
	'click #abort-allocationinfo':function( e ) {
		Session.set('allocationinfo',null);
	},
	'click .reserved' : function ( e ) {
		var alloc = Allocations.findOne({_id:$(e.currentTarget).attr('data')});
		Session.set('editallocation',alloc);
		Session.set('allocationinfo',null);
		Session.set('allocationstate',null )
	},
	'click #abort-editallocation': function( e ) {
		Session.set('editallocation',null);
	},
	'click #remove-editallocation': function( e ) {
		Meteor.call('removeAllocation', Session.get('editallocation')._id, function(e){
			if(e) {
				console.log(e);
			}
			Session.set('editallocation',null);
		})
		$(e.currentTarget).disable();
	},
	'click .available' : function ( e ) {
		Session.set('editallocation',null);
		Session.set('allocationinfo',null);
		var state = Session.get('allocationstate');
		if( state && state.inselection ) {
			state['inselection'] = false;
			Session.set('allocationstate',state )
		} else {
			state = {};
			state['start'] = new Date( parseInt( $(e.currentTarget).attr('data')) );
			state['end'] = new Date( parseInt( $(e.currentTarget).attr('data')) );
			state['inselection'] = true;
			Session.set('allocationstate',state )
		}
	},
	'mouseenter .available' : function( e ) {
		var state = Session.get('allocationstate');
		if( state && state.inselection === true ) {
			state.end = new Date( parseInt( $(e.currentTarget).attr('data')) );
			Session.set('allocationstate',state )
		}
	},
	'click #abort-allocation': function( e ) {
		Session.set('allocationstate',null);
	},
	'click #commit-allocation': function( e ) {
		var sid = Session.get('standdata')._id;
		var aid = Session.get('standdata').area;
		var from = Session.get('allocationstate').start;
		var to =  Session.get('allocationstate').end;
		Meteor.call('insertAllocation',sid,aid,from,to, function( e ) {
			if( e ) {
				console.log(e);
			}
			Session.set('allocationstate',null);
		})
		//$('#abort-allocation').disable();
		//$('#commit-allocation').disable();
	},
	'click #edit-stand': function( e ) {
		modals.push('editstand')
	},
	'click #set-condition-bad': function( e ) {
		var sid = Session.get('standdata')._id;
		Meteor.call('updateCondition',sid, 1, function(e) {
			var stand = Stands.findOne({_id:sid});
			if( stand ) {
				setObj('standdata','condition',stand.condition );
			}
		});
	},
	'click #set-condition-ok': function( e ) {
		var sid = Session.get('standdata')._id;
		Meteor.call('updateCondition', sid, 2,function(e) {
			var stand = Stands.findOne({_id:sid});
			if( stand ) {
				setObj('standdata','condition',stand.condition );
			}
		});
	},
	'click #set-condition-new': function( e ) {
		var sid = Session.get('standdata')._id;
		Meteor.call('updateCondition', sid, 3, function(e) {
			var stand = Stands.findOne({_id:sid});
			if( stand ) {
				setObj('standdata','condition',stand.condition );
			}
		});
	}
})

Template.viewstand.created = function( ) {
	this.comments = Meteor.subscribe("comments",Session.get('standdata')._id)
}

Template.viewstand.destroyed = function( ) {
	this.comments.stop();
	Session.set('standdata',null)
}
