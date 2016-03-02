function readableName( user ) {
	return user.profile.firstname+" "+user.profile.surname;
}

Meteor.methods({

	sendDeleteAccountMail: function( email ) {
		// TODO: generate token and send mail with delete account link
	},
	deleteAccount: function( token, email ) {
		// TODO: delete account from token
	},
	sendResetPasswortMail: function( email ) {

		var user = Meteor.users.findOne({'emails.address':email})
		if( user == null ) {
			throw new Meteor.Error(413, "user not found");
		} else {

			Accounts.emailTemplates.resetPassword.subject = function( user ) {
				return "Passwort für "+readableName( user )+" kann zurückgesetzt werden ...";
			}
			Accounts.emailTemplates.resetPassword.text = function( user, url ) {
				return "Hallo "+readableName( user )+",⁄num Ihr Passwort zurückzusetzen verwenden Sie bitte folgenden Link:"+url+"⁄n⁄n"+
				"Beste Grüße Ihr JAVES Team";
			}
			Accounts.emailTemplates.resetPassword.html = function( user, url ) {
				return "<p>Hallo "+readableName( user )+",</p><p>um Ihr Passwort zurückzusetzen verwenden Sie bitte folgenden Link:"+url+"</p>"+
				"<p>Beste Grüße Ihr JAVES Team</p>";
			}
			Accounts.sendResetPasswordEmail( user._id, email );
		}
	},
	updateProfile: function (newdata ) {
		Meteor.users.update( {_id:this.userId},{$set:{'profile.name':newdata.name, 'profile.surname':newdata.surname,'profile.avatar':newdata.avatar,'profile.reportdisplaytime':newdata.reportdisplaytime}});
	},

});
