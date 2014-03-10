

// Synchronously load model dependecies, so foreign model calls can be made
// var fs = require('fs');
// var models_path = __dirname;
// fs.readdirSync(models_path).forEach(function (file) {
//   if (~file.indexOf('.js')) require(models_path + '/' + file);
// })

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// var Player = mongoose.model('Player');
// var Family = mongoose.model('Family');


var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 7;

var UserSchema = new Schema({
  email: { type:String, unique:true, required:true, match: /^([0-9a-zA-Z]([-\.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/ },
  first_name: { type:String, default:"Mr./Ms." },
  last_name: { type:String, default: "User" },
  phone : { type:String },
  password : { type:String },
  accessToken: { type: String }, // Used for Remember Me sessions
  active: { type: Boolean, default: true }
});



UserSchema.virtual('name').get(function() {
	return this.first_name + ' ' + this.last_name;
});


UserSchema.statics.getByEmail = function(email, callback) {
	this.findOne({email: email}, function(err, user){
		callback(err, user);
	});
};




//tested in family_test
UserSchema.methods.getPlayers = function(callback) {
	Family.getPlayersForUser(this._id, function(players){
		callback(players);
	})
};



//bcrypt middleware
UserSchema.pre('save', function(next){
	var user = this;
	if(!user.isModified('password')) return next();


	bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
		if(err) return next(err);

		bcrypt.hash(user.password, salt, null, function(err, hash){
			if(err) return next(err);
			user.password = hash;
			user.active = true; //put this in so we know if a person logged in
			next();
		});
	});
});

//password verification
UserSchema.methods.comparePassword = function(candidatePassword, cb){
	bcrypt.compare(candidatePassword, this.password, function(err, isMatch){
		if(err) return cb(err);
		cb(null, isMatch);
	});
};

//remember me implementation helper method
UserSchema.methods.generateRandomToken = function() {
	var user = this;
	var chars = "_!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	var token = new Date().getTime() + '_';
	for( var x = 0; x<16; x++){
		var i = Math.floor(Math.random() * 62 );
		token += chars.charAt(i);
	}
	return token;
};

UserSchema.statics.generateRandomPassword = function() {

	var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
	var token = "";
	for( var x = 0; x<8; x++){
		var i = Math.floor(Math.random() * chars.length );
		token += chars.charAt(i);
	}
	return token;
};





mongoose.model('User', UserSchema);
module.exports = mongoose.model('User');