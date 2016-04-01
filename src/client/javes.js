if (Meteor.isClient) {

	var mapview = null;
	var passwortlength = 1;

	for( var module in window.mods ) {
		if( window.mods[ module ].token ) {
			var token = window.mods[ module ].token();
			for( var t in token ) {
				var exp = new RegExp('^#'+t+'/(.*)$');
				var match = window.location.hash.match(exp);
				if( match ) {
					window.location.hash = '';
					Session.set('tokendata',match[1] );
					Session.set('tokenpage',token[t]);
					Session.set('pagemode',{ modultoken:true });
				}
			}
		}
	}
/*
	var match = window.location.hash.match(/^\#\/refuse-invite\/(.*)$/);
	if( match ) {
		window.location.hash = '';
		parts = match[1].split('/');
		Meteor.call('refuseInvite', parts[0], parts[1], function( e ) {
			Session.set('pagemode',{ inviterefused:true });
		});
	}
	var match = window.location.hash.match(/^\#\/accept-invite\/(.*)$/);
	if( match ) {
		window.location.hash = '';
		parts = match[1].split('/');
		Meteor.call('acceptInvite', parts[0], parts[1], function( e ) {
			Session.set('pagemode',{ inviteaccepted:true });
		});
	}
	*/
	/*
		Template Helper Klassen
	*/

	Template.registerHelper('formatColor', function( color ) {
		return Colors[color];
	})

	Template.registerHelper('formatGameType', function( type ) {
		return Gametypes[type];
	})

	Template.registerHelper('formatUserName', function( id ) {
		var user = Meteor.users.findOne({_id:id})
		if( user )
			return user.profile.firstname+", "+user.profile.surname;

		return "Unbekannt";
	})

	Template.registerHelper('userById', function( id ) {
		if( id == null  || id == '' ) {
			return 'Niemand';
		}
		var user = Meteor.users.findOne( {_id:id });
		if( user ) {
			var s = '';
			if( user.profile.title != null && user.profile.title != '' ) {
				s += user.profile.title+" ";
			}
			return s+user.profile.firstname+" "+user.profile.surname;
		}
		return "Anonymer Benutzer";
	})

	Template.registerHelper('formatDateDay', function( date ) {
		if( date )
			return Weekdays[ date.getDay() ]+", "+formatDate(date);

		return '';
	})

	Template.registerHelper('formatDate', function( date ) {
		return formatDate(date);
	})

	Template.registerHelper('formatTime', function( date ) {
		return formatTime(date);
	})

	Template.registerHelper('formatGender',function( type ) {
		return Gendertypes[type];
	})

	Template.registerHelper('formatSalutation',function( type ) {
		return Salutationtypes[type];
	})

	Template.registerHelper('timeSpan',function( start, end ) {
		var hour = 60*60*1000;
		var span = Math.abs( start.getTime() - end.getTime() ) + hour;
		if( span > hour * 24 ) {
			return (Math.round( (span / (hour*24))*10) / 10) + " Tage";
		} else {
			return (Math.round( (span / (hour))*10) / 10) + " Stunden";
		}
	})

	Template.registerHelper('mul',function( a , b ) {
		return a*b;
	})

	Template.registerHelper('div',function( a , b ) {
		return a/b;
	})

	Template.registerHelper('add',function( a , b ) {
		return a+b;
	})

	Template.registerHelper('equal',function( a , b ) {
		return (a==b);
	})

	Template.registerHelper('formatConditionValue',function( date , orginal ) {
		return predictedCondition( date , orginal );
	})

	Template.registerHelper('formatConditionText',function( value ) {
		var ConditionTypes = ['Schlecht','Noch Ok','Gut'];
		return ConditionTypes[ value-1 ];
	})

	Template.registerHelper('formatHuntType',function( value ) {
		return Huntingtypes[value];
	})

	Template.registerHelper('modultoken',function() {
		return { valid: Session.get('tokenpage'), page: Session.get('tokenpage'),data: Session.get('tokendata')};
	})

	Template.registerHelper('modal',function() {
		return modal.get();
	})

	Template.registerHelper('editor',function() {
		return editor.get();
	})

	Template.registerHelper('editortemplate',function() {
		return editor.template();
	})

	Template.registerHelper('checkeditorstate',function( arg ) {
		return editor.getstate() == arg;
	})

	Template.registerHelper('error',function( ) {
		return Session.get('error');
	})

	Template.registerHelper('checkPermission', checkPermission )

	Template.index.helpers ( {
		version : function() {
			return version.major+"."+version.minor;
		},
		pageMode : function() {
			if( Session.get('pagemode') != null ){
				return Session.get('pagemode');
			} else if( Accounts._resetPasswordToken ) {
				return { resetpassword:true };
			} else if ( Accounts._enrollAccountToken ) {
				return { enrollaccount:true };
			} else {
				return {index:true};
			}
		},
		enrollMode : function () {
			return (Accounts._enrollAccountToken != null)
		},
		resetPasswordMode : function () {
			return (Accounts._resetPasswordToken != null)
		}
	})

	Template.index.events = {
		'click #privacy':function(e) {
			Session.set('pagemode',{privacy:true});
		},
		'click #index':function(e) {
			Session.set('pagemode',null);
		},
		'click #register':function(e) {
			Session.set('pagemode',{register:true});
		},
		'click #agbs':function(e) {
			Session.set('pagemode',{agbs:true});
		},
		'click #impress':function(e) {
			Session.set('pagemode',{impress:true});
		}
	}


	Template.resetPasswordSetNew.error = function ( ) {
		return Session.get('resetpassword-error');
	}

	Template.resetPasswordSetNew.events({
		'submit #resetpasswort': function ( e ) {
			e.stopImmediatePropagation();
			e.preventDefault();
			var newPassword = $('#resetpasswort-password').val();
			if( newPassword.length < passwortlength ) {
				Session.set('resetpassword-error',{ passwortToShort : passwortlength } );
			} else {
				if( newPassword == $('#resetpasswort-password-repeat').val() ) {
					$('#loading').show();
					Accounts.resetPassword(Accounts._resetPasswordToken, newPassword, function(e) {
						$('#loading').hide();
						if( e ) {
							console.log( e.reason );
							Session.set('resetpassword-error',e.reason );
						} else {
							Accounts._resetPasswordToken = null;
						}
					})
				} else {
					Session.set('resetpassword-error',{passwordDontMatch:true});
				}
			}
		}
	})

	Template.resetPasswordEnterMail.mailSend = function ( ) {
		return Session.get('resetpassword').mailsend;
	}

	Template.resetPasswordEnterMail.error = function ( ) {
		return Session.get('resetpassword').error;
	}

	Template.resetPasswordEnterMail.events({
		'click #abort':function (e) {
			Session.set('resetpassword',null );
			Session.set('pagemode',null );
		},
		'submit #resetpasswort': function ( e ) {
			e.stopImmediatePropagation();
			e.preventDefault();
			$('#loading').show();
			Meteor.call('sendResetPasswortMail', $('#resetpasswort-email').val().toLowerCase(), function ( e ) {
				$('#loading').hide();
				if( e ) {
					console.log(e);
					if( e.reason == 'user not found' ) {
						Session.set('resetpassword',{ error: { unkownEmail: $('#resetpasswort-email').val().toLowerCase() } });
					}
				} else {
					Session.set('resetpassword',{ mailsend:$('#resetpasswort-email').val().toLowerCase() });
				}
			})
		}
	})

	/// login template ...
	Template.login.error = function () {
		return Session.get('login-error');
	}

	Template.login.events({
		'click #reset-password-lnk': function (e) {
			Session.set('resetpassword',{});
			Session.set('pagemode',{ enteremail:true });
			e.stopImmediatePropagation();
			e.preventDefault();
		},
		'submit #signin': function ( e ) {
			e.stopImmediatePropagation();
			e.preventDefault();
			$('#loading').show();
			Meteor.loginWithPassword( $('#signin-email').val().toLowerCase(), $('#signin-password').val() , function ( e ) {
				$('#loading').hide();
				if(e) {
					Session.set('login-error', { userNotFoundOrPassword: true } );
				}
			})
		}
	})

	/// login template ...
	Template.deleteaccount.events({
		'submit #deleteaccount': function ( e ) {
			console.log($('#delete-email').val().toLowerCase());
		}
	})

	Template.enrollaccount.created = function() {
		Meteor.call('loadEnrollInfo',Accounts._enrollAccountToken, function ( error, result ) {
			Session.set('enrollaccountdata',result);
		})
		console.log("create enroll account")
	}

	Template.enrollaccount.loaded = function () {
		return ( Session.get('enrollaccountdata') != null );
	}

	Template.enrollaccount.error = function () {
		return Session.get('registration-error');
	}

	Template.enrollaccount.email = function() {
		return Session.get('enrollaccountdata').user.emails[0].address;
	}

	Template.enrollaccount.name = function() {
		return Session.get('enrollaccountdata').user.profile.name;
	}

	Template.enrollaccount.surname = function() {
		return Session.get('enrollaccountdata').user.profile.surname;
	}

	Template.enrollaccount.invitedBy = function() {
		return Session.get('enrollaccountdata').invitedBy;
	}

	Template.enrollaccount.events({
		'submit #enrollaccount': function( e ) {
			e.stopImmediatePropagation();
			e.preventDefault();

			if( $('#enrollaccount-abgs-checked').prop('checked') == false ) {
				Session.set("registration-error",{ agbsDontAccepted:true })
			} else {
				if( $('#enrollaccount-password').val() != $('#enrollaccount-password-repeat').val() ) {
					Session.set("registration-error",{ passwordDontMatch:true });
				} else {
					if(  $('#enrollaccount-password').val().length < passwortlength ) {
						Session.set("registration-error",{ passwortToShort:passwortlength });
					} else {
						$('#loading').show();
						Accounts.resetPassword(Accounts._enrollAccountToken, $('#enrollaccount-password').val(), function(e) {
							$('#loading').hide();
							if( e ) {
								console.log( e.reason );
								Session.set('resetpassword-error',e.reason );
							} else {
								Accounts._enrollAccountToken = null;
							}
						})
						Session.set("registration-error",null);
					}
				}
			}
		}
	})
}
