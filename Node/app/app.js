var express = require('express');
var app = express();
var database = require('./routes/database');
var bodyParser = require('body-parser');
var helmet = require('helmet');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
/*
app.set('trust proxy', 1); // trust first proxy
app.use(session({
    secret: 'QEAS;lkjOPIJ;kljoi;LKJWE!@#$%^&*(:LKJ',
		store: new MongoStore({
			url: 'mongodb://mongodb:27017/sessions',
		})
}));
*/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));
app.use(helmet());

app.use(function (req, res, next) {
        //Only set CORS for requesting URL if requested URL is authorized        
	
	//Add localhost and datamap subdomain to allowed hosts
        var allowedOrigins = ['http://localhost', 'http://datamap.nkn.uidaho.edu'];
        var origin = req.headers.origin;
        if(allowedOrigins.indexOf(origin) > -1){
	    res.setHeader('Access-Control-Allow-Origin', origin);
	}

        // Request methods you wish to allow                                                                                                                                                                                                                                  
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

        // Request headers you wish to allow                                                                                                                                                                                                                                  
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        // Pass to next layer of middleware                                                                                                                                                                                                                                   
        next();
    });

//app.use('/database', database);

app.listen(80, function(){
    console.log("Server listening on port 80");
});
