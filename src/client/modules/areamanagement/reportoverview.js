function updateStats( ctx ) {

	reporttype = 3;
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

	var _datasets = [];

	for( var i =0;i < items.length;i++ ) {
		_datasets.push({
			label: items[i],
			backgroundColor: barcolors[i] ,
			hoverBackgroundColor: barcolors[i] ,
			data: [ all[i],male[i],female[i],ak[0][i], ak[1][i], ak[2][i], ak[3][i], ak[4][i], ak[5][i] ]
		})
	}

	var myChart = new Chart(ctx, {
     type: 'bar',
     data: {
         labels: ["Gesamt", "M", "W", "AK0", "AK1", "AK2", "AK3", "AK4", "AK5"],
         datasets: _datasets
     },
     options: {
         scales: {
             yAxes: [{
                 ticks: {
                     beginAtZero:true,
										 stepSize:1
                 }
             }]
         },
				 onClick : function( e , x ) {
					 var p = $(e.currentTarget).offset();
					 for( var i in x ) {
						 if( x[i].inRange( e.x-p.left, e.y-p.top ) ) {
							 console.log( e , x[i]._model.datasetLabel );
						 }
					 }
					 console.log("click")
				 }
     }
 });
}
Template.reportoverview.helpers( {
	formatColor : function( color ) {
		return Colors[ color ];
	},
	period : function() {
		var period = getCurrentPeriod();
		return period.start.getFullYear()+"/"+period.end.getFullYear();
	},
	area : function() {
		return getCurrentArea();
	},
	reports : function() {
		var period = getCurrentPeriod();
		return Reports.find({ type:3/*, date :{ $gte: period.start, $lte: period.end }*/},{sort:sorting.db()});
	},
	sortitems : function() {
		return sorting.get();
	}
});

Template.reportoverview.created = function() {
	sorting.init();
	var x =0;
	sorting.add('date','Datum');
}

Template.reportoverview.destroyed = function() {
	sorting.clear();
}


Template.reportoverview.rendered = function() {

 var ctx = $("#chart");
 updateStats(ctx);

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
