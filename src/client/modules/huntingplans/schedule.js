var ONEDAY = 24*60*60*1000;
var MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];

Template.schedule.created = function (){
  var current = new Date();
  var year = current.getFullYear();
  if( current.getMonth() < 4 ) {
    year--;
  }
  Session.set('currentscheduleyear', year );
  Session.set('currentschedulemonth', current.getMonth() );
}

Template.schedule.helpers( {
  months : function () {
    var months = [];
    for( var m=0;m < 12;m++) {
      var id = ((m+3)%12);
      months.push( { index: id, name: MONTHS[id], class: (id == Session.get('currentschedulemonth'))? 'selected':'' } );
    }
    return months;
  },
  years : function () {
    var years = [];
    var now = new Date();
    for( var y=-3;y < 2;y++) {
      var id = ((y+now.getFullYear()));
      years.push( { index: id, name: id+"/"+((id+1) - 2000), class: (id == Session.get('currentscheduleyear'))? 'selected':'' } );
    }
    return years;
  },
  selectedmonth : function() {
    var month = Session.get('currentschedulemonth');
    return MONTHS[ month ];
  },
  selectedyear : function() {
    var year = parseInt( Session.get('currentscheduleyear'));
    return year+"/"+((year+1)-2000);
  },
  dates : function () {

    var month = Session.get('currentschedulemonth');
    var year = Session.get('currentscheduleyear');
    if( month < 3 ) {
      year++;
    }
    var start = new Date( year, month, 1 );
    var wd  = ((start.getDay()-1)+7)%7;
    var data = [];
    var today = new Date();

    if( wd >= 0  ) {
      start = new Date( start.getTime() - wd*ONEDAY)
    }
    Plans.find()
    for( var i =0;i<6;i++ ) {
      var row = [];
      for( var d=0;d < 7;d++ ) {

        var cl = '';
        if( (month != start.getMonth()) ) {
          cl += "disabled ";
        }
        if( start.getDate() == today.getDate() && start.getMonth() == today.getMonth() && start.getYear() == today.getYear() ) {
          cl += "selected "
        }

        obj = {
          day: start.getDate(),
          month: (start.getMonth()+1),
          year: start.getFullYear(),
          time: start.getTime(),
          addbutton: (start.getTime() > today.getTime() && month == start.getMonth()),
          class: cl,
          plans: []
        };

        end = new Date( start.getTime() + ONEDAY );
        Plans.find({ $and : [ {date: {$gte: start }}, {date : {$lt : end }}] } ).forEach( function(plan ) {
          obj.plans.push( { id: plan._id, name: plan.name } )
        });

        row.push( obj );
        start = end;
      }
      data.push( { days: row } );
      if( start.getMonth() != month )
        break;
    }
    return data;
  }
})

Template.schedule.events( {
  'click .selectmonth': function( e ) {
    var month = $(e.currentTarget).attr('data');
    Session.set('currentschedulemonth',month)
  },
  'click .selectyear': function( e ) {
    var year = $(e.currentTarget).attr('data');
    Session.set('currentscheduleyear',year)
  },
  'dblclick .calitem': function (e ) {
    var item = $(e.currentTarget);
    if( item.hasClass('disabled') ) {
      Session.set('currentschedulemonth', item.attr('data')-1)
    }
  },
  'dblclick .plan': function (e ) {
    app.setModulePath( ['huntingplans', $(e.currentTarget).attr('data') ] )
  },
  'click .newplan': function(e) {
    var date = new Date( parseInt($(e.currentTarget).attr('data')));
    console.log( date )
    modals.push('newplan',{date: date, name:''});
  }
})
