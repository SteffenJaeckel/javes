function readableName( user ) {
	return user.profile.firstname+" "+user.profile.surname;
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
  viewAreas: "Pirschbezirke ansehen",

	sendInvitation: "Jäger einladen",

  newArea: 'Pirschbezirke erstellen',
  deleteArea: 'Pirschbezirke löschen',

  updateArea: 'Pirschbezirke bearbeiten',
	shareArea: 'Pirschbezirke teilen',

	addStands: 'Stände erstellen',
  removeStands: 'Stände löschen',
	allocateStands: 'Stände reservieren',

	addReports: 'Berichte erstellen',
  editReports: 'Berichte bearbeiten',
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
			ownertypes:['Besitzer','Mitbesitzer','Gast'],
			viewer: obj
		});
		Meteor.users.update( {_id:this.userId},{$set:{'profile.currentSelectedArea':id}});
		return true;
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
	sendInvitation:function( areaId, email, name, surname ) {
		email = email.toLowerCase();
		var sender = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne( { _id: areaId, deleted:false } );
		var newId = Accounts.createUser( { 'email': email , 'profile': { name:name, surname:surname, avatar:0,currentSelectedArea:areaId,currentMode:0, invitedBy : this.userId } } );
		var obj = {};
		obj['viewer.'+newId ] = area.viewer[this.userId]+1;
		console.log("invite @ "+email)
		Areas.update({'_id':areaId}, { '$set' : obj } );
		Accounts.emailTemplates.siteName = "revier-plan.de";
		Accounts.emailTemplates.from = sender.profile.name+" "+sender.profile.surname+"<"+sender.emails[0].address+">";
		Accounts.emailTemplates.enrollAccount.subject = function (user) {
			return "Hallo " + user.profile.name+" "+user.profile.surname;
		};

		Accounts.emailTemplates.enrollAccount.text = function (user, url) {
			var sender = Meteor.users.findOne( { _id: user.profile.invitedBy });
			var sendername = readableName( sender );
			var revier = Areas.findOne({_id: user.profile.currentSelectedArea} );
			return ""+_.escape(sendername)+" hat Sie eingeladen, mit Ihm gemeinsam das Revier "+_.escape(revier.name)+" auf der Website revier-plan.de zu teilen.⁄n"+
			"Um der Einladung zu folgen benutzen Sie bitte den folgenden Link : "+url+"⁄n"+
			"Wenn Sie "+_.escape(sendername)+" nicht kennen und auch sonst keine Beziehung zur Jagd haben, handelt es sich möglicherweise um einen Irrtum. Wir bitten Sie das zu Entschuldigen⁄n⁄n"+
			"Das Revierplan Team freut sich bereits auf Sie.⁄n";
		};

		Accounts.emailTemplates.enrollAccount.html = function (user, url) {
			var sender = Meteor.users.findOne( { _id: user.profile.invitedBy });
			var sendername = readableName( sender );
			var revier = Areas.findOne({_id: user.profile.currentSelectedArea} );
			return "<p><b>"+_.escape(sendername)+"</b> hat Sie eingeladen, mit Ihm gemeinsam das Revier <b>"+_.escape(revier.name)+"</b> auf der Website revier-plan.de zu teilen.</p>"+
			"<p>Um der Einladung zu folgen benutzen Sie bitte den folgenden Link : <a href="+url+">"+url+"</a>.</p>"+
			"<p>Wenn Sie <b>"+_.escape(sendername)+"</b> nicht kennen und auch sonst keine Beziehung zur Jagd haben, handelt es sich möglicherweise um einen Irrtum. Wir bitten Sie das zu Entschuldigen</p>"+
			"<p>Das Revierplan Team freut sich bereits auf Sie.</p>";
		};
		Accounts.sendEnrollmentEmail(newId);
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
	editArea:function( areaId, name, desc ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne({_id:areaId} );
		if( area.viewer[this.userId] <= 1  ) {
			var oldname = area.name;
			Areas.update({_id:areaId },{$set:{name:name,desc:desc}} );
			addAreaNofification(areaId, this.userId, { areadescription_changed:true,'trigger':readableName(me),'oldname':oldname,'newname':name } );
		}
		return true;
	},
	updateAreaShape:function( areaId, shape ) {
		var shape = Validate( shape, DataModels["Shapemodel"] );
		var me = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne({_id:areaId} );
		if( area.viewer[this.userId] <= 1  ) {
			Areas.update({_id:areaId },{$set:{geometry:shape}} );
			//addAreaNofification(areaId, this.userId, { areaborders_changed:true,'trigger':readableName(me),'old':old } );
		}
		return true;
	},
	deleteArea:function( areaId, selectArea ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var area  = Areas.findOne({_id:areaId});
		if( area && area.viewer[this.userId] != null ) {
			if( _.keys(area.viewer).length == 1 ) {
				Stands.remove({ area: areaId });
				Reports.remove({ area: areaId });
				Areas.remove({ _id:areaId });
			} else {
				if( area.viewer[this.userId] == 0 ) {
					throw new Error(403,"owners_cant_delete_areas_with_more_than_one_viewers");
				} else {
					var obj = {};
					obj['viewer.'+this.userId ] = "";
					Areas.update({'_id':areaId}, { '$unset' : obj } );
					addAreaNofification(areaId, this.userId, { leftarea:true,'trigger':readableName(me) } );
				}
			}
			Meteor.users.update( {_id:this.userId},{$set:{'profile.currentSelectedArea':selectArea }});
		}
		return true;
	},
	//   stands
	newStand: function ( areaId, name, desc, type, position ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne({_id:areaId});
		if( area && area.viewer[this.userId] < 2 ) {
			var id = Stands.insert({
				area:areaId,
				name: name,
				desc: desc,
				type: type,
				condition: { user:readableName(me) ,updated:new Date(), value:3.0 },
				rating:5,
				position: position,
				deleted: false,
				created:new Date()
			});
			addAreaNofification(areaId, this.userId, { stand_created:true, trigger:readableName(me), stand:name, loc:position } );
			return id;
		}
		return '';
	},
	moveStand: function( standId, newposition ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var stand = Stands.findOne({_id:standId});
		if( stand ) {
			var area = Areas.findOne({_id:stand.area});
			if( area && area.viewer[this.userId] < 2 ) {
				Stands.update( {_id:standId},{ $set:{'position':newposition } });
				addAreaNofification(area._id, this.userId, { stand_moved:true, trigger:readableName(me), stand:stand.name, loc:newposition, old: stand.position } );
			}
		}
	},
	editStand: function ( standId, name, desc, type, rating, condition ) {
		var me = Meteor.users.findOne( { _id: this.userId });
		var stand = Stands.findOne({_id:standId});
		if( stand ) {
			var area = Areas.findOne({_id:stand.area});
			if( area && area.viewer[this.userId] < 2 ) {
				Stands.update( {_id:standId},{ $set:{'name':name,'desc':desc,'type':type } });
				addAreaNofification(me.profile.currentSelectedArea, this.userId, { stand_edited:true, trigger:readableName(me), stand:stand.name, loc:stand.position } );
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
				addAreaNofification(me.profile.currentSelectedArea, this.userId, { stand_deleted:true, trigger:readableName(me), stand:stand.name, loc:stand.position } );
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

		var error = Allocations.findOne(  { stand:standId, $or:[ {$and : [ {'from':{$gte:from}},{'from':{$lte:to}} ] }, {$and: [{'to':{$gte:from}},{'to':{$lte:to}}]}] } )
		if( error ) {
			console.log( error )
			console.log( from )
			console.log( to )
			console.log( standId )
			throw new Meteor.Error(403,"Reservierungen dürfen sich nicht überlappen");
		}
		var doc = {};

		doc['user'] = { id: me._id, name:me.profile.name, surname: me.profile.surname };
		doc['stand'] = standId;
		doc['from'] = from;
		doc['to'] = to;
		doc['area'] = areaId;

		Allocations.insert( doc );

	},
	removeAllocation: function( allocationId ) {
		Allocations.remove({_id:allocationId,'user.id':this.userId});
	},
	addReport: function( report ) {
		var me = Meteor.users.findOne( {_id:this.userId});
		if( report.date == null || report.date > new Date() ) {
			throw new Meteor.Error(403, "future_dates_are_not_allowed");
		}
		console.log( report );
		/*check(report.type,NumberRange(1,3));
		check(report.gametype,NumberRange(1,9));
		if( report.type == 3 ) {
			check(report.ageclass, NumberRange(0,5));
			check(report.gender,NumberRange(0,1));
		}*/
		if( report.type == 3 && report.hunttype == 3 ) {
			report['reporter'] = { id:this.userId ,name:report.name ,surname:report.surname };
		} else {
			report['reporter'] = { id:this.userId ,name:me.profile.name ,surname:me.profile.surname };
		}
		Reports.insert( report );
		switch(report.type ) {
			case 1:
				addAreaNofification( report.area, this.userId, { view_report_added:true, trigger:readableName(me), loc:report.position } );
				break;
			case 2:
				addAreaNofification( report.area, this.userId, { miss_report_added:true, trigger:readableName(me), loc:report.position } );
				break;
			case 3:
				addAreaNofification( report.area, this.userId, { kill_report_added:true, trigger:readableName(me), loc:report.position } );
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
			report['reporter'] = { id:this.userId ,name:report.name ,surname:report.surname };
		} else {
			report['reporter'] = { id:this.userId ,name:me.profile.name ,surname:me.profile.surname };
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
