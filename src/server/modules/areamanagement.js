function readableName( user ) {
	return user.profile.firstname+" "+user.profile.surname;
}

function addPositionNofification( position, userId, message ) {
	var q = { type: "Point", coordinates: [ 13.9341597557067870, 52.4312515705209850 ] };
	Areas.find( { geometry: {$geoIntersects: { $geometry : position }}}).forEach( function ( area ) {
		message['area'] = area.name;
		message['areaId'] = area._id;
		for( id in area.viewer ) {
			if( userId != id ) {
				addUserNotification( id, message )
				console.log( "send msg to user "+id );
			}
		}
	})
}

function addAreaNofification( areaId, userId, message ) {
	var area = Areas.findOne({_id:areaId});
	message['area'] = area.name;
	message['areaId'] = areaId;
	for( id in area.viewer ) {
		if( userId != id ) {
			addUserNotification( id, message )
			console.log( "send msg to user "+id );
		}
	}
}

function addUserNotification( userId, message ) {
	var time = new Date();
	Notifications.insert( {
		user:userId,
		created:time,
		unread:true,
		msg:message
	});
}

Meteor.publish("areas", function () {
	var querry = {};
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	return Areas.find( querry, { fields: {deleted:0} });
});

Meteor.publish("area_stands", function ( areaId ) {
	var querry = {};
	querry[ '_id' ] = areaId;
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	var area = Areas.findOne( querry );
	if( area ) {

		var start = new Date();
		var collection = Stands.find({"location": { "$geoWithin": {"$geometry" : area.geometry }}});
		var end = new Date();
		console.log("request stands ("+collection.count()+") in "+(end.getTime()-start.getTime())+"ms")
		return collection;
		//return Stands.find({ area:areaId , deleted:false }, { fields: {deleted:0} });
	}
	return Stands.find({ unkown: true });
});

Meteor.publish("area_reports", function ( areaId, days, period ) {

	if(days == null ) {
		days = 365; // 1 Jahre abholen und auf dem client filtern ...
	}
	var range = (days*24*60*60*1000);
	var date = new Date();
	//range = Math.max( date.getTime() - period.start.getTime(), range );
	var time = date.getTime()-range;
	date.setTime( time );
	var querry = {};
	querry[ '_id' ] = areaId;
	querry[ 'deleted' ] = false;
	querry[ 'viewer.' + this.userId ] = { $in : [0,1,2] };
	var area = Areas.findOne( querry );
	if( area ) {
		var start = new Date();
		var collection = Reports.find({"location": { "$geoWithin": {"$geometry" : area.geometry }}/*,date:{ $gt : date }*/});
		var end = new Date();
		console.log("request reports ("+collection.count()+") in "+(end.getTime()-start.getTime())+"ms")
		return collection;
	}
	return Reports.find({ unkown: true });
});

Meteor.publish("comments", function ( id ) {
	return Comments.find( { obj:id } );
});

Meteor.publish("allocations", function ( areaId ) {
	return Allocations.find( { area:areaId } );
});

Meteor.publish("viewer_profiles", function ( areaId ) {
	var area = Areas.findOne( {_id:areaId, deleted:false } );
	if( area ) {
		return Meteor.users.find({_id:{ $in:_.keys(area.viewer) } }, { fields:{ profile:1 } } );
	}
	return Meteor.users.find({unknown:true});
});

var actions = {
  viewAreas: { name: "Pirschbezirke ansehen" },

	sendInvitation: { name: "Jäger einladen", dependon:'viewAreas' },

  newArea: { name: 'Pirschbezirke erstellen', dependon:'viewAreas' },
  deleteArea: { name: 'Pirschbezirke löschen', dependon:'viewAreas' },
  updateArea: { name: 'Pirschbezirke bearbeiten', dependon:'viewAreas' },
	shareArea: { name: 'Pirschbezirke teilen', dependon:'viewAreas' },

	addStands: { name: 'Stände erstellen', dependon:'viewAreas' },
  removeStands: { name: 'Stände löschen', dependon:'viewAreas' },
	allocateStands: { name: 'Stände reservieren', dependon:'viewAreas' },

	addReports: { name: 'Berichte erstellen', dependon:'viewAreas' },
  editReports: { name: 'Berichte bearbeiten', dependon:'viewAreas' },

	editComments: { name: 'Kommentare erstellen', dependon:'viewAreas' },
	deleteComments: { name: 'Kommentare löschen', dependon:'viewAreas' },
};

Meteor.startup( function () {
  console.log("starting module areamanagement ...");
	propagateActions( "areamanagement", actions );
})

Meteor.methods({
  //   areas
	newArea : function( options ) {

		/*if (options.title.length > 100)
			throw new Meteor.Error(413, "Title too long");
		if (options.description.length > 1000)
			throw new Meteor.Error(413, "Description too long");
		if (! this.userId)
			throw new Meteor.Error(403, "You must be logged in");*/
		//throw new Meteor.Error(403, "You must be logged in");
		var uid = this.userId;
		var obj = {};
		obj[ this.userId ] = 0;
		var id = Areas.insert({
			name: options.name,
			desc: options.desc,
			shape: options.shape,
			deleted:false,
			created:new Date(),
			viewer: obj
		});
		Meteor.users.update( {_id:this.userId},{$set:{'profile.currentSelectedArea':id}});
		return id;
	},
	shareWith:function( areaId, email ) {
		email = email.toLowerCase();
		var me = Meteor.users.findOne( { _id: this.userId });
		var user = Meteor.users.findOne( { 'emails.address': email });
		var area = Areas.findOne( { _id: areaId, deleted:false } );
		if( ! area ) {
			throw new Meteor.Error(413, 'invalid_area');
		}
		if( _.keys(area.viewer).length > 36 ) {
			throw new Meteor.Error(413, 'to_many_viewers');
		}
		if( area.viewer[this.userId] > 1 ) {
			throw new Meteor.Error(403, 'access_denied');
		}
		if( user ) {
			var obj = {};
			var type = area.viewer[this.userId]+1;
			obj['viewer.'+user._id ] = type;
			Areas.update({'_id':areaId}, { '$set' : obj } );
			addAreaNofification(areaId, this.userId, { user_invited:true, trigger:readableName(me), user: readableName(user), newlevel: type } );

		} else {
			throw new Meteor.Error(413, 'user_not_found');
		}
		return true;
	},
	loadEnrollInfo:function( token ) {
		var user = Meteor.users.findOne({"services.password.reset.token": token});
		var inviter = Meteor.users.findOne({'_id':user.profile.invitedBy});
		if( inviter ) {
			invitername = readableName( inviter );
		} else {
			invitername = 'Steffen Jäckel';
		}
		return { user: user, invitedBy: invitername };
	},
	updateShareWith:function( areaId, userId, newMode ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var user = Meteor.users.findOne( { _id: userId });
		var area = Areas.findOne( { _id: areaId, deleted:false } );
		if( ! area ) {
			throw new Meteor.Error(413, "Das Revier ist ungültig.");
		}
		if( ! user ) {
			throw new Meteor.Error(413, "Der Benutzer konnte nicht gefunden werden.");
		}
		if( area.viewer[this.userId] >= area.viewer[userId] ) {
			throw new Meteor.Error(403, "Sie verfügen nicht die nötigen Rechte um diese Aktion auszufürhen.");
		}
		if( newMode == 0 ) {
			var obj = {};
			obj['viewer.'+this.userId ] = 1;
			obj['viewer.'+userId ] = 0;
			Areas.update({'_id':areaId}, { '$set' :obj });
		} else {
			var obj = {};
			obj['viewer.'+userId ] = newMode;
			Areas.update({'_id':areaId}, { '$set' : obj } );
			addAreaNofification(areaId, this.userId, { changed_user_rights:true, trigger:readableName(me), user: readableName(user), newlevel: newMode });
		}
	},
	removeShareWith:function( areaId, userId ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var user = Meteor.users.findOne( { _id: userId });
		var area = Areas.findOne( { _id: areaId, deleted:false } );
		if( ! area ) {
			throw new Meteor.Error(413, "Das Revier ist ungültig.");
		}
		if( ! user ) {
			throw new Meteor.Error(413, "Der Benutzer konnte nicht gefunden werden.");
		}
		if( area.viewer[this.userId] >= area.viewer[userId] ) {
			throw new Meteor.Error(403, "Sie verfügen nicht die nötigen Rechte um diese Aktion auszufürhen.");
		}
		var obj = {};
		obj['viewer.'+userId ] = "";
		Areas.update({'_id':areaId}, { '$unset' : obj } );
		if( user.profile.currentSelectedArea == areaId ) {
			Meteor.users.update( {_id:userId},{$unset:{'profile.currentSelectedArea':''}});
		}
		addAreaNofification(areaId, this.userId, { user_remove_user:true,'trigger':readableName(me),'user':readableName(user)});
		addUserNotification(userId,{your_are_removed_from_area:true,'trigger':readableName(me),'area':area.name})
	},
	editArea:function( data ) {

		var me = Meteor.users.findOne( { _id: this.userId });
		checkPermission( me,"areamanagement.updateArea" );

		data = Validate(data, {
			_id : { type:'string', name:'Id'},
			name : { type:'string', name:'Name', min: 1, max: 255 },
			desc : { type:'string', name:'Beschreibung', min:0, max: 1024 }
		});

		var me = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne({_id:data._id} );
		if( area.viewer[this.userId] <= 1  ) {
			var oldname = area.name;
			Areas.update({_id:data._id },{$set:{name:data.name,desc:data.desc}} );
			addAreaNofification(data._id, this.userId, { areadescription_changed:true,'trigger':readableName(me),'oldname':oldname,'newname':data.name } );
		}
		return true;
	},
	updateAreaShape:function( areaId, shape ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		checkPermission( me,"areamanagement.updateArea" );

		var shape = Validate( shape, DataModels["Shapemodel"] );
		var area = Areas.findOne({_id:areaId} );
		if( area.viewer[this.userId] <= 1  ) {
			Areas.update({_id:areaId },{$set:{geometry:shape}} );
			//addAreaNofification(areaId, this.userId, { areaborders_changed:true,'trigger':readableName(me),'old':old } );
		}
		return true;
	},
	deleteArea:function( areaId ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		checkPermission( me,"areamanagement.deleteArea" );

		var area  = Areas.findOne({_id:areaId});
		if( area && area.viewer[this.userId] != null ) {
			if( _.keys(area.viewer).length == 1 ) {
				Areas.update({ _id:areaId },{$set: {deleted:true}});
			} else {
				if( area.viewer[this.userId] == 0 ) {
					throw new Error(403,"owners_cant_delete_areas_with_more_than_one_viewers");
				} else {
					var obj = {};
					obj['viewer.'+this.userId ] = true;
					Areas.update({'_id':areaId}, { '$unset' : obj } );
					addAreaNofification(areaId, this.userId, { leftarea:true,'trigger':readableName(me) } );
				}
			}
		}
		return true;
	},
	//   stands
	newStand: function ( name, desc, type, position ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		console.log(me)
		if( me.profile.currentpath.length <= 4 )
			throw new Error(403,"internal_error");

		var area = Areas.findOne({_id: me.profile.currentpath[4] });
		if( area && area.viewer[this.userId] < 2 ) {
			var id = Stands.insert({
				area:area._id,
				name: name,
				desc: desc,
				type: type,
				condition: { user:readableName(me) ,updated:new Date(), value:3.0 },
				location: position,
				deleted: false,
				created:new Date()
			});
			addPositionNofification( position , this.userId, { stand_created:true, trigger:readableName(me), stand:name, loc:position } );
			return id;
		}
		throw new Error(403,"access_denied");
	},
	editStand: function ( standId, name, desc, type, location ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var stand = Stands.findOne({_id:standId});
		if( stand && me.profile.currentpath.length > 4 ) {
			var area = Areas.findOne({ _id: me.profile.currentpath[4] });
			if( area && area.viewer[this.userId] < 2 ) {
				Stands.update( {_id:standId},{ $set:{'name':name,'desc':desc,'type':type, 'location':location } });
				addPositionNofification( location , this.userId, { stand_edited:true, trigger:readableName(me), stand:stand.name, loc:stand.location } );
			}
		}
	},
	updateCondition: function( standId, value ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var name = readableName(me);
		Stands.update( {_id:standId},{ $set:{ condition: { user:name,updated:new Date(),value:value }}} );
	},
	deleteStand: function ( standId ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var stand = Stands.findOne({_id:standId});
		if( stand ) {
			var area = Areas.findOne({_id:stand.area});
			if( area && area.viewer[this.userId] < 2 ) {
				Stands.update( {_id:standId},{ $set:{'deleted':true } });
				addPositionNofification( stand.location , this.userId, { stand_deleted:true, trigger:readableName(me), stand:stand.name, loc:stand.location } );
			}
		}
	},
	insertAllocation: function( standId, areaId, from, to ) {

		var me = Meteor.users.findOne( { _id: this.userId });

		var stand = Stands.findOne({_id:standId, area: areaId } );
		
		if( ! stand ) {
			throw new Meteor.Error(501,"Fehlerhafte stand oder revier id");
		}
		check( from, Date);
		check( to, Date);

		if( from.getTime() > to.getTime() ) {
			var temp = from;
			from = to;
			to = temp;
		}

		if( stand.allocations == null ) {
			stand.allocations = [];
		}


		var error = Stands.findOne(  { stand:standId, $or:[ {$and : [ {'allocations.from':{$gte:from}},{'allocations.from':{$lte:to}} ] }, {$and: [{'allocations.to':{$gte:from}},{'allocations.to':{$lte:to}}]}] } )
		if( error ) {
			console.log( error )
			console.log( from )
			console.log( to )
			console.log( standId )
			throw new Meteor.Error(403,"Reservierungen dürfen sich nicht überlappen");
		}
		var doc = {};

		doc['_id'] = Random.id();
		doc['user'] = { id: me._id, name:me.profile.firstname, surname: me.profile.surname };
		doc['from'] = from;
		doc['to'] = to;

		stand.allocations.push( doc );
		Stands.update( {_id: stand._id }, stand );
	},
	removeAllocation: function( allocationId ) {		
		var stand = Stands.findOne( {"allocations._id": allocationId  } )
		if( stand ) {
			console.log( stand );
			for( var i=0;i < stand.allocations.length;i++ ) {
				if(stand.allocations[i]._id ==  allocationId ) {
					stand.allocations.splice( i , 1 );
					i--;
				}
			}
			Stands.update({_id:stand._id},stand );
			console.log( stand );
		}
	},
	addReport: function( report ) {

		var me = Meteor.users.findOne( {_id:this.userId});
		if( report.date == null || report.date > new Date() ) {
			throw new Meteor.Error(403, "future_dates_are_not_allowed");
		}

		if( report.type == 3 && report.hunttype == 3 ) {
			report['reporter'] = { id:this.userId ,name:report.firstname ,surname:report.surname, img: 1 };
		} else {
			report['reporter'] = { id:this.userId ,name:me.profile.firstname ,surname:me.profile.surname, img: me.profile.avatar };
		}
		Reports.insert( report );
		switch(report.type ) {
			case 1:
				addPositionNofification( report.location ,  this.userId, { view_report_added:true, trigger:readableName(me), loc:report.location } );
				break;
			case 2:
				addPositionNofification( report.location ,  this.userId, { miss_report_added:true, trigger:readableName(me), loc:report.location } );
				break;
			case 3:
				addPositionNofification( report.location ,  this.userId, { kill_report_added:true, trigger:readableName(me), loc:report.location } );
				break;
		}
	},
	changeReport: function( report ) {
		var me = Meteor.users.findOne( {_id:this.userId});
		if( report.date == null || report.date > new Date() ) {
			throw new Meteor.Error(403, "future_dates_are_not_allowed");
		}
		console.log( report );
		if( report.type == 3 && report.hunttype == 3 ) {
			report['reporter'] = { id:this.userId ,name:report.name ,surname:report.surname, img: 1 };
		} else {
			report['reporter'] = { id:this.userId ,name:me.profile.name ,surname:me.profile.surname, img: me.profile.avatar };
		}
		Reports.update({_id:report._id},report);
	},
	deleteReport: function( reportid ) {
		var me = Meteor.users.findOne( {_id:this.userId});
		Comments.remove( { obj: reportid, user: this.userId } );
		Reports.remove( { _id:reportid, 'reporter.id': this.userId } );
	},
	addComment: function( obj, areaId, text ) {
		var me = Meteor.users.findOne( {_id:this.userId});
		check( text,String);
		Comments.insert({
			obj:obj,
			area: areaId,
			user: { 
				id:this.userId,
				name:me.profile.firstname,
				surname:me.profile.surname
			},
			img:me.profile.avatar,
			text:text,
			date: new Date()
		})
		//addPositionNofification( report.location ,  this.userId, { kill_report_added:true, trigger:readableName(me), loc:report.location } );
		//addAreaNofification( areaId, this.userId, { newcomment:true, trigger:readableName(me), obj:obj } );
	},
	deleteComment: function( id ) {
		Comments.remove({_id:id,user:this.userId})
	},
	changeComment: function( id, text ) {
		check(text,String)
		Comments.update({_id:id,'user.id':this.userId},{$set:{data:new Date(),text:text}});
	}
})
