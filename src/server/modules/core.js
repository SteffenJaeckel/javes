function findCreateUser( data ) {
  // create user ...
  var me = Meteor.users.findOne({_id:this.userId});

  if( me && me.profile.currentpath.length >= 3 ) {
    var customerid = me.profile.currentpath[0];
    var departmentid = me.profile.currentpath[1];
    var currentrolename = me.profile.currentpath[2];
    var customer = Customers.findOne({ _id:customerid });
    if( customer && customer.departments[ departmentid ] ) {
      var role = customer.departments[ departmentid ].roles[ currentrolename ];
      if( role ) {
        // validate input ...
        data = Validate( data, {
          email: {type:'email',name:"E-Mail Adresse",optional:true },
          firstname : {type: 'string', min:1, max:128, name:'Vorname' },
          surname: {type:'string',min:1, max:128, name: 'Nachname' },
          role: {type:'set', items: role.inviteroles , name:"Typ" },
          groups: {type:'string', min:0, max:128, name:'Gruppen',optional:true }
        });

        var targetrole = customer.departments[ departmentid ].roles[ data.role ];

        // user per Email Adresse suchen ...
        if( data.email != null ) {
          var user = Accounts.findUserByEmail( data.email );
          if( user == null ) {
            Accounts.createUser( {'email':data.email,profile:{firstname: data.firstname, surname: data.surname, managed:true }} );
            user = Accounts.findUserByEmail( data.email );
          }
        } else {
          var md5name = data.firstname+"_"+data.surname;
          var user = Accounts.findUserByUsername(md5name);
          // wenn der user nicht gefunden wurde, user per username erzeugen ...
          if( user == null ) {
            Accounts.createUser( { 'username': md5name, profile:{firstname: data.firstname, surname: data.surname, managed:true } } );
            user = Accounts.findUserByUsername(md5name);
          }
        }

        // customer record hinzugefügen ...
        if( user ) {
          if( user.customers == null ) {
            user.customers = {};
          }
          if( user.customers[customerid] == null ) {
            user.customers[customerid] = { departments:{} };
          }
          if( user.customers[customerid].departments[departmentid] == null ) {
            user.customers[customerid].departments[departmentid] = { roles:[], type:100, groups: [], invitedBy:me._id, invitedAt:new Date() };
          }
          user.customers[customerid].departments[departmentid].type = Math.min( user.customers[customerid].departments[departmentid].type, targetrole.type);
          user.customers[customerid].departments[departmentid].roles.push( data.role );
          user.customers[customerid].departments[departmentid].roles = _.uniq(user.customers[customerid].departments[departmentid].roles);

          if( data.groups ) {
            var groups = data.groups.split(',');
            for( var i=0;i < groups.length;i++ ) {
              user.customers[customerid].departments[departmentid].groups.push( groups[i].trim() );
            }
          }
          user.customers[customerid].departments[departmentid].groups = _.uniq(user.customers[customerid].departments[departmentid].groups);
          Meteor.users.update( {_id:user._id}, user );
        }
        return user._id;
      } else {
        throw new Meteor.Error(413, "role_not_found_error");
      }
    } else {
      throw new Meteor.Error(413, "customer_not_found");
    }
  } else {
    throw new Meteor.Error(413, "path_error");
  }
}

Meteor.methods({
  findUser : function( data ) {
    data = Validate( data, {
  		email: {type:'email'},
  		firstname : {type: 'string', min:1, max:128 },
  		surname: {type:'string',min:1, max:128},
  	});
    // benutzer über die Email addresse suchen ...
    var user = Meteor.users.findOne( { 'emails.address' : data.email } );
    if( user ) {
      return user.profile;
    } else {
      // benutzer über den namen suchen ...
      var user = Meteor.users.findOne( {'profile.firstname': data.firstname , 'profile.surname': data.surname } );
      if( user ) {
        return user.profile;
      }
    }
    return  null;
  },
  findCreateInviteUser : function ( data ) {
    email = email.toLowerCase();
		var sender = Meteor.users.findOne( { _id: this.userId });
		var area = Areas.findOne( { _id: areaId, deleted:false } );

		var newId = findCreateUser( {
			email: email,
			firstname: firstname,
			surname: surname,
			role: "admin",
			groups:[],
		});

		var obj = {};
		obj['viewer.'+newId ] = area.viewer[this.userId]+1;
		console.log("invite @ "+email)
		Areas.update({'_id':areaId}, { '$set' : obj } );
		Accounts.emailTemplates.siteName = "revier-plan.de";
		Accounts.emailTemplates.from = sender.profile.name+" "+sender.profile.surname+"<"+sender.emails[0].address+">";
		Accounts.emailTemplates.enrollAccount.subject = function (user) {
			return "Hallo " + user.profile.name+" "+user.profile.surname;
		};

		Accounts.emailTemplates.enrollAccount.text = function (user, url) {
			var sender = Meteor.users.findOne( { _id: user.profile.invitedBy });
			var sendername = readableName( sender );
			var revier = Areas.findOne({_id: user.profile.currentSelectedArea} );
			return ""+_.escape(sendername)+" hat Sie eingeladen, mit Ihm gemeinsam das Revier "+_.escape(revier.name)+" auf der Website revier-plan.de zu teilen.⁄n"+
			"Um der Einladung zu folgen benutzen Sie bitte den folgenden Link : "+url+"⁄n"+
			"Wenn Sie "+_.escape(sendername)+" nicht kennen und auch sonst keine Beziehung zur Jagd haben, handelt es sich möglicherweise um einen Irrtum. Wir bitten Sie das zu Entschuldigen⁄n⁄n"+
			"Das Revierplan Team freut sich bereits auf Sie.⁄n";
		};

		Accounts.emailTemplates.enrollAccount.html = function (user, url) {
			var sender = Meteor.users.findOne( { _id: user.profile.invitedBy });
			var sendername = readableName( sender );
			var revier = Areas.findOne({_id: user.profile.currentSelectedArea} );
			return "<p><b>"+_.escape(sendername)+"</b> hat Sie eingeladen, mit Ihm gemeinsam das Revier <b>"+_.escape(revier.name)+"</b> auf der Website revier-plan.de zu teilen.</p>"+
			"<p>Um der Einladung zu folgen benutzen Sie bitte den folgenden Link : <a href="+url+">"+url+"</a>.</p>"+
			"<p>Wenn Sie <b>"+_.escape(sendername)+"</b> nicht kennen und auch sonst keine Beziehung zur Jagd haben, handelt es sich möglicherweise um einen Irrtum. Wir bitten Sie das zu Entschuldigen</p>"+
			"<p>Das Revierplan Team freut sich bereits auf Sie.</p>";
		};
		Accounts.sendEnrollmentEmail(newId);
  },
  findCreateUser : function( data ) {
    return findCreateUser( data );
  }
});

Accounts.onCreateUser( function(options, user) {
	if ( options.profile ) {
		options.profile.avatar = Math.round( Math.random() * 1000 );
		user.profile = options.profile;
    user.profile.dogs = [];
    user.profile.title = "";
    user.profile.gender = 0;
    user.profile["currentpath"] = [];
  }
  user.customers = {};
	return user;
});
