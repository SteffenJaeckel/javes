var plan_cache = [];

function getType( user ) {
  return user.customers[app.getCustomer()].departments[ app.getDepartment() ].type;
}

function loadUser() {

  var groups = {};
  var group = '';
  var selector = {};
  var filter = [];

  var customer = app.getCustomer();
  var department = app.getDepartment();

  if( Session.get('user-filter') ) {
    filter.push( {'profile.surname':{  $regex: '^'+Session.get('user-filter'), $options: 'i' }});
  }
  if( Session.get('group-filter') ) {
    var q = {}
    var groupfilter = new RegExp('^'+Session.get('group-filter'), 'i');
    q['customers.'+app.getCustomer()+'.departments.'+app.getDepartment()+'.groups'] =  { $regex: '^'+Session.get('group-filter'), $options: 'i' };
    filter.push( q );
  }
  if( Session.get('type-filter') > 0 ) {
    var tflt = {};
    tflt["customers."+app.getCustomer()+".departments."+app.getDepartment()+".type"] = (Session.get('type-filter')-1);
    filter.push(tflt);
  }
  if( Session.get('dog-filter') != 0 ) {
    switch( Session.get('dog-filter') ) {
      case 1:
        filter.push( {'profile.dogs.type': { $lt:3}} );        
      break;
      case 2:
        filter.push( {'profile.dogs.type':3} );
      break;
      case 3:
        filter.push( {'profile.dogs.type': {$exists:true} } );
      break;
      case 4:
        filter.push( {'profile.dogs' : {$size:0}});
      break;
    }
  }

  switch( filter.length ) {
    case 0:
      selector = {};
      break;
    case 1:
      selector = filter[0];
      break;
    default:
      selector['$and'] = filter;
      break;
  }

  Meteor.users.find( selector , { sort : { 'profile.surname':1 } , limit: 200 }).forEach( function( user ) {
    var cur = {
      id: user._id,
      firstname:user.profile.firstname,
      surname: user.profile.surname,
      title:user.profile.title,
      isdoctor: (user.profile.isdoctor || user.profile.isveterinary),
      type:'huntertype-'+(getType(user)+1),
      dogs: (user.profile.dogs) ? user.profile.dogs:[]
    };
    var groupprofile = user.customers[ customer ].departments[ department ].groups;
    if( groupprofile == null || groupprofile.length == 0 ) {
      var gr = ' Ohne Gruppe';
      if( groups[ gr ] == null ) {
        groups[ gr ] = { id:gr, name:gr, user:[] };
      }
      groups[ gr ].user.push(cur);
    } else {
      for( var x=0;x < groupprofile.length;x++ ) {
        var gr = groupprofile[x];
        if( groupfilter && gr.match( groupfilter ) == null )
          continue;

        if( groups[ gr ] == null ) {
          groups[ gr ] = { id:gr, name:gr, user:[] };
        }
        groups[ gr ].user.push(cur);
      }
    }
  });
  return _.sortBy(_.values(groups),'name');
}

function updatePlanCache() {

  var o = 0;
  var w = 60;
  plan_cache = [];
  Plans.find({}).forEach( function ( plan ) {
    plan_cache.push( { id: plan._id, offset: o, width: w } );
    o+=w;
  });
  Session.set("plans", plan_cache );
  console.log("plancache updated", Session.get("plans"))

  var cursor = Plans.find({});
  cursor.observeChanges({
    added:function( id, fields ) {
      //updatePlanCache();
    },
    removed:function( id ) {
      //updatePlanCache();
    },
    changed:function( id, fields ) {
      /// update single plan

    }
  });
}

Template.participants.created = function() {
	this.participants = Meteor.subscribe("participants");
	this.plans = Meteor.subscribe("huntingplans");

  Session.setDefault('group_filter','');
  Session.setDefault('hunter_filter','');
  Session.setDefault('dog-filter',0);
  Session.setDefault('type-filter',0);
  Session.setDefault('selected-tool',0);

  updatePlanCache();
}

Template.participants.rendered = function() {
  $('#workplane').off('scroll').scroll( function( ) {
    var p = $('#workplane div.scroll-area').position();
    $('#user div.scroll-y').css('top', p.top );
    $('#plans div.scroll-x').css('left', p.left );
  })
  console.log("plan count ", Plans.find({}).count() )
  updatePlanCache();
}

Template.participants.destroyed = function() {
  plan_cache = [];
  Session.set("plans",null);
	this.participants.stop();
	this.plans.stop();
}

Template.participants.helpers({

  tooltip : function( ) {
    return Session.get('tooltip');
  },
  istoolselected : function( e ) {
    if( Session.get('selected-tool') == e )
      return 'selected'

    return ''
  },
  selectedtypefilter: function (e) {
    if(Session.get('type-filter') > 0 ) {
      return Huntertypes[ Session.get('type-filter')-1 ];
    }
    return 'Kein Filter';
  },
  hunterfiltertypes:function () {
    var data = ['Kein Filter'];
  	return data.concat(Huntertypes);
  },
  selecteddogfilter: function (e) {
    return Dogfiltertypes[ Session.get('dog-filter') ];
  },
  dogfiltertypes:function () {
  	return Dogfiltertypes;
  },
  groupfilter:function () {
  	return Session.get('group-filter');
  },
  userfilter:function () {
  	return Session.get('user-filter');
  },
  modal:function () {
  	return Session.get('modal')
  },
  plans : function() {
    return Session.get('plans');
  },
  planheader: function ( id ) {
    var width = 60;
    var plans = [];
    var offset = 0;
    console.log("update header ",id);

/*
    var plan = Plans.findOne( {_id: id } )

    plan {
      var cur = {
        _id:plan._id,
        name:plan.name,
        leader:'Andreas Lehn',
        backup:'Andreas Lehn',
        date: plan.date,
        offset:offset,
        width:width
      };
      offset += width;
      plans.push(cur);
    })*/
    return plans;
  },
  planstats: function () {
    var width = 60;
    var plans = [];
    var offset = 0;
    Plans.find().forEach( function (plan) {
      var userinvited = 0;
      var dogsinvited = 0;
      for( var uid in plan.invitestates ) {
        if( plan.invitestates[uid].state != 'refused' ) {
          userinvited++;
          if( Meteor.users.findOne({_id:uid,"profile.dogs.type": {$lt:3} })) {
            dogsinvited++;
          }
        }
      }
      var cur = {
        _id:plan._id,
				name:plan.name,
				leader: plan.leader,
				date: plan.date,
        offset:offset,
        width:width,
        userstates: { invited:plan.hunters,confirmed:userinvited},
        dogstates: {invited:plan.dogs,confirmed:dogsinvited}
      };
      offset += width;
      plans.push(cur);
    })
    return plans;
  },
  plansstates:function ( group ) {

    // var group = loadUser();
    var width = 60;
    var plans = [];
    var offset = 0;

    Plans.find().forEach( function (plan) {
      var cur = {
        _id:plan._id,
        offset:offset,
        width:width,
        invitestates:[]
      };
      for( var g=0;g< group.length;g++ ) {
        cur.invitestates.push( { id:group[g].id, state:'uninvited', class:'group',plan: plan._id })
        for( var u=0;u< group[g].user.length;u++ ) {
          var state = { id:group[g].user[u].id, class:'item', type: group[g].user[u].type ,plan: plan._id };
          if( plan.invitestates[ group[g].user[u].id ] ) {
            state[ plan.invitestates[ group[g].user[u].id ].state ] = true;
            /*if( state.selected || state.invited || state.confirmed ) {
              cur.userstates.invited++;
              for( var d=0;d < group[g].user[u].dogs.length;d++) {
                if( group[g].user[u].dogs[d].type == 0 ) {
                  cur.dogstates.invited++;
                  break;
                }
              }
            }
            if( state.confirmed ) {
              cur.userstates.confirmed++;
              for( var d=0;d < group[g].user[u].dogs.length;d++) {
                if( group[g].user[u].dogs[d].type == 0 ) {
                  cur.dogstates.confirmed++;
                  break;
                }
              }
            }*/
          } else {
            state['uninvited'] = true;
          }
          cur.invitestates.push(  state )
        }
      }
      offset += width;
      plans.push( cur );
    })
    return plans;
  },
  group:function () {
  	return loadUser();
  }
});

/**/
Template.participants.events({
  'mousemove .feedback' :function (e ) {
    if( !$(e.currentTarget).hasClass('group-label') && !$(e.currentTarget).hasClass('grid-group') ) {
      var userid = $(e.currentTarget).attr('data-user');
      var planid = $(e.currentTarget).attr('data-plan');
      var tt = { user: userid, plan: planid };
      if( e.clientX > $(window).width()/2 ) {
        tt['right'] = $(window).width() - (e.clientX-20);
      } else {
        tt['left'] = e.clientX+20;
      }
      if( e.clientY > $(window).height()/2 ) {
        tt['bottom'] = $(window).height() - (e.clientY-20);
      } else {
        tt['top'] = e.clientY+20;
      }
      Session.set( 'tooltip', tt );
    }
  },
  'mouseenter .feedback': function( e ) {
    $('[data-user="'+$(e.currentTarget).attr('data-user')+'"]').addClass('hover');
    $('[data-plan="'+$(e.currentTarget).attr('data-plan')+'"]').addClass('hover');
  },
  'mouseleave .feedback':function( e ) {
    Session.set('tooltip',null);
    $('.hover').removeClass('hover');
  },
	'mouseenter .grid-item, mousedown .grid-item':function ( e ) {
    if( e.buttons >= 1 && e.button == 0 ) {
      // console.log(e)
      var plan = Plans.findOne( { _id: $(e.currentTarget).attr('data-plan') } );
      if( plan ) {
        var tool = Session.get('selected-tool');
        if( tool < 4 )  {
          var STATES = ['request','invite','confirmed','refused'];
          var newstate = {};
          newstate[ 'invitestates.'+$(e.currentTarget).attr('data-user') ] = { by:Meteor.userId(),date:new Date(),state:STATES[ tool ] , changed:'' };
          Plans.update( { _id: $(e.currentTarget).attr('data-plan') } , { $set : newstate });
        } else {
          var newstate = {};
          newstate[ 'invitestates.'+$(e.currentTarget).attr('data-user') ] = "";
          Plans.update( { _id: $(e.currentTarget).attr('data-plan') } , { $unset : newstate });
        }
      }
    }
	},
  'keyup #user-filter': function( e ) {
    if( $(e.currentTarget).val() == '' ) {
      Session.set('user-filter',null);
    } else {
      Session.set('user-filter',$(e.currentTarget).val() );
    }
  },
  'keyup #group-filter': function( e ) {
    if( $(e.currentTarget).val() == '' ) {
      Session.set('group-filter',null);
    } else {
      Session.set('group-filter',$(e.currentTarget).val() );
    }
  },
  'click .dogfilter-switch': function (e ) {
    Session.set( 'dog-filter', _.indexOf( Dogfiltertypes, $(e.currentTarget).text()) );
  },
  'click .typefilter-switch': function (e ) {
    Session.set( 'type-filter', _.indexOf( Huntertypes, $(e.currentTarget).text())+1 );
  },
  'dblclick .group-item': function( e ) {
    var user = Meteor.users.findOne( {_id:$(e.currentTarget).attr('data-user') });
    var data = user.profile;
    data['_id'] = user._id;
    data['email'] = (user.emails && user.emails[0]) ? user.emails[0].address:'';
    modals.push('edithunter', data );
  },
  'dblclick .plan': function (e ) {
    app.setModulePath( ['huntingplans', $(e.currentTarget).attr('data-plan') ] )
  },
  'click .select-tool':function(e) {
    Session.set('selected-tool', $(e.currentTarget).attr('data') )
  },
  'click .clear-filter': function( e ) {
    Session.set($(e.currentTarget).attr('data'),null);
  },
  'click #add-hunter' : function ( e ) {
    modals.push('adduser',{title:"Neuen Teilnehmer hinzufügen" });
    //modals.push('newhunter', { type:3, managed:true, firstname:'', surname:'', gender:0, title:'',group:[], email:'',phone1:'',phone2:'',isveterinary:false, isdoctor:false, dogs:[] } );
  },
  'click #send-requests' : function ( e ) {
    modals.push('sendrequests', { subject:'', body:'', signature:'', date: new Date( new Date().getTime() + (14*24*60*60*60*1000) )} );
  },
  'click #send-invitations' : function ( e ) {
    modals.push('sendinvites', { subject:'', body:'', signature:'', date: new Date( new Date().getTime() + (14*24*60*60*60*1000) )} );
  }
})

function hasTrackingDog( user ) {
  for( var i=0;i < user.profile.dogs.length;i++ ) {
    if( user.profile.dogs[i].type == 3 )
    return true;
  }
  return false;
}

function hasScentHound( user ) {
  for( var i=0;i < user.profile.dogs.length;i++ ) {
    if( user.profile.dogs[i].type != 3 )
    return true;
  }
  return false;
}

Template.basetip.helpers({
  data: function() {
    return Session.get('tooltip');
  },
  invitestate: function() {
    var tip = Session.get('tooltip');
    if( tip.plan != null ) {
      var plan = Plans.findOne( {_id:tip.plan });
      if( plan.invitestates && plan.invitestates[tip.user] ) {
        var obj = plan.invitestates[tip.user];
        obj[ obj.state ] = true;
        obj.user = Meteor.users.findOne(obj.by);
        return obj;
      } else {
        return {uninvited:true};
      }
    }
    return null;
  },
  user: function () {
    var tip = Session.get('tooltip');
    if( tip.user ) {
      return Meteor.users.findOne( {_id:tip.user });
    }
  },
  plan: function() {
    var tip  = Session.get('tooltip');
    if( tip.plan ) {
      var plan = Plans.findOne( {_id:tip.plan });
      if( plan ) {

        console.log("build plan tip ", plan )

        var userstates = { hunter:[], dogs: [[],[],[],[]] };

        for( var t=0;t < Huntertypes.length;t++ ) {
          userstates.hunter.push( { class:'huntertype-'+(t+1),invited:0,refused:0,confirmed:0} );
          userstates.dogs[0].push( { class:'huntertype-'+(t+1),invited:0,refused:0,confirmed:0} );
          userstates.dogs[1].push( { class:'huntertype-'+(t+1),invited:0,refused:0,confirmed:0} );
          userstates.dogs[2].push( { class:'huntertype-'+(t+1),invited:0,refused:0,confirmed:0} );
          userstates.dogs[3].push( { class:'huntertype-'+(t+1),invited:0,refused:0,confirmed:0} );
        }
        userstates.hunter.push( { class:'sum', invited:0,refused:0,confirmed:0} );
        userstates.dogs[0].push( { class:'sum', invited:0,refused:0,confirmed:0} );
        userstates.dogs[1].push( { class:'sum', invited:0,refused:0,confirmed:0} );
        userstates.dogs[2].push( { class:'sum', invited:0,refused:0,confirmed:0} );
        userstates.dogs[3].push( { class:'sum', invited:0,refused:0,confirmed:0} );

        var sum = userstates.hunter.length-1;

        Meteor.users.find( {_id:{ $in: _.keys(plan.invitestates ) }} ).forEach( function ( user ) {
          var type = getType(user);
          switch( plan.invitestates[ user._id ].state ) {
            case 'confirmed':
              userstates.hunter[ type ].confirmed++;
              userstates.hunter[ sum ].confirmed++;
              for( var d = 0;d < user.profile.dogs.length;d++ ) {
                userstates.dogs[ user.profile.dogs[d].type ][type].confirmed++;
                userstates.dogs[ user.profile.dogs[d].type ][sum].confirmed++;
              }
            break;
            case 'refused':
              userstates.hunter[ type ].refused++;
              userstates.hunter[ sum ].refused++;
              for( var d = 0;d < user.profile.dogs.length;d++ ) {
                userstates.dogs[ user.profile.dogs[d].type ][type].refused++;
                userstates.dogs[ user.profile.dogs[d].type ][sum].refused++;
              }
            break;
            default:
              userstates.hunter[ type ].invited++;
              userstates.hunter[ sum ].invited++;
              for( var d = 0;d < user.profile.dogs.length;d++ ) {
                userstates.dogs[ user.profile.dogs[d].type ][type].invited++;
                userstates.dogs[ user.profile.dogs[d].type ][sum].invited++;
              }              
            break;
          }
        })
        plan.invites = userstates;
        return plan;
      }
    }
  }
})
