var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

/** Get main web page, and assign session id to this user
 *
 */
/*
router.route('/validate')
    .all(function(request, response, next){
	    //Assign session id

	    next();
	})
    .get(function(request,response){
	    
	});
*/

router.route('/data')
  .all(function(request, response, next){
	  console.log(request.body);
	  sanitizeEnglishInput(request);
	  next();
  })
  .post(function(request,response){
	  MongoClient.connect('mongodb://mongodb:27017/datamapusage', function (err, db) {
		if (err) throw err;
		console.log("Printing request data");
		console.log(request.body);
		db.collection('search_terms').insertOne({searchTerm1:request.body.searchTerm1, searchTerm2:request.body.searchTerm2, searchTerm3:request.body.searchTerm3, nodeType1: request.body.nodeType1, nodeType2:request.body.nodeType2, nodeType3:request.body.nodetype3, startYear:request.body.startYear, endYear:request.body.endYear, requestDate:new Date()}, function (err, result) {
	  		if (err){ 
			    throw err;
			    response.status(500).send("Database query failed!");
			    
			}else{
			    response.status(200).send("Worked!");
			}

		    });
		db.close();
	});
  });

/**                                  
 * Remove all non-alphanumeric values from request JSON attributes 
 * @param {object} request     
 */
function sanitizeEnglishInput(request){
    var notAlphanumericRegex = /[^a-zA-Z0-9 ]/g;
    console.log("Printing request body elements:");
    Object.keys(request.body).forEach(function(key){
            request.body[key] = request.body[key].replace(notAlphanumericRegex, "");
            console.log(request.body[key]);
        });
}

module.exports = router;
