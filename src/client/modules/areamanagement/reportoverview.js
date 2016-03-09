function addStats( reporttype, element ) {

	var period = getCurrentPeriod();

	var items = [];
	var all = [];
	var male = [];
	var female = [];
	var ak = [[],[],[],[],[],[]];
	var barcolors = [];

	Reports.find({ type:reporttype, date :{ $gte: period.start, $lte: period.end }},{sort:{gametype:1}}).forEach( function ( report ) {
		var id = _.indexOf( items, Gametypes[ report.gametype ])
		if( id == -1 ) {
			id = items.length;
			items.push( Gametypes[ report.gametype ] );
			all.push(0);
			male.push(0);
			female.push(0);
			for( var a=0;a < ak.length;a++ ) {
				ak[a].push(0);
			}
			barcolors.push( Colors[report.gametype]);
		}
		all[id]++;
		if( report.gender == 0 ) {
			male[id]++;
		} else {
			female[id]++;
		}
		var ac = parseInt(report.ageclass)
		if( 0 <= ac && ac < 6 )
			ak[ac][id]++;
	})
	/*var data = google.visualization.arrayToDataTable([
		['Gruppe'].concat(items),
		['Gesamt'].concat(all),
		['Männlich'].concat(male),
		['Weiblich'].concat(female),
		['AK 0'].concat(ak[0]),
		['AK 1'].concat(ak[1]),
		['AK 2'].concat(ak[2]),
		['AK 3'].concat(ak[3]),
		['AK 4'].concat(ak[4]),
		['AK 5'].concat(ak[5])
	]);

	var options = {
		title: '',
		colors: barcolors,
		dataOpacity:0.8,
		animation: {duration:2000,easing: 'out'},
		hAxis: {title: 'Gruppe', titleTextStyle: {color: 'black'}}
	};

	var chart = new google.visualization.ColumnChart(document.getElementById(element));
	chart.draw(data, options);*/
}

Template.reportoverview.formatColor = function( color ) {
	return Colors[ color ];
}

Template.reportoverview.period = function() {
	var period = getCurrentPeriod();
	return period.start.getFullYear()+"/"+period.end.getFullYear();
}
Template.reportoverview.area = function() {
	return Areas.findOne({_id:Meteor.user().profile.currentSelectedArea });
}
Template.reportoverview.reports = function() {
	var period = getCurrentPeriod();
	return Reports.find({ type:3/*, date :{ $gte: period.start, $lte: period.end }*/},{sort:sorting.db()});
}
Template.reportoverview.sortitems = function() {
	return sorting.get();
}

Template.reportoverview.created = function() {
	sorting.init();
	var x =0;
	sorting.add('date','Datum');
}

Template.reportoverview.destroyed = function() {
	sorting.clear();
}


Template.reportoverview.events({
	'click .close':function (e) {
		modals.pop();
	},
	'click .areachoise': function( e ){

	},
	'click .orderby':function(e) {
		var e = $(e.currentTarget);
		sorting.add( e.attr('data'), e.text(), 1 );
	},
	'dblclick .goto':function (e) {
			AreaManagement_SelectReport($(e.currentTarget).attr('data'), true, 17 );
			modals.pop();
	},
	'click #save-execel': function(e) {
		//$('#dataset')
		SaveTableAsExcel('dataset','Berichte.xlsx');
		//alert('save excel');
	}
})
Template.reportoverview.rendered = function() {
	//addStats(3,'kill_stats')
}
