const webdriverio = require('webdriverio');
const chromedriver = require('chromedriver');
const chai = require('chai');                 
var chaiWebdriver = require('chai-webdriverio').default;
chai.use(chaiWebdriver(browser));

var expect = chai.expect;

//Navigate to webpage hosted by Docker stack
browser.url('http://localhost:10000');

describe('Test search system', function() {
	it('should add 3 search parameters to search, but no more than 3', function () {

		//Wait for page to load
		browser.waitForVisible("#query-node-1", 9000);

		//Check if first select box is visible
		expect(browser.isExisting("#query-node-1")).to.be.true;
		//Check if first element is visible
		expect(browser.isExisting("#search-input-1")).to.be.true;

		//Check if second search input and select are not yet visible
		expect(browser.isExisting("#query-node-2")).to.not.be.true;
		expect(browser.isExisting("#search-input-2")).to.not.be.true;

		// Add second element
		browser.click('#add-form-input');
		expect(browser.isExisting("#query-node-2")).to.be.true;
		expect(browser.isExisting('#search-input-2')).to.be.true;

		//Make sure third search section is not yet visible
		expect(browser.isExisting("#query-node-3")).to.not.be.true;
		expect(browser.isExisting("#search-input-3")).to.not.be.true;
		
		browser.click('#add-form-input');
		expect(browser.isExisting("#query-node-3")).to.be.true;
		expect(browser.isExisting("#search-input-3")).to.be.true;

		//Make sure 4th search section does not exist
		expect(browser.isExisting("#query-node-4")).to.not.be.true;
		expect(browser.isExisting("#search-input-4")).to.not.be.true;
	    });

	it('should remove 2 search parameters from search, but no more than 2', function () {

		//Check if third element is visible
		expect(browser.isExisting("#query-node-3")).to.be.true;
		expect(browser.isExisting("#search-input-3")).to.be.true;
		//Make sure 4th is not visible
		expect(browser.isExisting("#query-node-4")).to.not.be.true;
		expect(browser.isExisting("#search-input-4")).to.not.be.true;

		//Remove third element
		browser.click('#remove-form-input');
		expect(browser.isExisting("#query-node-2")).to.be.true;
		expect(browser.isExisting('#search-input-2')).to.be.true;
		//Make sure third section is gone
		expect(browser.isExisting("#query-node-3")).to.not.be.true;
		expect(browser.isExisting("#search-input-3")).to.not.be.true;
		
		//Remove second element
		browser.click('#remove-form-input');
		expect(browser.isExisting("#query-node-1")).to.be.true;
		expect(browser.isExisting("#search-input-1")).to.be.true;

		//Make sure second section is gone
		expect(browser.isExisting("#query-node-2")).to.not.be.true;
		expect(browser.isExisting("#search-input-2")).to.not.be.true;

		//Should not be able to remove first element
		browser.click('#remove-form-input');
		expect(browser.isExisting("#query-node-1")).to.be.true;
		expect(browser.isExisting("#search-input-1")).to.be.true;
	    });	
    });

describe('Test filter, reset, and about buttons', function(){

	it('should click the filter button, and the list of nodes should be present', function(){
		expect(browser.isExisting("#filter")).to.be.true;

		//Click on the filter button
		browser.click('#filter');
		browser.waitForVisible("#qtip-0-content", 3000);

		//Check if Basic node types are present
		//Check person node is in filter list
		expect(browser.isExisting("#perso")).to.be.true;
		//Institution
		expect(browser.isExisting("#insti")).to.be.true;
		//Question
		expect(browser.isExisting("#questi")).to.be.true;
		//Topic
		expect(browser.isExisting("#topi")).to.be.true;
		//Publication
		expect(browser.isExisting("#publi")).to.be.true;
		//Data
		expect(browser.isExisting("#data")).to.be.true;
		//Project
		expect(browser.isExisting("#proje")).to.be.true;

		//Close the filter menu
		browser.click('#filter');

	    });

	it('should find the reset button', function(){
		expect(browser.isExisting("#reset")).to.be.true;
	    });

	it('should find the about button', function(){
		expect(browser.isExisting("#about")).to.be.true;
	    });
	it('should test that a link to NKN is on the about section', function(){
		//Click on the About button
		browser.click('#about');
		browser.waitForVisible("#about-content", 2000);
		//Check if Link to NKN is in section
		expect(browser.getAttribute("#nkn-link", "href")).to.equal('https://www.northwestknowledge.net/');

		//Test if link to NKN's search page is present in about section
		expect(browser.getAttribute("#nkn-repo-link", "href")).to.equal('https://www.northwestknowledge.net/data-search');
	    });
    });

describe("Test full screen button", function(){
	it('should click the fullscreen button, and switch to full screen', function(){
		expect(browser.isExisting("#full-screen")).to.be.true;

		//Fullscreen doesn't work in Chrome Headless. Can test for fullscreen in non-headless Chrome.
		//Must be commented out for Jenkins tests

		/*		
		browser.click("#full-screen");
		browser.waitForVisible("#cy", 2000);

		let fullscreen = browser.execute('return document.webkitIsFullScreen;').value;
		console.log("Printing fullscreen: ");
		console.log(fullscreen);
		expect(fullscreen).to.be.true;
		*/
	    });
    });


//Shut down Chromedriver and close browser
chromedriver.stop();
browser.end();

