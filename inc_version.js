var fs = require('fs');
fs.readFile("src/version.js", function( err , data ) {
	eval( data.toString() );
	version.minor++;
	var str = "version = { major:"+version.major+",minor:"+version.minor+"}; ";
	fs.writeFile('src/version.js', str );
	console.log(version.major+'.'+version.minor);
})
