// überprüft die gültigkeit eines datums
parseDate = function( datestr, timestr, date ) {
	var dateparts = datestr.split('.');
	if( dateparts.length != 3 ) {
		throw 'invalid_date_format';
	}
	var timeparts = timestr.split(':');
	if( ! (timeparts.length == 2 || timeparts.length == 3) ) {
		throw 'invalid_time_format';
	}

	var d = parseInt(dateparts[0]);

	var m = parseInt(dateparts[1])-1;
	var y = parseInt(dateparts[2]);

	var h = parseInt(timeparts[0]);
	var mi = parseInt(timeparts[1]);
	var s = 0;

	if( h < 0 || h > 23 ) {
		throw 'invalid_hour';
	}
	if(mi < 0 || mi > 59 ) {
		throw 'invalid_minute';
	}
	if(timeparts.length == 3 ) {
		s = parseInt(timeparts[2]);
		if(s < 0 || s > 59 ) {
			throw 'invalid_second';
		}
	}

	if( isNaN( d ) || isNaN( m )  || isNaN( y )  || isNaN( h )  || isNaN( mi )  || isNaN( s )  ) {
		throw 'invalid_value';
	}

	if( y < 99 ) {
		y+= 2000;
	}

	if( y < 2000 || y > 3000 ) {
		throw 'invalid_year';
	}
	if( m < 0 || m > 11 ) {
		throw 'invalid_month';
	}
	var ende = 31;

	if( m==1 ) {
		ende=28;
		if( ((y % 4) == 0) && (((y % 100) != 0) || ((y%400) == 0)) ) {
			ende = 29;
		}
	} else {
		var map = [31,0,31,30,31,30,31,31,30,31,30,31];
		ende = map[ m ];
	}

	if( d <= 0 || d > ende) {
		throw 'invalid_day';
	}
	date.setDate( d );
	date.setMonth( m );
	date.setYear( y );
	date.setHours(h);
	date.setMinutes(mi);
	date.setSeconds( s )
	return date;
}
//
formatDate = function( date ) {
	if( date == null )
		return "01.01.1970";

	var d = date.getDate();
	if( d < 10 ) {d='0'+d;}
	var m = date.getMonth()+1;
	if(m < 10) {m='0'+m;}
	var y = date.getFullYear();
	return d+'.'+m+'.'+y;
}
// überprüft die gültigkeit einer tageszeit
parseTime = function( str, date ) {
	var parts = str.split(':');
	if( parts.length == 2 ) {
		var h = parseInt(parts[0]);
		var m = parseInt(parts[1]);

		if( h < 0 || h > 23 ) {
			throw 'invalid_hours';
		}
		if( m <= 0 || m > 59 ) {
			throw 'invalid_minutes';
		}
		date.setHours( h );
		date.setMinutes( m );
		return date;
	}
	throw 'invalid_format';
}
//
formatTime = function( date ) {
	var h = date.getHours();
	if( h < 10 ) {h='0'+h;}
	var m = date.getMinutes();
	if(m < 10) {m='0'+m;}
	var y = date.getFullYear();
	return h+':'+m;
}
// setzt die felder eines sessions objekts
setObj = function( name , key, value  ) {
	var temp =  Session.get( name );
	if( temp == null ) {
		temp = {};
	}
	temp[key] = value;
	Session.set( name , temp );
}

// liefert die google boundingbox eines pfades der aus objekten der form {lat:x,lng:y} besteht
getPathBounds = function( coords ) {

	var bounds = new google.maps.LatLngBounds();
	if( coords != null ) {
		for( var i=0;i < coords.length;i++ ) {
			bounds.extend( new google.maps.LatLng( coords[i].lat,coords[i].lng) );
		}
	}
	return bounds;
}
// wandelt einen array von objekten der form  {lat:x,lng:y} in einen google MVC objekt mit google coordinaten um
m2gCoords = function( m ) {
	if( m.length != null ) {
		var na = [];
		for( var c=0;c < m.length;c++ ) {
			na.push(  new google.maps.LatLng( m[c].lat , m[c].lng )  );
		}
		return na;
	} else {
		return new google.maps.LatLng( m.lat , m.lng )
	}
}
// wandelt eine google MVC objekt mit google coordinaten in einen array von objekten der form {lat:x,lng:y} um
g2mCoords = function( g ) {
	var na = [];
	for( var c=0;c < g.getLength();c++ ) {
		var p = g.getAt(c);
		na.push(  { lat:p.lat(),lng:p.lng() }  );
	}
	return na;
}
// liefert ein object das den abstand und die projezierte position eines punktes zu einer linie enthält
pointToLineDistance = function(x, y, x1, y1, x2, y2) {

  var A = x - x1;
  var B = y - y1;
  var C = x2 - x1;
  var D = y2 - y1;

  var dot = A * C + B * D;
  var len_sq = C * C + D * D;
  var param = dot / len_sq;

  var xx, yy;

  if (param < 0 || (x1 == x2 && y1 == y2)) {
    xx = x1;
    yy = y1;
	param=0;
  }
  else if (param > 1) {
    xx = x2;
    yy = y2;
	param=1;
  }
  else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  var dx = x - xx;
  var dy = y - yy;
  return {d:Math.sqrt(dx * dx + dy * dy),p:{ x: x1+C*param,y: y1+D*param }};
}
// liefert einen liste von ständen die sich in der nähe das pfades befinden
getStandsAlongPath = function( path, maxdist, stands ) {

	if( stands == null ) {
		stands = markers;
	}

	var inlist = {};

	function g2r( d ) {
		return d/180*Math.PI;
	}

	for( var id in stands ) {

		var mp = stands[id].getPosition();
		var dist = 0;
		var x = mp.lat();
		var y = mp.lng();
		var nearest = { d:10000000, p:{x:0,y:0} };

		for( var i=1;i < path.getLength();i++ ) {
			var x1 = path.getAt(i-1).lat();
			var y1 = path.getAt(i-1).lng();

			var x2 = path.getAt(i).lat();
			var y2 = path.getAt(i).lng();

			var r = pointToLineDistance(x,y,x1,y1,x2,y2);
			if( r.d < nearest.d ) {
				nearest = r;
				nearest.id = id;
				var xx = nearest.p.x-x1;
				var yy = nearest.p.y-y1;
				nearest.distance = dist + Math.sqrt( xx*xx + yy*yy );
			}
			var xx = x2-x1;
			var yy = y2-y1;
			dist += Math.sqrt( xx*xx + yy*yy );
		}
		nearest.d = (6371000 * Math.acos( Math.cos( g2r(nearest.p.x) ) * Math.cos( g2r( x ) ) * Math.cos( g2r( y ) - g2r(nearest.p.y) ) + Math.sin( g2r(nearest.p.x) ) * Math.sin( g2r( x ))));
		if( nearest.d < maxdist ) {
			inlist[ nearest.id ] = {d:nearest.d,p:nearest.p,l:nearest.distance};
		}
	}
	return inlist;
}

pathlib = {

		get : function( obj , path ) {
			/*Wenn opath noch kein array ist dann umwandeln ...*/
			if( ! (path instanceof  Array) ) {
				path = path.split('.');
			}
			if( path.length > 1 ) {
				var child = obj[ path[0] ]
				if( child == null ) {
					return null;
				} else
					path.shift();
					return pathlib.get( child , path );
			} else if( path.length == 1 )
				return obj[ path[0] ];
		},
		set : function( obj , path , value ) {
			/*Wenn opath noch kein array ist dann umwandeln ...*/
			if( ! (path instanceof  Array) ) {
				path = path.split('.');
			}
			if( path.length > 1 ) {
				var index = path[0];
				path.shift();
				/*wildcards behandeln ...*/
				if( index == '*' ) {
					for( var id in obj ) {
						var child = obj[ id ]
						if( child == null ) {
							child = {}
						}
						pathlib.set( child , path, value );
						obj[ id ] = child;
					}
				} else {
					var child = obj[ index ]
					if( child == null ) {
						child = {}
					}
					pathlib.set( child , path, value );
					obj[ index ] = child;
				}
			} else if( path.length == 1 )
				/*wildcards behandeln ...*/
				if( path[0] == '*' ) {
					for( var id in obj ) {
						if( value == null ) {
							delete obj[ id ];
						} else
							obj[ id ] = value;
					}
				} else {
					if( value == null ) {
						delete obj[ path[0] ];
					} else
						obj[ path[0] ] = value;
				}
		}
}
/*
	Diese Methode Erzeugt eine Zustandsbeschreibung für eine jagdliche Einrichtung.
*/
renderConditionInfo = function( condition ) {
	var oct = ["Schlecht","Noch Ok","Gut"];
	var now = new Date();
	var v = predictedCondition( condition.updated, condition.value ) * 100;
	var cl = (v <= 34)? 'danger': (v <= 67)? 'warning':'success';
	return { value:v, orginal: oct[condition.value-1],class:cl, date:formatDate(condition.updated), name:condition.user};
}
/*
	Diese Methode versucht den Zustand einer jagdlichen Einrichtung mit Hilfe der
	letzten Kontrolle und deren Einschätzung abzuschätzen.
*/
predictedCondition = function( date , value ) {
	var now = new Date();
	var diff = 1.0-Math.max( Math.min( 1 , ( now.getTime() - date.getTime() ) / (365*24*60*60*1000) ), 0 );
	return Math.round( (value * diff)/3 * 10 ) / 10;
}
/*
	Diese methode ermittelt das aktuelle Jagdjahr
*/
getCurrentPeriod = function() {
	var date = new Date();
	var m = date.getMonth();
	var year = date.getFullYear();
	if( year ) {
		if( m <  3) {
			year-=1;
		}
		return {start: new Date( year,3,1), end: new Date( year+1, 2, 31 ) };
	}
}
/*
	Das Objekt 'modals' wird zur Erstellung von Modalen dialogen benutzt. In der
	Sessionvariable 'modal' befinden sich immer die Daten des Dialogs der ganz
	oben auf dem Stack liegt. Die Daten der Dialog die überlagert werden werden
	zwischendurch in die Variable 'modalstack' ausgelagert.
*/
editor = {
	push: function( type, data, state ) {
		obj = {
			template: type,
			data: data
		}
		if( state ) {
			obj['state'] = state;
		}
		Session.set('editor',obj);
	},
	getScreenCenterPoint : function () {
		var map = app.getMap();
		if( map ) {
			var center = map.getView().getCenter();
			var point = new ol.geom.Point( center );
			return new ol.format.GeoJSON().writeGeometryObject( point , { featureProjection: mapconfig.projection.name ,dataProjection:'WGS84' });
		}
	},
	get: function () {
		if( Session.get('editor') ) {
			return Session.get('editor').data;
		}
		return null;
	},
	set: function ( element, data ) {
		var obj = Session.get('editor')
		if( obj ) {
			obj.data[element] = data;
			Session.set('editor',obj)
		}
	},
	pop: function() {
		Session.set('editor',null);
	},
	setstate: function( newstate ) {
		setObj('editor','state',newstate);
	},
	getstate: function() {
		if( Session.get('editor') )
			return Session.get('editor').state;
		return '';
	},
	template: function() {
		if( Session.get('editor') )
			return Session.get('editor').template;
		return '';
	}
}
/*
	Das Objekt 'modals' wird zur Erstellung von Modalen dialogen benutzt. In der
	Sessionvariable 'modal' befinden sich immer die Daten des Dialogs der ganz
	oben auf dem Stack liegt. Die Daten der Dialog die überlagert werden werden
	zwischendurch in die Variable 'modalstack' ausgelagert.
*/
modals = {
	push: function( type , data ) {
		var stack = Session.get('modalstack');
		var old = Session.get('modal');
		if( old ) {
			if( stack )
				stack.push( old );
			else
				stack = [old];
			Session.set('modalstack',stack );
		}
		var obj = {};
		obj[type] = (data != null ) ? data:true;
		Session.set('modal', obj );
	},
	top: function() {
		var stack = Session.get('modalstack');
		if( stack && stack.length > 0 ) {
			return stack[ stack.length-1];
		}
		return null;
	},
	get: function () {
		var tmp = Session.get('modal');
		var d = _.values( tmp );
		if( d.length == 1 ) {
			return d[0];
		}
		return null;
	},
	set: function ( element, data ) {
		var tmp = Session.get('modal');
		for( var i in tmp ) {
			tmp[i][ element ] = data;
		}
		Session.set('modal',tmp);
	},
	pop: function() {
		var stack = Session.get('modalstack');
		if( stack && stack.length > 0 ) {
			Session.set('modal',stack[ stack.length-1]);
			stack.pop();
			Session.set('modalstack',stack );
		} else {
			Session.set('modal',null);
		}
	}
};
