if( Meteor.isServer )
{
	WebApp.connectHandlers.use( function(req, res, next) {
		var parts = req.url.split('/');
		if( parts[1] == 'api') {
			res.writeHead(200, {'Content-Type': 'application/json'});
			var result = [];
			Areas.find({_id:"yTwZoi3pWEhWWopCS"}).forEach( function(area) {
				obj = {id:area._id, name:area.name, shape:area.shape, stands:[] };
				Stands.find( { area:area._id } ).forEach( function( stand ) {
					obj.stands.push( { id:stand._id, name:stand.name, type: stand.type, position:stand.position, desc:stand.description, condition: stand.condition } );
				})
				result.push( obj )
			});
		res.end( EJSON.stringify(result) );
		} else {
			next();
		}
	});
}
