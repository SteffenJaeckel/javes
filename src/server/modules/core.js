function findCreateUser( me, data ) {

  // create user ...
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
          managed : {type: 'set', items: [0,1], name:'Verwaltetes Profil' },
          firstname : {type: 'string', min:1, max:128, name:'Vorname' },
          surname: {type:'string',min:1, max:128, name: 'Nachname' },
          phone1 : {type: 'string', min:1, max:128, name:'Festnetz',optional:true },
          phone2: {type:'string',min:1, max:128, name: 'Mobil',optional:true },
          street : {type: 'string', min:1, max:128, name:'Straße',optional:true },
          number: {type:'string',min:1, max:128, name: 'Hausnummer',optional:true },
          zip : {type: 'string', min:1, max:128, name:'PLZ',optional:true },
          city: {type:'string',min:1, max:128, name: 'Stadt',optional:true },
          role: {type:'set', items: role.inviteroles , name:"Typ" },
          groups: {type:'string', min:0, max:1024, name:'Gruppen',optional:true },
          dogs: { type:'array', min:0, max:16, name:'Hunde', items: {
            type:'object', name:'Hund',model:{
              name: {type:"string",name:"Name des Hundes", min:0,max:256 },
              race: {type:"string", name:"Rasse des Hundes", min:0, max:128},
              type: {type:"set" , name:"Typ", items: [0,1,2,3]}
            }
          }}
        });

        var targetrole = customer.departments[ departmentid ].roles[ data.role ];

        var profile = {
          firstname: data.firstname,
          surname: data.surname,
          phone1 : data['phone1'],
          phone2 : data['phone2'],
          city : data['city'],
          street : data['street'],
          number : data['number'],
          zip : data['zip'],
          dogs: data.dogs,
          managed: (data.managed == 1)
        };

        // user per Email Adresse suchen ...
        if( data.email != null ) {
          var user = Accounts.findUserByEmail( data.email );
          if( user == null ) {
            Accounts.createUser( {'email':data.email,profile:profile} );
            user = Accounts.findUserByEmail( data.email );
          }
        } else {
          var md5name = data.firstname+"_"+data.surname;
          var user = Accounts.findUserByUsername(md5name);
          // wenn der user nicht gefunden wurde, user per username erzeugen ...
          if( user == null ) {
            Accounts.createUser( { 'username': md5name, profile:profile } );
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
            user.customers[customerid].departments[departmentid].groups = [];
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
    var me = Meteor.users.findOne({_id:this.userId});
    checkPermission(me,"administration.addUser");
    return findCreateUser( me, data );
  },
  updateUser : function( data ) {
    var me = Meteor.users.findOne({_id:this.userId});

    if( me && me.profile.currentpath.length >= 3 ) {
      var customerid = me.profile.currentpath[0];
      var departmentid = me.profile.currentpath[1];
      var currentrolename = me.profile.currentpath[2];
      var customer = Customers.findOne({ _id:customerid });
      if( customer && customer.departments[ departmentid ] ) {
        var role = customer.departments[ departmentid ].roles[ currentrolename ];

        if( role ) {
           data = Validate( data, {
            _id: {type:'string',name:"ID" },
            managed : {type: 'set', items: [0,1], name:'Verwaltetes Profil' },
            email: {type:'email',name:"E-Mail Adresse",optional:true },
            firstname : {type: 'string', min:1, max:128, name:'Vorname' },
            surname: {type:'string',min:1, max:128, name: 'Nachname' },
            phone1 : {type: 'string', min:1, max:128, name:'Festnetz',optional:true },
            phone2: {type:'string',min:1, max:128, name: 'Mobil',optional:true },
            street : {type: 'string', min:1, max:128, name:'Straße',optional:true },
            number: {type:'string',min:1, max:128, name: 'Hausnummer',optional:true },
            zip : {type: 'string', min:1, max:128, name:'PLZ',optional:true },
            city: {type:'string',min:1, max:128, name: 'Stadt',optional:true },
            role: {type:'set', items: role.inviteroles , name:"Typ" },
            groups: {type:'string', min:0, max:1024, name:'Gruppen',optional:true },
            dogs: { type:'array', min:0, max:16, name:'Hunde', items: {
              type:'object', name:'Hund',model:{
                name: {type:"string",name:"Name des Hundes", min:0,max:256 },
                race: {type:"string", name:"Rasse des Hundes", min:0, max:128},
                type: {type:"set" , name:"Typ", items: [0,1,2,3]}
              }
            }}
          });
          var user = Meteor.users.findOne({_id:data._id});

          var targetrole = customer.departments[ departmentid ].roles[ data.role ];

          user.customers[customerid].departments[departmentid].roles = [];

          user.customers[customerid].departments[departmentid].type = targetrole.type;
          user.customers[customerid].departments[departmentid].roles.push( data.role );
          user.customers[customerid].departments[departmentid].roles = _.uniq(user.customers[customerid].departments[departmentid].roles);

          if( data.groups ) {
            var groups = data.groups.split(',');
            user.customers[customerid].departments[departmentid].groups = [];
            for( var i=0;i < groups.length;i++ ) {
              user.customers[customerid].departments[departmentid].groups.push( groups[i].trim() );
            }
          }
          user.customers[customerid].departments[departmentid].groups = _.uniq(user.customers[customerid].departments[departmentid].groups);
          
          user.profile.firstname = data['firstname'];
          user.profile.surname = data['surname'];

          user.profile.phone1 = data['phone1'];
          user.profile.phone2 = data['phone2'];

          user.profile.city = data['city'];
          user.profile.street = data['street'];
          user.profile.number = data['number'];
          user.profile.zip = data['zip'];

          user.profile.dogs = data['dogs'];

          user.profile.managed = (data['managed'] == 1);

          if( data['email'] && data['email'] != "" ) {
            Accounts.addEmail(user._id, data['email'], false)
          }

          Meteor.users.update( {_id:user._id}, user );
        } else {
          throw new Meteor.Error(413, "role_not_found_error");
        }
      } else {
        throw new Meteor.Error(413, "customer_not_found");
      }
    } else {
      throw new Meteor.Error(413, "path_error");
    }
  },
  deleteUser : function( id ) {
    Meteor.users.remove({_id:id , isServerAdmin: null });
  }
});

Accounts.onCreateUser( function(options, user) {
	if ( options.profile ) {
		options.profile.avatar = Math.round( Math.random() * 1000 );
		user.profile = options.profile;
    user.profile.title = "";
    user.profile.gender = 0;
    user.profile["currentpath"] = [];
  }
  user.customers = {};
	return user;
});
