Customer = new Meteor.Collection('customer');
Customer.allow({
	insert:function(userId) {
		return false;
	},
	update:function(userId,fields,modifier) {
		return false;
	},
	remove:function(userId) {
		return false;
	}
});

Departments = new Meteor.Collection('departments');
Departments.allow({
	insert:function(userId) {
		return false;
	},
	update:function(userId,fields,modifier) {
		return false;
	},
	remove:function(userId) {
		return false;
	}
});

Areas = new Meteor.Collection('areas');
Areas.allow({
	insert:function(userId,area) {
		return false;
	},
	update:function(userId,area,fields,modifier) {
		if( area.viewer[ userId ] == 0 ||  area.viewer[ userId ] == 1) {
			return true;
		}
		return false;
	},
	remove:function(userId,area) {
		return true;
	}
});


Plans = new Meteor.Collection('plans');
Plans.allow({
	insert:function(userId,area) {
		return false;
	},
	update:function(userId,area,fields,modifier) {
		return false;
	},
	remove:function(userId,area) {
		return false;
	}
});

Stands = new Meteor.Collection('stands')
Stands.allow( {
	insert: function( userId, stand ) {
		return false;
	},
	update: function(userId,area,fields,modifier) {
		return false;
	},
	remove:function(userId,area) {
		return false;
	}
})

Reports = new Meteor.Collection('reports')
Reports.allow( {
	insert: function( userId, report ) {
		return false;
	},
	update: function(userId,area,fields,modifier) {
		return false;
	},
	remove:function(userId,area) {
		return false;
	}
})


Comments = new Meteor.Collection('comments')
Comments.allow( {
	insert: function( userId, stand ) {
		return true;
	},
	update: function(userId,area,fields,modifier) {
		return true;
	},
	remove:function(userId,area) {
		return true;
	}
})

Notifications = new Meteor.Collection('notifications')
Notifications.allow({
	insert: function( userId, doc ) {
		return false;
	},
	update: function(userId,doc,fields,modifier) {
		if( doc.user == userId && fields[0] == 'unread' ) {
			return true;
		}
		return false;
	},
	remove:function(userId,doc) {
		if(doc.user == userId ){
			return true;
		}
		return false;
	}
})

News = new Meteor.Collection('news')
News.allow({
	insert: function( userId, doc ) {
		return false;
	},
	update: function(userId,doc,fields,modifier) {
		return false;
	},
	remove:function(userId,doc) {
		return false;
	}
})

Allocations = new Meteor.Collection('allocations');
Allocations.allow({
	insert: function( userId, doc ) {
		return false;
	},
	update: function(userId,doc,fields,modifier) {
		return false;
	},
	remove:function(userId,doc) {
		return false;
	}
})

Invitetoken = new Meteor.Collection('invitetoken');
Invitetoken.allow({
	insert: function( userId, doc ) {
		return false;
	},
	update: function(userId,doc,fields,modifier) {
		return false;
	},
	remove:function(userId,doc) {
		return false;
	}
})
