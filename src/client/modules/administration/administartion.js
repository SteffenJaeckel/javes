/*
	Um das Administrationsmodul nutzen zu können benötigen Sie admin rechte,
	zur Zeit können diese aus sicherheits gründen nur über die Datenbank selbst
	vergeben werden.

	[user].isServerAdmin : true

*/
console.log("Add Administration to modules");

if( window.mods == null ) {
	window.mods = {};
}
window.mods['administration'] = { index:1, name: "Administration", icon:"fa-group", enabled:true,
	defaultitem: function() {
		return 'customer';
	},
	menuitems: function( path ) {
		if( path.length == 0 ) {
			return [
				{name:'Kundenübersicht',id:'customer',icon:'fa-user'},
			];
		}
	},
	selected: function( item ) {
		console.log( item )
		switch( item.attr('id')  ) {
			case 'add-new-customer':
				modals.push('newcustomer', { name:''});
			break;
			default:
				console.log( item.attr('id') + " not catched ");
		}
	}
};


Template.administration.created = function() {
	this.customer = Meteor.subscribe("customer");
	this.employies = Meteor.subscribe("employies");
}

Template.administration.destroyed = function() {
	this.customer.stop();
	this.employies.stop();
}

Template.administration.helpers({
	customer: function () {
		return Customer.find({});
	},
	employies : function() {
		return Meteor.users.find();
	},
	role : function ( id ) {
		return "Admin";
	},
	groups : function( id ) {
		return ["Heidegarten","Hangelsberg"];
	}
})

Template.administration.events({
	'click #add-customer': function () {
		Meteor.call('newCustomer', {name:'LBF',enabled:true, mapconfig: mapconfig }, function(e) {
				console.log(e);
		})
	}
})
