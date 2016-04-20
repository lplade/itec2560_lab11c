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
		var newTime = (req.body.timeMM * 60) + req.body.timeSS;
		//convert it back from seconds anyway
/*		var timeInMinutes = Math.floor(newTime / 60);
		var timeInSeconds = newTime % 60; */

		// Instead of crying over time formatting, use moment-duration-format
		var timeString = moment.duration(newTime, 'seconds').format('hh:mm:ss');
		var dateString = moment(newDate).format('L'); // MM/DD/YYYY

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
