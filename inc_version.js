var fs = require('fs');
fs.readFile("www/version.js", function( err , data ) {
	eval( data.toString() );
	version.minor++;
	var str = "version = { major:"+version.major+",minor:"+version.minor+"}; ";
	fs.writeFile('www/version.js', str );
	console.log(version.major+'.'+version.minor);
})
