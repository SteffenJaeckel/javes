
/*
possible types
*/

sorting = {

	init: function( ) {
		Session.set('sorting',{});
	},
	clear: function() {
		Session.set('sorting',null);
	},
	add: function( key, name, type ) {
		var cur = Session.get('sorting');
		cur[key] = { name:name, type:type, mode: 1 };
		Session.set('sorting',cur);
	},
	togglemode: function( key ) {
		var cur = Session.get('sorting');
		cur[key].mode = (cur[key].mode==1)? -1:1;
		Session.set('sorting',cur);
	},
	remove: function( key ) {
		var cur = Session.get('sorting');
		delete cur[key];
		Session.set('sorting',cur);
	},
	db: function() {
		var cur = Session.get('sorting');
		var db = {};
		for( var key in cur ) {
			db[key] = cur[key].mode;
		}
		return db;
	},
	get: function () {
		var data = [];
		var cur = Session.get('sorting');
		for( var key in cur ) {
			var item = cur[key];
			item['key'] = key;
			data.push( item );
		}
		return data;
	}
}

Template.sortitem.sortmode = function() {
	return ( this.mode == 1) ? 'fa-amount-asc':'fa-amount-desc';
}

Template.sortitem.events = {
	'click .removesorting':function( e ) {
		sorting.remove( $(e.currentTarget).attr('data'))
	},
	'click .changesorting':function( e ) {
		sorting.togglemode( $(e.currentTarget).attr('data'))
	}
}
