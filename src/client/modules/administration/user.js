
Template.user.helpers({
  employies : function() {
    var filter = [];
    var userfilter = Session.get("filter-username");
    if( userfilter && userfilter.length > 0 ) {
      filter.push( {'profile.surname':{  $regex: userfilter, $options: 'i' }});
    }
    var emailfilter = Session.get("filter-email");
    if( emailfilter && emailfilter.length > 0 ) {
      filter.push( {'emails.address':{  $regex: emailfilter, $options: 'i' }});
    }
    var rolefilter = Session.get("filter-roles")
    if( rolefilter && rolefilter.length > 0 ) {
      var q = {}
      q['customers.'+app.getCustomer()+'.departments.'+app.getDepartment()+'.roles'] =  { $regex: '^'+rolefilter, $options: 'i' };
      filter.push( q );
    }
    var groupsfilter = Session.get("filter-groups");
    if( groupsfilter && groupsfilter.length > 0 ) {
      var q = {}
      q['customers.'+app.getCustomer()+'.departments.'+app.getDepartment()+'.groups'] =  { $regex: '^'+groupsfilter, $options: 'i' };
      filter.push( q );
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
    return Meteor.users.find( selector , {limit:20});
  },
	typeof: function ( user ) {
    var type = user.customers[app.getCustomer()].departments[app.getDepartment()].type;
    if( type )
      return type+1;      
		return 0;
	},
  rolesof : function ( user ) {
    var roles = user.customers[app.getCustomer()].departments[app.getDepartment()].roles;
    if( roles )
      return _.values( roles );
		return [];
  },
  groupsof : function( user ) {
    var groups = user.customers[app.getCustomer()].departments[app.getDepartment()].groups;
    if( groups )
      return _.values( groups );
    return [];
  }
})

Template.user.events({
	'click #add-user': function() {
		modals.push('adduser',{title:"Neuen Benutzer anlegen"});
	},
  'dblclick tr': function( e ) {
    var user = Meteor.users.findOne( {_id:$(e.currentTarget).attr("data") });
    var data = user.profile;
    data['_id'] = user._id;
    data['email'] = (user.emails && user.emails[0]) ? user.emails[0].address:'';
    modals.push('edithunter', data );
  },
  'keyup #filter-user' : function() {
    Session.set("filter-username", $('#filter-user').val() )
  },
  'keyup #filter-email' : function() {
    Session.set("filter-email", $('#filter-email').val() )
  },
  'keyup #filter-created' : function() {
    Session.set("filter-created", $('#filter-created').val() )
  },
  'keyup #filter-roles' : function() {
    Session.set("filter-roles", $('#filter-roles').val() )
  },
  'keyup #filter-groups' : function() {
    Session.set("filter-groups", $('#filter-groups').val() )
  }
})

Template.user.created = function() {
	this.employies = Meteor.subscribe("employies");
}

Template.user.destroyed = function() {
	this.employies.stop();
}
