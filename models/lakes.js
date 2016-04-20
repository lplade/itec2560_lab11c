var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var lakeSchema = new Schema({
	name: {
		type: String,
		required: true,
		unique: true,
		lowercase: true
	},
	runs: [{ //array of runs
		timeSecs: Number, //store all run times in seconds
		timeHuman: String, //convert to a human-readable string too
		dateRun: {
			type: Date,
			default: Date.now
		},
		dateHuman: String //human readable string because JS date object is messy
	}]
});

var Lake = mongoose.model('Lake', lakeSchema);

module.exports = Lake;