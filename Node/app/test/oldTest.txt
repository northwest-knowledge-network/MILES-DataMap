/*
const runner = require('mocha-headless-chrome');

const options = {
    file: 'index.html',                           // test page path
    reporter: 'dot',                             // mocha reporter name
    width: 800,                                  // viewport width
    height: 600,                                 // viewport height
    timeout: 120000,                             // timeout in ms
    executablePath: '/usr/bin/chrome-unstable',  // chrome executable path
    args: ['no-sandbox']                         // chrome arguments
};

runner(options)
    .then(result => {
	    let json = JSON.stringify(result);
	    console.log(json);
	});

*/
'use strict';
/*
var webdriver = require('selenium-webdriver'),
    By = webdriver.By,
    until = webdriver.until;

var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();
*/
const chai = require('chai');
const deepAssign = require('deep-assign');
const fs = require('fs');
const path = require('path');
const url = require('url');

const MochaChrome = require('../index');
const expect = chai.expect;

function test (options) {
    const url = "../../PHP-Apache/PHP/index.html"; //'file://' + path.join(__dirname, '/html', options.file + '.html');

    options = deepAssign(options = {
	    url,
	    mocha: { useColors: false },
	    ignoreConsole: true,
	    ignoreExceptions: true,
	    ignoreResourceErrors: true
	}, options);

    const runner = new MochaChrome(options);
    const result = new Promise((resolve, reject) => {
	    runner.on('ended', stats => {
		    resolve(stats);
		});

	    runner.on('failure', message => {
		    reject(message);
		});
	});

    (async function () {
	await runner.connect();
	await runner.run();
    })();

    return result;
}

describe('MochaChrome', () => {


	it('runs a test', () => {

	    });


	/*
	*/

    });