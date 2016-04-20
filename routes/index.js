var express = require('express');
var router = express.Router();
var moment = require('moment');
require('moment-duration-format');

var Lake = require('../models/lakes.js');

/* GET home page. */
router.get('/', function (req, res, next) {
	//Ask the schema to find all the runs
	//Results provided via callback
	Lake.find(function (err, lakeDocs) {
		if (err) {
			return next(err);
		}

		//seems to be a way sort by a key
		// http://stackoverflow.com/questions/19751420/mongoosejs-how-to-find-the-element-with-the-maximum-value

		//TODO do something sensible in the event of a tie
		for (var i=0; i<lakeDocs.length; i++){
			var shortestRunTime = Infinity;
			var shortestRunIndex = 0;
			var currentLake = lakeDocs[i];
			if (! currentLake.runs.length == 0) {
				for (var j=0; j<currentLake.runs.length; j++){
					//iterate through each run and find lowest value
					if (currentLake.runs[j].timeSecs < shortestRunTime) {
						shortestRunTime = currentLake.runs[j].timeSecs;
						shortestRunIndex = j;
					}
				}
				//set a property for the object that gets passed to jade renderer
				console.log("Shortest run for lake " + currentLake.name + " is " + shortestRunTime);
				console.log("Index is " + shortestRunIndex);
				lakeDocs[i].runs[shortestRunIndex].fastest = true;
			}
		}
		
		
		res.render('index', {
			title: 'Lake Runner',
			runList: lakeDocs,
			error: req.flash('error')
		});
	});
});

router.post('/', function (req, res, next) {
	console.log(req.body.name);
	req.body.runs = [];

	var newLake = Lake(req.body);
	newLake.save(function (err) {
		//Handle validation errors
		if (err) {
			if (err.name = "ValidationError") {
				req.flash('error', 'Invalid data');
				return res.redirect('/');
			}
			//Handle duplication errors
			if (err.code == 11000) {
				req.flash('error', 'A lake with that name already exists');
				return res.redirect('/');
			}
			//Some other error
			return next(err);
		}
		//If no error, lake created. Redirect
		res.status(201); //created
		return res.redirect('/'); //get the home page
	});
});

router.post('/addRun', function (req, res, next) {
	//Check if user provided a date
	var newRun = req.body.dateRun;
	if (!newRun || newRun == '') {
		//TODO error message
		return res.redirect('/');
	}

	//TODO validate times?

	//Find run with this name, add the new date,
	// convert the time to seconds, convert that time to a human readable
	// string, and save it
	Lake.findOne({name: req.body.name}, function (err, lake) {
		if (err) {
			return next(err)
		}
		//If no lake found, then send message to app error handle
		if (!lake) {
			return next(new Error('No lake found with name ' + req.body.name))
		}

		var newDate = moment(req.body.dateRun);
		var newTime = (parseInt(req.body.timeMM) * 60) + parseInt(req.body.timeSS);
		console.log("newTime: " + newTime);
		//convert it back from seconds anyway
/*		var timeInMinutes = Math.floor(newTime / 60);
		var timeInSeconds = newTime % 60; */

		// Instead of crying over time formatting, use moment-duration-format
		var timeString = moment.duration(newTime, 'seconds').format('hh:mm:ss');
		console.log("timeString: " + timeString);
		var dateString = moment(newDate).format('L'); // MM/DD/YYYY
		console.log(dateString);

		var newRun = {
			timeSecs: newTime,
			timeHuman: timeString,
			dateRun: newDate,
			dateHuman: dateString
		};

		lake.runs.push(newRun);

		lake.save(function (err) {
			if (err) {
				return next(err);
			}
			res.redirect('/'); //return home
		});
	});
});
module.exports = router;
