var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

/** Get main web page, and assign session id to this user
 *
 */
router.route('/')
    .all(function(request, response, next){
	  //Assign session id and store in MongoDB

	    next();
	})
    .get(function(request,response){
	    
	});

module.exports = router;
