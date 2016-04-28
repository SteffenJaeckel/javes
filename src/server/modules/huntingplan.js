var actions = {
  viewPlans: { name: "Pläne ansehen" },
  viewParticipants: { name: "Teilnehmer ansehen",dependon: 'viewPlans' },

  addHunter: { name: 'Pläne erstellen',dependon: 'viewParticipants' },
  deleteHunter: { name: 'Pläne löschen',dependon: 'viewParticipants' },

  updatePlans: { name: 'Pläne bearbeiten',dependon: 'viewPlans' },

  inviteParticipants: { name: "Teilnehmer einladen",dependon: 'viewParticipants' },
  changeParticipantsState: { name: "Teilnehmerstatus ändern",dependon: 'viewParticipants' },
};

Meteor.startup( function () {
  console.log("starting module huntingplans ...");
  propagateActions( "huntingplans", actions );
})

/*
  Dieser Codeabschnitt definiert die Channels, die von diesem Modul
  bereitgestellt werden.
 */
Meteor.publish("plan_stands", function ( planid, drive ) {
  var user = Meteor.users.findOne({_id:this.userId});
  if( canAccess( user , "huntingplans", "viewPlans") ) {
    var condition = {};
  	condition['_id'] = planid;
  	condition['viewer.'+this.userId ] = { $lte: 2 };
  	var plan = Plans.findOne( condition );
    console.log("load stands for plan:",planid," drive #",drive);
  	if( plan ) {
  		condition = {};
  		condition['location'] = { "$geoWithin": {"$geometry" : plan.drives[ drive ].shape }} ;
  		condition['type'] = { $lte:3 };
  		condition['deleted'] = false ;
  		return Stands.find( condition , { fields: {deleted:0} } );
  	}
  }
	return Stands.find({ unkown: true });
});

Meteor.publish("participants", function ( ) {
  var user = Meteor.users.findOne({_id:this.userId});
  if( canAccess( user , "huntingplans", "viewParticipants") ) {
    if( user && user.profile.currentpath.length >= 2 ) {
      var cust = user.profile.currentpath[0];
      var dep = user.profile.currentpath[1];
      var query = {};
      query['customers.'+cust+'.departments.'+dep+'.roles'] = { $exists: true };
      console.log(query);
    	return Meteor.users.find( query, { limit:1000, fields:{ customers:1,profile:1,emails:1} });
    }
  }
});

Meteor.publish("huntingplans", function () {
  var q = {};
  q['viewer.'+this.userId] = {$lt:3};
  return Plans.find(q);
});

Meteor.methods({
  /// participants ...
	addHunter: function( data ) {

    data['managed'] = true;
    data['invitedBy'] = this.userId;
    data = Validate( data , 'Profilemodel' );

    email = data.email;
		if( email ) {
      delete data.email;
      var id = Accounts.createUser( {'email': email ,'profile': data });
		} else {
      var id = Accounts.createUser( {'username': data.firstname+'_'+data.surname ,'profile': data });
    }
		return id;
	},
  deleteHunter: function( id ) {
    var user = Meteor.users.findOne( {_id:id } );
    if( user.profile.managed == true ) {
      Meteor.users.remove( {_id:id } );
    }
  },
  updateHunter: function( id , email, profile ) {
    if( id ) {
      var user = Meteor.users.findOne({_id:id});
      if( user ) {
        if( user.profile.managed == true ) {
          user.profile = Validate( profile, 'Profilemodel' );
          if( email && email != "" ) {
            user.emails = [{address:data.email, verified:false }];
          }
        } else {
          source = Validate( profile, 'Managedprofilemodel' );
          user.profile.group = source.group;
          user.profile.type  = source.type;
        }
        Meteor.users.update( {_id:user._id},user );
      }
    }
  },
	removeInviteState: function( planId, key ) {
		var update = {};
		update['invitestates.'+key] = '';
		Plans.update( { _id: planId, owner:this.userId }, { $unset: update });
	},
	setInviteState: function( planId, key, state ) {
		var me = Meteor.users.findOne( {_id:this.userId});
		var update = {};
		if( state.invited_success ) {
			update['invitestates.'+key] = { invited_success:true, date: new Date(), by:readableName(me) };
			Plans.update( { _id: planId, owner:this.userId }, { $set: update });
		} else if ( state.invited_refused ) {
			update['invitestates.'+key] = { invited_refused:true, date: new Date(), by:readableName(me) };
			Plans.update( { _id: planId, owner:this.userId }, { $set: update });
		}
	},
  sendRequests: function ( options ) {
    RequestMail = {
      subject: {type:'string', min:1 ,max:256 },
      copycounter: {type:'number', min:0 ,max:50 },
      body: {type:'string', min:1 ,max:2048 },
      signature: {type:'string', min:1 ,max:512 },
      validUntil: {type:'date', min: function() { return new Date(); } }
    };
  },
	sendInvites:function( options ) {

    InviteMail = {
      subject: {type:'string', min:1 ,max:256 },
      body: {type:'string', min:1 ,max:2048 },
      signature: {type:'string', min:1 ,max:512 },
      validUntil: {type:'date', min: function() { return new Date(); } }
    };

    options = Validate( options, 'InviteMail' );

    var me = Meteor.users.findOne( {_id:this.userId});
    var plans = Plans.find({date: {$in:[ ]}});
    var collection = {}

    // collect plans ...
    plans.forEach( function (plan) {
      for( var userid in plan.invitestates ) {
        if( plan.invitestates[ userid ].state == 'invite' ) {
          if( collection[ userid ] == null ) {
            collection[ userid ] = [];
          }
          collection[ userid ].push( plan._id );
        }
      }
    })

    for( var userid in collection ) {
      var id = Token.insert( { userid: userid, validUntil: validUntil, plans: collection[userid] } );
      var url = Meteor.absoluteUrl('#/invitation/' + id );
      try {

        var user  = Meteor.users.findOne( { _id:userid } );
        var email = me.emails[0].address
        if( user && user.emails.length > 1 ) {
          email = user.emails[0];
        }

        var body = '<p>'+options.body+'</p>';
        body += '<p>Bitte benutzen Sie diesen Link:<a href="'+url+'">'+url+'</a> um die Einladung zu bestätigen oder abzusagen.</p>';
        body += '<p>'+options.signatur+'</p>';

        Email.send({
          to: email,
          from: me.emails[0].address,
          subject: options.subject,
          html: body,
        });

        var update = {};
        update['invitestates.'+userid] = { state:'invited',date:new Date(),by:readableName(me) };
        Plans.update({_id:{$in: collection[userid] }},{$set:update});
      } catch( e ) {
        console.log('Cant send email', e);
        throw e;
      }
    }
	},
	refuseInvite:function( planId, key ) {
		var query = {};
		query['_id'] = planId;
		var plan = Plans.findOne( query );
		if( plan ) {
			if( plan.invitestates[key] ) {
				var update = {};
				update['invitestates.'+key] = { invited_refused:true,date:new Date(),by:'Email' }
				Plans.update( query , { $set : update } );
			} else {
				throw new Meteor.Error(403, "invitation_cancelled");
			}
		} else {
			throw new Meteor.Error(404, "plan_not_found");
		}
	},
	acceptInvite:function( planId, key ) {
		var query = {};
		query['_id'] = planId;
		var plan = Plans.findOne( query );
		if( plan ) {
			if( plan.invitestates[key] ) {
				var update = {};
				update['invitestates.'+key] = { invited_success:true,date:new Date(),by:'Email' }
				Plans.update( query , { $set : update } );
			} else {
				throw new Meteor.Error(403, "invitation_cancelled");
			}
		} else {
			throw new Meteor.Error(404, "plan_not_found");
		}
	},
  /// planmanagement ...
	newHuntingPlan : function (options) {
    /// todo validate pemissions ...
    var data = Validate( options, {
      name:{name:'Name',type:'string',min:4, max:128},
      desc:{name:'Beschreibung',type:'string',max:256,optional:true},
      date:{name:'Datum',type:'date',min:new Date() },
			hunters:{name:'Schützen',type:'number' },
			dogs:{name:'Stöberhunde',type:'number' },
    });

    data['viewer'] = {};
    data['viewer'][ this.userId ] = 0;
    data['drives'] = [ { routes:{}, stands:{} } ];
    data['invitestates'] = {};
		var id = Plans.insert( data );

		return id;
	},
	deleteHuntingPlan : function ( planid ) {
    var condition = {};
    condition['_id'] = planid;
    condition['viewer.'+this.userId ] = 0; // is owner ?
    // todo add message  and log ...
    Plans.remove(condition);
	},
  addHuntingPlanDrive: function( planid ) {
    var condition = {};
    condition['_id'] = planid;
    condition['viewer.'+this.userId ] = {'$lte':1}; // write permission ?
    var plan = Plans.findOne( condition );
    if( plan ) {
      plan.drives.push(  { routes:{}, stands:{} }  );
      Plans.update( { _id: plan._id }, plan );
      return (plan.drives.length-1);
    }
    return 0;
  },
  deleteHuntingPlanDrive : function ( planid , drive ) {
    var condition = {};
    condition['_id'] = planid;
    condition['viewer.'+this.userId ] = { '$lte' : 1 }; // write permission ?
    var plan = Plans.findOne( condition );
    if( plan ) {
      if( plan.drives.length > drive ) {
        plan.drives.splice( drive, 1 );
        Plans.update( { _id: plan._id }, plan );
      } else {
        throw new Meteor.Error(403, "driveindex_to_large");
      }
    }
  },
  updateHuntingPlanShape : function ( plan, drive , shape ) {
    var shape = Validate( shape, 'Shapemodel' );
    data = {};
    data['drives.'+drive+'.shape'] = shape;
    Plans.update( { _id: plan },{ $set : data } )
  },
  updateHuntingPlanStands : function ( planid, drive, stands ) {
    var stands = ValidateType( stands, 'map', 'Stände', null ,{
      type: 'object', name:'Stand', model: {
        user : {type:'string',name:'Jäger', optional: true },
        route: {type:'string',name:'Route', optional: true },
        index: {type:'number',name:'Sortierung', optional: true }
      }
    });
    item = {};
    item[ 'drives.'+drive+'.stands' ] = stands;
    Plans.update( {_id:planid}, {$set: item } );
  },
	addHuntingPlanRoute: function( planid, drive, route ) {
    var route = Validate( route, 'Routemodel' );
    var item = {};
    var routeid = Random.id();
    item[ 'drives.'+drive+'.routes.'+routeid ] = route;
    Plans.update( {_id:planid}, {$set: item } );
    return routeid;
	},
	deleteHuntingPlanRoute: function( planid, drive, id ) {
    item = {};
    var plan = Plans.findOne({_id:planid })
    if( plan && plan.drives[ drive ] ) {
      for( var sid in plan.drives[ drive ].stands ) {
        if( plan.drives[ drive ].stands[sid].route == id ) {
          plan.drives[ drive ].stands[sid].route = '';
        }
      }
      delete plan.drives[ drive ].routes[ id ];
      Plans.update( {_id:planid}, plan );
    }
	},
	updateHuntingPlanRoute: function( planid, drive, id, route ) {
    var route = Validate( route, 'Routemodel' );
    var item = {};
    item[ 'drives.'+drive+'.routes.'+id ] = route;
    Plans.update( {_id:planid}, {$set: item } );
	}
})
