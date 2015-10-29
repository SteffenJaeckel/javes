function getViewId() {
	var rd = Session.get("reportdata");
	if( rd )
		return rd._id;

	return Session.get("standdata")._id;
}

Template.comments.created = function () {
	Session.set('pageindex',0)
}
Template.comments.destroyed = function () {
	Session.set('pageindex',null)
}

Template.comments.pageselected = function( page ) {
	return Session.get('pageindex') == (page-1);
}

Template.comments.pagination = function() {
	var id = getViewId();
	var count = Math.min( 15, Math.ceil( Comments.find({obj:id}).count()/3 ));
	if( count <= 1)
		return null;

	var data = []
	for( var i=0;i < count;i++ )
		data.push( {text:(i+1)} )

	return  data;
}

Template.comments.entry = function() {
	var id = getViewId();
	return Comments.find({obj:id},{sort:{date:-1},limit:3,skip:Session.get('pageindex')*3})
}

Template.comments.editComment = function( id ) {
	return (id == Session.get('editcomment'))
}

Template.comments.formatDate = function( date ) {
	return formatDate( date )
}

Template.comments.formatTime = function( date ) {
	return formatTime( date )
}

Template.comments.formatImage = function( img ) {
	return Avatars[ img%Avatars.length ];
}

Template.comments.canEdit = function ( user ) {
	return (user == Meteor.user()._id);
}

Template.comments.events = {
	'keypress #add-comment':function( e ) {
		var text = $(e.currentTarget).val()
		if( e.keyCode == 13 && text.length > 1 ) {
			Meteor.call('addComment', getViewId(), Meteor.user().profile.currentSelectedArea, text, function( e ) {
				if(e) {
					console.log(e);
				}
			})
			$(e.currentTarget).val('')
		}
	},
	'click .page': function( e ) {
		Session.set('pageindex', ($(e.currentTarget).attr('data')-1));
	},
	'click .abort-edit-comment': function(e) {
		Session.set('editcomment', null )
	},
	'click .save-edit-comment': function(e) {
		Meteor.call('changeComment',Session.get('editcomment'),$("#edit-comment-text").val(), function( e ) {
			if(e) {
				console.log(e)
			}
			Session.set('editcomment', null )
		})
		//Session.set('editcomment', $(e.currentTarget).attr('data') )
	},
	'click .edit-comment': function(e) {
		Session.set('editcomment', $(e.currentTarget).attr('data') )
	},
	'click .delete-comment': function(e) {
		Meteor.call('deleteComment',$(e.currentTarget).attr('data') )
	}
}
