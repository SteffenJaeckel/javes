/**/
Template.newplan.created = function() {
  Session.set('error',null);

}

Template.newplan.rendered = function() {
	$('.datetime').datetimepicker({
			locale: 'de',
			format:"dddd, D. M. YYYY",
			viewMode: 'days',
			icons: {
					time: "fa fa-clock-o",
					date: "fa fa-calendar",
					previous: "fa fa-arrow-left",
					next: "fa fa-arrow-right"
			}
	});
	
	$('.typeahead')

	$('#name').focus();
}

function clearError() {
	Session.set('error',null)
	$('.has-error').removeClass('has-error');
}

function applyError( e ) {
	Session.set('error',e.reason.text);
	$('#'+e.reason.id).parent().addClass('has-error');
	$('#'+e.reason.id).focus();
}

Template.newplan.events({
  'keyup .text' : function ( e ) {
    modals.set( $(e.currentTarget).attr('data'), $(e.currentTarget).val() )
  },
  'click #save': function( e ) {
    clearError();
    var btn = $(e.currentTarget);
    btn.button('loading');
    Meteor.call('newHuntingPlan', modals.get(), function ( e ) {
      if( e ) {
        applyError( e );
      } else {
        modals.pop();
      }
      setTimeout( function() {
        btn.button('reset');
      }, 1000 )
    })
  },
  'click #abort': function() {
    modals.pop();
  },
  'click .close': function() {
    modals.pop();
  }
})

Template.newplan.helpers({
  data: function() {
    return modals.get();
  },
  templates: function() {
    var data=[];
    data.push( { id:'new', name:'Keine Vorlage verwenden', date:new Date(), selected:"selected" } );
    Plans.find({}).forEach( function ( plan ) {
      data.push( {id:plan._id, name:plan.name, date:plan.date } );
    });
    return data;
  },
  error: function () {
    return Session.get('error')
  }
})
