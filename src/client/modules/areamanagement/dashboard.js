Template.dashboard.helpers({
  areas: function () {
    return Areas.find();
  }
})

Template.dashboard.events({
  'mouseenter .well' : function( e ) {
    $(e.currentTarget).addClass('selected');
  },
  'mouseleave .well' : function( e ) {
    $(e.currentTarget).removeClass('selected');
  },
  'dblclick .well' : function( e ) {
    $(e.currentTarget).attr('data');
    app.setPath( ['areamanagement', $(e.currentTarget).attr('data') ])
  }
})
