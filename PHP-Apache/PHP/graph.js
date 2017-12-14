$(function(){
	
  var host = "https://datamap.nkn.uidaho.edu";
  var layoutPadding = 50;
  //Animation duration
  var aniDur = 500;
  var easing = 'linear';
  //Variable to track what year the graph is showing data for
  var currentYear = "2014";
  //The graph
  var cy;

  //When we click on nodes, and keep clicking on them, more nodes will be added to the 
  //set visible in the new layout in the middle of the graph. We need an object to interface
  //with Cytoscape.js functionality to hold those nodes. 
  var completeSelection = {};

  //these two variables keep lists of possible nodes and edges for the faceted search system
  var facetedNodeList = [];
  var facetedEdgeList = [];

  //This is the list of discrete node attribute types.
  var nodeAttributeList = [];

  //The last search term used. 
  var lastSearch = '';

  // get exported json from cytoscape desktop via ajax
  var graphP = $.ajax({
    url: host + '/results.json',
    type: 'GET',
    dataType: 'json'
  });

  // also get style via ajax
  var styleP = $.ajax({
    url: host + '/style.json', 
    type: 'GET',
    dataType: 'text'
  });

  //Load the database schema data too
  $.ajax({
	  url: host + '/schema.json', 
	      type: 'GET',
	      dataType: 'json'
	      , success: function(data){
	  setupFacetedSearch(data);
   }});

  /** Set the current year the graph is showing
   * @param {string} year
   */
  function setCurrentYear(year){
	if(typeof year === 'string')
		currentYear = year;
	else
		console.log("Error: you tried to set current year to non-number value.");
  }	

  /** 
   * Get the current year the graph is showing
   * @return {string} currentYear  The jQuery double slider can use a year range in the
   * form of "startYear:endYear". We are storing this here.
   */
  function getCurrentYear(){
	return currentYear;	
  }

  /** 
   * Get all of the currently selected nodes. If a user keeps clicking on nodes, they will be 
   *  added in to a Cytoscape collection of selected nodes, which will be highlighted.
   *  @return {object} completeSelection
   */
  function getCompleteSelection(){
      return completeSelection;
  }

  /**
   * Set the list of nodes selected. 
   * @param {object} collection
   */
  function setCompleteSelection(collection){
      completeSelection = collection;
  }

  /**
   *  Reset object that contains all "selected" nodes.
   */
  function resetCompleteSelection(){
      completeSelection = {};
  }

  /**
   *  Get the object with all the nodes
   *
   */
  function getFacetedNodeList() { return facetedNodeList; }
  
  function setFacetedNodeList(array){
      if(Array.isArray(array))
	  facetedNodeList = array;
      else
	  console.log("Error: tried to set array to non-array value.");
  }
  
  function getFacetedEdgeList() { return facetedEdgeList; }
  function setFacetedEdgeList(array){
      if(Array.isArray(array))
	  facetedEdgeList = array;
      else
	  console.log("Error: tried to set array to non-array value.");
  }

  function getNodeAttributeList() { return nodeAttributeList; }
  function setNodeAttributeList(array){
      if(Array.isArray(array))
	  nodeAttributeList = array;
      else
	  console.log("Error: tried to set array to non-array value.");
  }

  /* Make a new function in the Handlebars.js infowindow system so we can create our own <a> tags with custom
   * links to DOI or other URL's. Needed to interface with info window popup when the user hovers over a
   * node and that node's data appears in the info window. 
   */
  Handlebars.registerHelper('makeDoiLink', function(link) {
	  //Return concatination of "https://doi.org/" and everything after colon in doi:1234/56789 DOI format to construct url
	  if((typeof link === 'string')
	     || (typeof link === 'boolean')
	     || (typeof link === 'number')){
	      
	      var doiIdentifier = "doi:";
	      var doiStartIndex = link.indexOf(doiIdentifier);
	      if(doiStartIndex > -1){
		  return "https://doi.org/" + link.substring(doiStartIndex + doiIdentifier.length);
	      }
	      return link;
	  }
	  return "";
  });

  /* Template for the info window that shows the node's data when hovered over, or a node is clicked
   * and we want to display the node's data, or the jQuery system is doing it's typeahead matching.
   */
  var infoTemplate = Handlebars.compile([
    '<p class="ac-node-type"><i class="fa fa-info-circle"></i>{{#if type}}{{type}}{{/if}}</p>',
    '{{#if dscQues}}<p class="question-node">{{dscQues}}<br>End Year: {{yrEnd}}<br>iseed: {{iseed}}</p>{{/if}}',
    '{{#if title}}<p class="publication-node"> {{title}}<br> Journal: {{journal}}<br> {{#if doi}}<a href="{{makeDoiLink doi}}" target="_blank">Link to source</a>{{/if}}</p>{{/if}}',
    '{{#if Person}}<p class="ac-country"> {{Country}}</p>{{/if}}',
    '{{#if dscTopic}}<p class="topic-node">{{dscTopic}}</p>{{/if}}',
    '{{#if dscSubtopic}}<p class="subtopic-node"> {{dscSubtopic}}</p>{{/if}}',
    '{{#if namProj}}<p class="project-node"> {{namProj}}</p>{{/if}}',
    '{{#if dscMeth}}<p class="method-node"> {{dscmeth}}</p>{{/if}}',
    '{{#if namLoc}}<p class="location-node"> {{namLoc}}</p>{{/if}}',
    '{{#if dscEcoS}}<p class="ecosystem-service-node"> {{namEcoS}} <br> Description:<br> {{dscEcoS}}</p>{{/if}}',
    '{{#if namMngr}}<p class="data-source-node"> {{namMngr}}</p>{{/if}}',
    '{{#if namRepo}}<p class="repository-node"> {{namRepo}}</p>{{/if}}',
    '{{#if namData}}<p class="data-node"> {{namData}} <br> Start year: {{yrStart}} <br> End year: {{yrEnd}} <br> {{#if doi}}<a href="{{makeDoiLink doi}}" target="_blank">Link to source</a>{{/if}}</p>{{/if}}',
    '{{#if dscClass}}<p class="class-node"> {{dscClass}}</p>{{/if}}',
    '{{#if dscStatus}}<p class="status-node"> {{dscStatus}}</p>{{/if}}',
    '{{#if dscUmb}}<p class="umbrella-node"> {{namUmb}}<br> Description: <br> {{dscUmb}}</p>{{/if}}',
    '{{#if namTheme}}<p class="namTheme-node"> {{namTheme}}<br>Description: {{dscTheme}}</p>{{/if}}',
    '{{#if name}}<p class="person-institution-department-role-node"> {{name}}</p>{{/if}}',
    '{{#if email}}<p class="person-institution-department-role-node">Specialty: {{speciality}}<br>Email: {{email}}</p>{{/if}}'
  ].join(''));

  // when both graph export json and style loaded, init cy
  Promise.all([ graphP, styleP ]).then(initCy);

  var allNodes = null;
  var allEles = null;
  var lastHighlighted = null;
  var lastUnhighlighted = null;

  /**
   *  Create a promise where a fade animation is playing
   *  @param {object} ele  The element to fade.
   *  @param {string} opacity  The opacity to set the style to.
   */
  function getFadePromise( ele, opacity ){
    return ele.animation({
      style: { 'opacity': opacity },
      duration: aniDur
    }).play().promise();
  };

  /**
   *  After a node is "unselected" by clicking off of it after it has been "selected" by clicking on it,
   *  move it back to its original position.
   *  @param {object} nhood  The "neighborhood" of the node, or all nodes that are connected to it via one relation.
   *  @return {promise} 
   */
  var restoreElesPositions = function( nhood ){
    return Promise.all( nhood.map(function( ele ){
      var p = ele.data('orgPos');

      return ele.animation({
        position: { x: p.x, y: p.y },
        duration: aniDur,
        easing: easing
      }).play().promise();
    }) );
  };

  /**
   *  Highlight one node by applying the "hidden" class to all nodes except the one node and 
   *  nodes in it's neighborhood.
   *  @param {object} node
   *  @return {promise} 
   */
  function highlight( node ){

    var oldNhood = lastHighlighted;

    var nhood = lastHighlighted = node.closedNeighborhood();
    var others = lastUnhighlighted = cy.elements().not( nhood );
 
    var reset = function(){
      cy.batch(function(){
        others.addClass('hidden');
        nhood.removeClass('hidden');

        allEles.removeClass('faded highlighted');

        nhood.addClass('highlighted');

        others.nodes().forEach(function(n){
          var p = n.data('orgPos');

          n.position({ x: p.x, y: p.y });
        });
      });

      return Promise.resolve().then(function(){
        if( isDirty() ){
          return fit();
        } else {
          return Promise.resolve();
        };
      }).then(function(){
        return Promise.delay( aniDur );
      });
    };

    /**
     *  Reorganize the selected nodes in to the COSE-Bilkent (physics based "spyder web" layout)
     *  @return {promise} promise
     */
    var runLayout = function(){
      var p = node.data('orgPos');

      var l = nhood.filter(':visible').makeLayout(createCoseLayout());

      var promise = cy.promiseOn('layoutstop');

      l.run();

      return promise;
    };

    /**
     *  Fit the selected nodes in to the view frame
     *  @return {object} 
     */
    var fit = function(){
      return cy.animation({
        fit: {
          eles: nhood.filter(':visible'),
          padding: layoutPadding
        },
        easing: easing,
        duration: aniDur
      }).play().promise();
    };

    /**
     *  Remove the "hidden" style and add the "faded" style for background nodes to appear 
     *  mostly transparent, but still visible.
     *  @return {promise} 
     */
    var showOthersFaded = function(){
      return Promise.delay( 250 ).then(function(){
        cy.batch(function(){
          others.removeClass('hidden').addClass('faded');
        });
      });
    };

    return Promise.resolve()
      .then( reset )
      .then( runLayout )
      .then( fit )
      .then( showOthersFaded );
  }

  /**
   *  Reset the graph so all nodes go to their original positions, and all nodes are visible.
   *  We need to set this event listener on the graph every time a new set of nodes is selected so if somewhere on the graph is
   *  clicked that is not the "selected" nodes, the graph resets. 
   */
  function resetGraph(){
      //"select" the matched nodes so we can fire the unselect event handler when they are unselected, and reset the graph
      cy.on('click', function(e){
	      if(typeof e.cyTarget._private.data === 'undefined'){
		  hideNodeInfo();
		  clear();
		  resetCompleteSelection(); 
	      }
	  });
  }

  /**
   *  Return a large object that has attributes known by the Cytoscape.js library to set up the nodes in a 
   *  physics-type layout that tries to keep nodes from overlapping each other, but still somewhat close together.
   *  @return {object}
   */
  function createCoseLayout(){

      return {
	  name: 'cose-bilkent', 
	      // Called on `layoutready`
	      ready: function () {
	      },
	      // Called on `layoutstop`
	      stop: function () {
	      },
	      // number of ticks per frame; higher is faster but more jerky
	      refresh: 30, 
	      // Whether to fit the network view after when done
	      fit: true,
	      // Padding on fit
	      padding: layoutPadding,
	      // Whether to enable incremental mode
	      randomize: true,
	      // Node repulsion (non overlapping) multiplier
	      nodeRepulsion: 450000,
	      // Ideal edge (non nested) length
	      idealEdgeLength: 100,
	      // Divisor to compute edge forces
	      edgeElasticity: 0.15,
	      // Nesting factor (multiplier) to compute ideal edge length for nested edges
	      nestingFactor: 0.1,
	      // Gravity force (constant)
	      gravity: 0.25,
	      // Maximum number of iterations to perform
	      numIter: 2,
	      // For enabling tiling
	      tile: true,
	      // Type of layout animation. The option set is {'during', 'end', false}
	      animate: 'end',
	      // Represents the amount of the vertical space to put between the zero degree members during the tiling operation(can also be a function)
	      tilingPaddingVertical: 10,
	      // Represents the amount of the horizontal space to put between the zero degree members during the tiling operation(can also be a function)
	      tilingPaddingHorizontal: 10,
	      // Gravity range (constant) for compounds
	      gravityRangeCompound: 1.5,
	      // Gravity force (constant) for compounds
	      gravityCompound: 1.0,
	      // Gravity range (constant)
	      gravityRange: 3.8,
	      // Initial cooling factor for incremental layout
	      initialEnergyOnIncremental:0.8
	  };
  }

  /**
   *  Highlight the path, which are nodes and relations (edges), by selecting them with Cytoscape.js selectors, then applying 
   *  the faded Cytoscape.js style to nodes not in the path. Then, trigger the layout creation function which sets the 
   *  selected nodes in to the Cose-Bilkent layout.
   *  @param {object} path
   */
  function highlightPath( path ){
    var nhood = path;

    lastHighlighted = path;
    lastUnhighlighted = cy.elements().not( path );


    cy.batch(function(){
      if(nhood.length > 0){

	      cy.elements().not( nhood ).removeClass('highlighted').addClass('faded');
	      nhood.removeClass('faded').addClass('highlighted');

	      cy.stop().animate({
        	fit: {
	          eles: cy.elements(),
        	  padding: layoutPadding
	        }
	      }, {
	       duration: aniDur
	      }).delay( aniDur, function(){
		      nhood.layout(createCoseLayout());
		  } );
	}
    });
  }

  /**
   *  Hihghlight set of nodes, but not any relations. Used for when one node type is searched on, and they do not have 
   *  any relations between them.
   *  @param {object} nodeList
   */
  function highlightNode(nodeList){
    var nhood = nodeList;

    lastHighlighted = nodeList;
    lastUnhighlighted = cy.elements().not( nodeList );


    cy.batch(function(){
      if(nhood.length > 0){

	      cy.elements().not( nhood ).removeClass('highlighted').addClass('faded');
	      nhood.removeClass('faded').addClass('highlighted');

	      cy.stop().animate({
        	fit: {
	          eles: cy.elements(),
        	  padding: layoutPadding
	        }
	      }, {
	       duration: aniDur
	      }).delay( aniDur, function(){
		      nhood.layout(makeConcentricLayout());
		  } );
	}
    });
  }

  /** This layout is used for queries with one node in them. This way, the cose-bilkent function
   *  does not get stuck processing forever because of missing relations between edges that are 
   *  never returned with queries like this. 
   *  @return {object}
   */
  function makeConcentricLayout(){
      return {
	  name: 'concentric',

	      fit: true, // whether to fit the viewport to the graph
	      padding: 30, // the padding on fit
	      startAngle: 3 / 2 * Math.PI, // where nodes start in radians
	      sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
	      clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
	      equidistant: false, // whether levels have an equal radial distance betwen them, may cause bounding box overflow
	      minNodeSpacing: 10, // min spacing between outside of nodes (used for radius adjustment)
	      boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
	      avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
	      nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
	      height: undefined, // height of layout area (overrides container height)
	      width: undefined, // width of layout area (overrides container width)
	      spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
	      concentric: function( node ){ // returns numeric value for each node, placing higher nodes in levels towards the centre
	          return node.degree();
	      },
	      levelWidth: function( nodes ){ // the letiation of concentric values in each level
	          return nodes.maxDegree() / 4;
	      },
	      animate: false, // whether to transition the node positions
	      animationDuration: 500, // duration of animation in ms if enabled
	      animationEasing: undefined, // easing of animation if enabled
	      animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
	      ready: undefined, // callback on layoutready
	      stop: undefined, // callback on layoutstop
	      transform: function (node, position ){ return position; } // transform a given node position. Useful for changing flow direction in discrete layouts 
      }
  }

  /**
   *  Shows if the last graph operation was a node selection.
   *  @return {boolean}
   */
  function isDirty(){
    return lastHighlighted != null;
  }

  /**
   *  Reset graph to original condition.
   *  @param {object} opts  
   *  @return {promise}
   */
  function clear( opts ){
      if( !isDirty() ){ return Promise.resolve(); }
      
      opts = $.extend({
	      
	  }, opts);
      
      cy.stop();
      allNodes.stop();
      
      var nhood = lastHighlighted;
      var others = lastUnhighlighted;
      
      lastHighlighted = lastUnhighlighted = null;
      
      var hideOthers = function(){
	  return Promise.delay( 125 ).then(function(){
		  others.addClass('hidden');
		  
		  return Promise.delay( 125 );
	      });
      };
      
      var showOthers = function(){
	  cy.batch(function(){
		  allEles.removeClass('hidden').removeClass('faded');
	      });
	  
	  return Promise.delay( aniDur );
      };

      var restorePositions = function(){
	  cy.batch(function(){
		  others.nodes().forEach(function( n ){
			  var p = n.data('orgPos');
			  
			  n.position({ x: p.x, y: p.y });
		      });
	      });
	  
	  return restoreElesPositions( nhood.nodes() );
      };
      
      var resetHighlight = function(){
	  nhood.removeClass('highlighted');
      };
      
      return Promise.resolve()
	  .then( resetHighlight )
	  .then( hideOthers )
	  .then( restorePositions )
	  .then( showOthers );
  }

  /**
   *  Show the node's data in the #info element in the info window
   *  @param {object} node
   */
  function showNodeInfo( node ){
    $('#info').html( infoTemplate( node.data() ) ).show();
  }

  /**
   *  Hide the node info window
   */
  function hideNodeInfo(){
    $('#info').hide();
  }

  /**
   *  Initialize the HTML5 canvas with some default settings. Load the nodes from the JSON files downloaded from the web server. 
   *  Also, download the database's schema representation in JSON format for use with the faceted search functionality.
   *  @param {promise[]} then
   */
  function initCy(then ){
    var loading = document.getElementById('loading');
    var expJson = then[0];
    var styleJson = then[1];
    var elements = expJson.elements;

    elements.nodes.forEach(function(n){
      var data = n.data;

      data.NodeTypeFormatted = data.NodeType;

      n.data.orgPos = {
        x: n.position.x,
        y: n.position.y
      };
    });

    cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      layout: { name: 'preset', padding: layoutPadding },
      style: styleJson,
      elements: elements,
      motionBlur: true,
      selectionType: 'single',
      boxSelectionEnabled: false,
    });
    
    loading.classList.add('loaded');
    //Get the year span that the MILES project ran. 
    filterYears(getCurrentYear());

	/* Find shortest path in graph between specified nodes and select nodes and relations in path (by putting them in a concentric circle and fading out nodes and
	 * relations not in path
	 */
	$("#search-shortest-path").on("click", function(){
		//Reset the list of selected nodes before searching for the new path
		resetCompleteSelection(); 
		var searchTextList = [];
		var nodeTypeList = [];
	        var nodeSearchSelectors = [];
		var paths = [];
		var totalNhood; 
		var searchInputCount = $("input.node-search-input:not(.tt-hint)").length;
		resetCompleteSelection();

	        for(var i = 1; i <= searchInputCount; i++){
			var searchText = $("#search-input-" + i).typeahead('val');
			//Sanitize user input for special characters. 
			var regex = /[\[\]\"]/g;
			searchText = searchText.replace(regex, ''); 
			searchTextList.push(searchText);
			var nodeType = $("#query-node-" + i).val();
			nodeTypeList.push(nodeType);

			if(searchText == ''){
			    nodeSearchSelectors.push("node[type = '" + nodeType + "']");
			}else{
			    nodeSearchSelectors.push("node[node_label @*= '" + searchText + "'][type = '" + nodeType + "']");
			}
		}

		var neighborhoods = [];
		
		//Loop over pairs of form inputs and use node type and user input to query Cytoscape graph API to get search results
		for(var a = 0; a < searchInputCount-1; a++){
		    //Get nodes that meet search input and node type that are one relation away from each other
		    var nhood = cy.elements(nodeSearchSelectors[a]).closedNeighborhood(nodeSearchSelectors[a] + ", " + nodeSearchSelectors[a+1]);
		    //Get edges that connect the returned nodes
		    var edges = cy.elements(nodeSearchSelectors[a]).edgesWith(nodeSearchSelectors[a+1]);
		    
		    //Merge the nodes and edges into one collection object
		    var connectedNodes = edges.connectedNodes(nhood);
		    var totalCollection = connectedNodes.union(edges);
		    
		    //Push this search result on to list
		    neighborhoods.push(totalCollection);
		}

		/**
		 *   Combine all neighborhoods together to create complete search query. 
		 *   All elements of list are for search results of a pair of text inputs.
		 *   EX: neighborhoods[0] is results from the first and second form text inputs. 
		 */
		if(neighborhoods.length == 0){
		    var neighborhood = cy.elements(nodeSearchSelectors[a]).closedNeighborhood();

		    //"select" the matched nodes so we can fire the unselect event handler when they are unselected, and reset the graph
		    highlightNode(cy.elements(nodeSearchSelectors[0]));
		    
		    //Make event listener that resets the graph when something other than one of the selected nodes is clicked.
		    resetGraph();

		}
		//For searches of two nodes
		else if(neighborhoods.length == 1){
		    //Get the nodes that intersect with everything (but not the start or end nodes)
		    var totalNhood = neighborhoods[0];
		    //Get the edges from those intersection nodes 
		    edges = totalNhood.edgesWith(nodeSearchSelectors[1]);
		    //Get the nodes that connect to those edges
		    connectedNodes = edges.connectedNodes(totalNhood);
		    /*  Now, if we union these three together, we have ONLY the start node(s), end node(s), and the middle nodes with connecting edges,
		     *  and NOT their neighborhoods too.
		     */
		    totalNhood = totalNhood.union(connectedNodes);
		    totalNhood = totalNhood.union(edges);

		    highlightPath(totalNhood);
		    setCompleteSelection(totalNhood);

		    //"select" the matched nodes so we can fire the unselect event handler when they are unselected, and reset the graph
		    resetGraph();
		}
		//For searches three nodes
		else if(neighborhoods.length == 2){
		    //Get the nodes that intersect with everything (but not the start or end nodes)
		    var totalNhood = neighborhoods[0].intersection(neighborhoods[1]);
		    //Get the edges from those intersection nodes 
		    edges = totalNhood.edgesWith(nodeSearchSelectors[0] + ", " + nodeSearchSelectors[2]);
		    //Get the nodes that connect to those edges
		    connectedNodes = edges.connectedNodes(totalNhood);
		    /*  Now, if we union these three together, we have ONLY the start node(s), end node(s), and the middle nodes with connecting edges,
		     *  and NOT their neighborhoods too.
		     */
		    totalNhood = totalNhood.union(connectedNodes);
		    totalNhood = totalNhood.union(edges);

		    highlightPath(totalNhood);
		    setCompleteSelection(totalNhood);

		    //"select" the matched nodes so we can fire the unselect event handler when they are unselected, and reset the graph
		    resetGraph();

		    /*
		    postData = {};
		    
		    //Construct JSON object to send with POST request to MongoDB 
		    //These lists should be the same length, but just in case, check to make sure objects exist at each index
		    for(var i = 0; i < searchTextList.length; i++){
			if(typeof searchTextList[i] !== 'undefined'){
			    console.log(searchTextList[i]);
			    postData["searchTerm" + (i+1)] = searchTextList[i];
			}
			if(typeof nodeTypeList[i] !== 'undefined'){
			    postData["nodeType" + (i+1)] = nodeTypeList[i];
			    console.log(nodeTypeList[i]);
			}
		    }
		    
		    //Adding currently selected years to POST
		    var yearSlider = $("#year-slider").slider({});  
		    var years = yearSlider.slider('getValue');   
		    postData["startYear"] = years[0].toString(); 
		    postData["endYear"] = years[1].toString();
		    
		    //Save search terms in database for later usage analysis
		    $.post("http://localhost:3005/database/data", postData, "json").success(function(data){
			    console.log("Success!");
			});			
		    */
		}			
	    });
	

    allNodes = cy.nodes();
    allEles = cy.elements();

    cy.on('free', 'node', function( e ){
	
      var n = e.cyTarget;
      var p = n.position();

      n.data('orgPos', {
        x: p.x,
        y: p.y
      });
    });

    cy.on('tap', function(evt){
      $('#search-input-1').blur();
    });

    /**
     *  When a node is selected or unselected in the graph, then get that node along with it's neighborhood
     *  (nodes connected to selected node by one relation). However, if node have already been selected, and 
     *  a user clicks on one of the neighborhood nodes, add that nodes neighborhood to the list of selected
     *  nodes too.
     */
    cy.on('select unselect', 'node', _.debounce( function(e){
      var node = cy.$('node:selected');
      var neighborhood = node.closedNeighborhood();
      var selectedNodeId = node.id();
      if( node.nonempty() ){
        showNodeInfo( node );
      
        Promise.resolve().then(function(){
		//If a node has already been selected or search results have already been rendered, and the 
		//user clicks on one of the search result nodes, that node's neighborhood will be added to 
		//object that keeps track of all selected nodes. We have to do a union with the currently 
		//selected nodes with the clicked on node's neighborhood nodes. 
		if(!jQuery.isEmptyObject(getCompleteSelection())){
		    var extra = cy.$("#" + selectedNodeId).closedNeighborhood();
		    setCompleteSelection(extra.union(getCompleteSelection()));
		    return highlightPath(getCompleteSelection());
		}
		//Else, this is the first selection because the graph was in the original state (no nodes were selected
		//before this), and we have to reset the list of selected nodes.
		else{
		    
		    setCompleteSelection(neighborhood);
		    return highlightPath(getCompleteSelection());
		}
        });
      } 
      //Else, what has been selected is not a node, which means the user clicked on the background, and they want to reset
      //the graph. So reset the graph.
      else {
        hideNodeInfo();
        clear();

	//Reset completeSelection to empty object
	resetCompleteSelection();
      }

    }, 100 ) );

    cy.on('mouseover', 'node', function(e){
	  var node = e.cyTarget;
	  showNodeInfo(node);
    });
  }
  
  createTypeahead(1);

  /**
   *  Create the list of node data that appears when the user starts typing. minLength controls after how many
   *  characters are typed the list appears.
   *  We had to modularize this event listener in an encompasing function because we have to add a new event listener
   *  every time a new section of the search system is added. So each node's search text box has it's own event
   *  listener when it's added to the DOM.
   *  @param {number} index
   */
   function createTypeahead(index){

       $('#search-input-' + index).typeahead({
	       
	       minLength: 2,
		   highlight: true,
		   cancelButton: true,
		   blurOnTab: false,
		   searchOnFocus: true,
		   destroy: false,
		   },
	   {
	       name: 'search-dataset',
		   source: function( query, cb ){
		   function matches( str, q ){
		       if((typeof str === 'number')
			  || (typeof str === 'boolean'))
			   str = str.toString();
		       if((typeof q === 'number')
			  || (typeof q === 'boolean'))
			   q = q.toString();
		       
		       str = (str || '').toLowerCase();
		       q = (q || '').toLowerCase();
		       
		       return str.match( q );
		   }
		   
		   var fields = [];
		   
		   var queryNode = $("#query-node-" + index).val();
		   //Get the list of attributes for the selected node type if it exists in the schema
		   if(Object.keys(getNodeAttributeList()).indexOf(queryNode, 0) > -1)
		       fields = getNodeAttributeList()[queryNode];
		   
		   /**
		    *  Check any of the fields of a node matches the search input by the user
		    *  @param {object} node
		    *  @return {boolean}
		    */
		   function anyFieldMatches( node ){
		       var field;
		       for( let i = 0, x = fields.length; i < x; i++){
			   field = fields[i];
			   
			   if( matches( node.data(field), query ) ){
			       return true;
			   }
		       }
		       
		       return false;
		   }

		   /**
		    *  Return a node's data
		    *  @param {object} n
		    *  @return {object} data
		    */
		   function getData(n){
		       var data = n.data();
		       
		       return data;
		   }
		   
		   /**
		    *  Sort 2 names alphabetically. If the first one is earlier in the alphabet, then return -1,
		    *  else if the first one is later in the alphabet, then return 1
		    *  @param {object} node1
		    *  @param {object} node2
		    *  @return {number}
		    */
		   function sortByName(node1, node2){
		       if( node1.data('name') < node2.data('name') ){
			   return -1;
		       } else if( node1.data('name') > node2.data('name') ){
			   return 1;
		       }
		       
		       return 0;
		   }
		   //Create the response, which is searching all nodes if they match the text being typed, and sort by Node type, and return
		   //the nodes' data. 
		   var res = allNodes.stdFilter( anyFieldMatches ).sort( sortByName ).map( getData );
		   
		   cb( res );
	       },
		   templates: {
   		       suggestion: infoTemplate
		   }
	   })
	   /* If a typeahead box is clicked on, then select that node in the graph
	    */
	   .on('typeahead:selected', function(e, entry, dataset){
		   var nodeTextInputCount = $("input.node-search-input:not(.tt-hint)").length;
		   
		   //Reset the lists of currently selected nodes
		   resetCompleteSelection();
		   
		   if(nodeTextInputCount == 1){
		       var n = cy.getElementById(entry.id);
		       
		       cy.batch(function(){
			       allNodes.unselect();
			       
			       n.select();
			   });
		       showNodeInfo( n );
		   }
		   //Put text of selected node into search box
		   if(entry.node_label.length > 0)
		       $("#search-input-" + index).typeahead('val', entry.node_label);
		   
		   
	       })
	   /**
	    *  When a new key is typed, then scroll to the top of the list of node data
	    */
	   .on('keydown keypress keyup change', _.debounce(function(e){
			   var thisSearch = $(this).typeahead('val');
			   
			   if( thisSearch !== lastSearch ){
			       $('.tt-dropdown-menu').scrollTop(0);
			       
			       lastSearch = thisSearch;
			   }
		       }, 50));
   }
   

   /**
    *  When the reset button is clicked, put the graph in the original state. Move all nodes back 
    *  to their original position, and unhide and un-fade nodes.
    */
   $('#reset').on('click', function(){
	   if( isDirty() ){
	       clear();
	   } else {
	       allNodes.unselect();
	       
	       hideNodeInfo();
	       
	       cy.stop();
	       
	       cy.animation({
		       fit: {
			   eles: cy.elements(),
			       padding: layoutPadding
			       },
			   duration: aniDur,
			   easing: easing
			   }).play();
	   }
       });
   
   //Initialize slider on year-slider element
   var yearSlider = $("#year-slider").slider({});

   /**
    *  Filter the nodes (make them transparent) that are not in the year range specified in the "years" string. 
    *  @param {string} years
    */
   function filterYears(years){
      /** Only execute following code if the years array is of length 2. Don't need to access any null values here. 
       *  An array of length not equal to 2 should not happen, but it's best to check anyway. 
       */
      if(years.length == 2){
	  //Set the current year selection display 
	  $("#current-year-display").text(years[0] + " : " + years[1]);
	  
	  //Reset previously filtered nodes of type Person, Data, Publication, and Question to visible by removing the "filtered" class
	  var elements = cy.nodes('node[type = "Person"], node[type = "Data"], node[type = "Publication"], node[type = "Question"]');
	  elements.removeClass('timeline-filtered');

	  //Set values in this array to local variables to make code more readable (and logic easier to understand). 
	  var startYear = years[0];
	  var endYear = years[1];
	  
	  //Filter the Publication nodes that are not in the year range specified by the year range selector
	  var publicationNodes = cy.nodes('node[type = "Publication"][yrPub < ' + startYear + '], node[type = "Publication"][yrPub > '+ endYear + ']' );
	  publicationNodes.addClass('timeline-filtered');
	  
	  //Filter the Data and Question nodes that are not in the year range specified by the year range selector
	  var dataOrQuestionElements = cy.nodes('node[type = "Data"][yrEnd < ' + startYear + '], node[type = "Data"][yrStart > ' + endYear + '], node[type = "Question"][yrEnd < ' + startYear + '], node[type = "Question"][yrStart > ' + endYear + ']');
	  dataOrQuestionElements.addClass('timeline-filtered');
	  
	  //Get the year specified in the year selection slider bar and filter people based on what year they held a role (based on relations between Role and Person nodes).
	  var allPeopleRoleRelationships = cy.edges('edge[type = "is_a"][yrStart > ' + endYear + '], edge[type = "is_a"][yrEnd < ' + startYear + ']');
	//Get all Person nodes that are connected to the returned edges
	  var peopleNodeFilterList = allPeopleRoleRelationships.connectedNodes('node[type = "Person"]');
	  //Now add the "filtered" class to the Person nodes that are not in the year range specified in the HTML slider. 
	  peopleNodeFilterList.addClass('timeline-filtered');
	  
      }else
	  console.log("Error: year range is not length 2.");
  }
  
   /**
    *  When year slider is changed in user interface, then change the currently year displayed in html 
    */
  $("#year-slider").on('change', function(){

	  var years = yearSlider.slider('getValue');
	  filterYears(years);
  });

  /**
   *  When and of the the checkboxes in the filters menu are changed,
   *  find the corresponding nodes in the graph and filter them (make transparent).
   */
  $('#filters').on('change', 'input', function(){

    var person = $('#perso').is(':checked');
    var manager = $('#mana').is(':checked');
    var department= $('#depa').is(':checked');
    var institution = $('#insti').is(':checked');
    var data = $('#data').is(':checked');
    var src = $('#src').is(':checked');
    var method = $('#metho').is(':checked');
    var cLass = $('#cla').is(':checked');

    var umbrella = $('#umbr').is(':checked');
    var theme = $('#theme').is(':checked');
    var topic = $('#topi').is(':checked');
    var subtopic = $('#subtopic').is(':checked');
    var question = $('#questi').is(':checked');
    var publication = $('#publi').is(':checked');

    var ecoservice = $('#ecos').is(':checked');
    var project = $('#proje').is(':checked');
    var role = $('#role').is(':checked');
    var status = $('#statu').is(':checked');
    var location = $('#loca').is(':checked');

    var repository = $('#repo').is(':checked');
    var datasource = $('#src').is(':checked');
    
    //Loop though all nodes and find the nodes of type that were changed. 
    cy.batch(function(){
	    
      allNodes.forEach(function( n ){
          var type = n.data('type');
          n.removeClass('filtered');
          var filter = function(){
            n.addClass('filtered');
          };
        if(
             ( type === 'Person' && !person )
          	|| ( type === 'Manager' && !manager )
       	        || ( type === 'Department' && !department )
      		|| ( type === 'Institution' && !institution )
      		|| ( type === 'Data' && !data )
      		|| ( type === 'Method' && !method)
      		|| ( type === 'Data Type' && !cLass )
      		|| ( type === 'Proposal Objective' && !umbrella )
      		|| ( type === 'Research Theme' && !theme )
      		|| ( type === 'Topic' && !topic )
      		|| ( type === 'Subtopic' && !subtopic )
      		|| ( type === 'Question' && !question )
      		|| ( type === 'Publication' && !publication )
      		|| ( type === 'Ecosystem Service' && !ecoservice )
      		|| ( type === 'Project' && !project )
      		|| ( type === 'Role' && !role )
      		|| ( type === 'Status' && !status )
     	 	|| ( type === 'Location' && !location )
      		|| ( type === 'Data Repository' && !repository )
      		|| ( type === 'Data Source' && !datasource )
          ){
        		 filter();
        	 }

        });

      });

    });

  /**
   *  When the document is first loaded (DOM is finished loading), create an event listener that looks for nodes of 
   *  predefined grouping. If any of the parent nodes are unselected, then all of their children are unselected too
   */
  $(document).ready(function() {
    $("input[type='checkbox']").change(function() {
      $(this).siblings('ul').find("input[type='checkbox']").attr('checked', this.checked);
    });

    $("input[type='checkbox'] ~ ul input[type='checkbox']").change(function() {
      $(this).closest("li:has(li)").children("input[type='checkbox']").attr('checked', $(this).closest('ul').find("input[type='checkbox']").is(':checked'));
    });

  });

  /**
   *  When the filter button is clicked, then show the filter menu.
   */
  $('#filter').qtip({
    position: {
      my: 'top center',
      at: 'bottom center',
      adjust: {
        method: 'shift'
      },
      viewport: true
    },

    show: {
      event: 'click'
    },

    hide: {
      event: 'click'
    },
	      
    style: {
      classes: 'qtip-bootstrap qtip-filters',
      tip: {
        width: 16,
        height: 8
      }
    },

    content: $('#filters')
  });

  var numberOfSearchInputs = 1;
  
  /**
   *  Gets current number of nodes in query
   *  @return {number} numberOfSearchInputs
   */
   function getNumberOfSearchInputs(){
        return numberOfSearchInputs;
   }
   
   /**
    *  Increments number of nodes currently in search query
    */
   function incrementNumberOfSearchInputs(){
       numberOfSearchInputs++;
   }
   
   /**
    * Decrements number of nodes currently in search query. Will stop at 1
    */
   function decrementNumberOfSearchInputs(){
       numberOfSearchInputs--;
   }

   /**
    *  Add another select box with possible node types, and an input box to get user search text. Puts select-input 
    *  element pair after last select-input pair currently on page.
    */
   $("#add-form-input").on("click", function(){
	   //Limit the amount of node types we can search for
	   var max_search_nodes = 3;
	   if(getNumberOfSearchInputs() < max_search_nodes){
	       //Get list selectors of nodes already in page, and save the number of selectors present.
	       //Form control adds one extra input initially. Therefore we must offset our index by -1.
	       var index = $("input.node-search-input:not(.tt-hint)").length;
	       
	       //Construct HTML to insert into page by incrementing number used in descrete ID for new node based on
	       //number of sibling select elements in page.
	       var searchInput = makeSearchInput(index);
	       var nodeSelectDropdown = setPossibleNodes($("#query-node-" + index).val(), index);
	       
	       $(nodeSelectDropdown).insertAfter("#search-input-" + index);
	       //Put form input HTML element in DOM after last element of same type
	       $(searchInput).insertAfter("#query-node-" + (index+1));
	       //Increment variable that tracks how many current search inputs are on the page
	       incrementNumberOfSearchInputs();
	       
	       createTypeahead(index+1);
	       
	   }
       });

   /**
    *  This jQuery event listener removes the last node in the search sidebar when the button with ID "remove-node"
    *  is clicked. Also, it removes the arrow icon between the last node input int the search and the second to last
    *  search node input.
    */
   $("#remove-form-input").on("click", function(){
	   //Form control adds one extra input initially. Therefore we must offset our index by -1.
	   var min_search_inputs = 1;
	   
	   if(getNumberOfSearchInputs() > min_search_inputs){
	       //Get list selectors of nodes already in page, and save the number of selectors present.
	       var index = $("input.node-search-input:not(.tt-hint)").length;
	       
	       //Remove from DOM
	       $("#search-input-" + index).typeahead('destroy');
	       $("#search-input-" + index).remove();
	       $("#query-node-" + index).remove();
	       $("#search-box-line-" + index).remove();
	       decrementNumberOfSearchInputs();
	   }
       });

   /**
    *  Return an HTML form input in string format to insert into DOM
    *  @param {number} lastIndex  The index of the last search text input in total set of search inputs.
    *  @return {string}
    */
   function makeSearchInput(lastIndex){
       //Increment index to create a new ID for the new search text input
       lastIndex++;
       return "<input type=\"text\" class=\"form-control node-search-input\" id=\"search-input-" + lastIndex  + "\"></input>";
   }

   /**
    *  The nodes' ID's in the search sidebar are numerically indexed. For example, if there were two nodes in the query, then there would be div's with ID's
    *  "search-input-container-1" and "search-input-container-2" in the DOM. So everytime a new node is added to the query, the div in the page for the new
    *  node will have an ID with a number at the end of the string that is one more than the previous node's number. So, if a new node was added to the query
    *  by pressing the (+) button, then the new node would have an ID of "search-input-container-3" and be added after the last node's div in the sidebar.
    *  
    *  This function basically performs that string building and DOM insertion.
   */
   $(document).on("change", ".query-node-selector", function(e){

	   var id = $(this).attr('id');
	   var regex = /[0-9]+/g;
	   
	   //Cardinal number of search box is in element's id, so scrape out number to use as index
	   var index = parseInt(id.match(regex));
	   var nextNodeIndex = index + 1;
	   var nextNodeID = "#query-node-" + nextNodeIndex;
	   
	   //jQuery ID selector string for the div that surrounds the HTML select and text inputs for searching a node in the sidebar.
	   var nextSearchbarContainerID = "#query-node-" + nextNodeIndex;
	   
	   //jQuery ID selector string for the double ended arrow between node search boxes in sidebar
	   var arrowBetweenBoxesID = "#search-box-line-" + nextNodeIndex;
	   
	   //Get the value of the current node (the one who's select box was changed)
	   var nextNode = $(nextNodeID).val();
	   //Get the value of the next node's select box in the search sidebar
	   var thisNodeType = $("#query-node-" + index).val();
	   
	   //If there is another node in the search list after this one that is selected, then change the next node's list of possible nodes based on what the
	   //current one was changed to.
	   var count = nextNodeIndex;
	   
	   while($(nextSearchbarContainerID).length > 0){
	       
	       //Have to remove gliphicon of arrow between search node boxes because setPossibleNodes() will insert another arrow.
	       
	       $(arrowBetweenBoxesID).remove();
	       
	       var userInputGroup = setPossibleNodes(thisNodeType, index);
	       //$(nextSearchbarContainerID).replaceWith(setPossibleNodes(thisNodeType, index));
	       $(nextSearchbarContainerID).replaceWith(userInputGroup);
	       
	       //Increment the current node's index and the next node's index to make new selector strings.
	       nextNodeIndex++;
	       index++;
	       
	       //Make new strings for the jQuery ID selectors for the next node search box and arrow between boxes based on next number increment
	       nextSearchbarContainerID = "#query-node-" + nextNodeIndex;
	       arrowBetweenBoxesID = "#search-box-line-" + nextNodeIndex;
	       
	       thisNodeType = $("#query-node-" + index).val();
	   }
       });

	/**
	 *  In faceted node search system, we can only connect to nodes that are one relation away from the current node.
	 *  Therefore, there is a set list for each node type of what nodes it can connect to. This list is loaded from the database
	 *  when the updateScript.php file is run. 
	 *  @param {object} schema
	 */
	function setupFacetedSearch(schema){
	    //Nodes in database schema
	    var nodes = schema.nodes;
	    //Relations in database schema
	    var relations = schema.relations;
	    //Node attributes by node type in schema
	    var attributes = schema.nodeAttributes;

	    //A list of node types that one node can connect to.
	    var nodeOptions = [];
	    //A list of nodes that a specific relation type can connect to.
	    var relationOptions = [];
	    //A list of attributes by node type
	    var attributeOptions = [];

	    //Loop though nodes, and for each node type, insert the node type it can connect to in schema
	    nodes.forEach(function(node){
		    //If node does not yet exist, then put a new array in that element of nodeOptions list for 2D array.
		    if(Object.keys(nodeOptions).indexOf(node.source, 0) === -1){
			nodeOptions[node.source] = [];
		    }
		    nodeOptions[node.source].push(node.target);
		});
	    //Loop though relations, and for each relation type, insert the relation 
	    relations.forEach(function(relation){
		    //If the relation does not yet exist in the system, add a new empty array in that array element for 2D array.
		    if(Object.keys(relationOptions).indexOf(relation.source) === -1){
			relationOptions[relation.source] = [];
		    }
		    relationOptions[relation.source].push(relation.relation);
		});
	    //Make a list of attributes for each node type so the text search autocomplete knows what to search on. 
	    attributes.forEach(function(attribute){
		    //If the attribute does not exist for that node type yet, add an empty array at the element for 2D array. 
		    if(Object.keys(attributeOptions).indexOf(attribute.node) === -1){
			attributeOptions[attribute.node] = [];
		    }
		    //Loop though list of attributes and add all of them if they don't exist yet. 
		    attribute.attributeList.forEach(function(element){
			    if(attributeOptions[attribute.node].indexOf(element) === -1){
				attributeOptions[attribute.node].push(element);
			    }
			});
		});

	    setFacetedNodeList(nodeOptions);
	    setFacetedEdgeList(relationOptions);
	    setNodeAttributeList(attributeOptions);
	    setFirstSelectList();
	}


        /**
	 *  This function set a list of strings with possible nodes that can connect to the previous node. Then,
         *  it makes an icon of a yellow line in a span, and another div with a select box.
	 *  @param {string} previousNodeType  The type of node in the previous node selection drop down box. Need this to know what node types 
	 *  to list based on what node types can connect to it by one relation.
	 *  @param {number} index  The index of the new search box
	 */
       function setPossibleNodes(previousNodeType, index){
                var nodeOptionsList = [];
                var completeSelectHTML = "<span id=\"search-box-line-" + (index + 1) + "\" class=\"center icon-size\">l</span><div id=\"search-input-container-" + (index + 1) +
"\" class=\"search-container\"><select id=\"query-node-" + (index + 1) + "\" class=\"query-node-selector\">";

		//If the previous node type in the search interface exists in schema, then set the possible nodes it can connect with (via one relation)
		if(Object.keys(getFacetedNodeList()).indexOf(previousNodeType, 0) > -1)
		    nodeOptionsList = getFacetedNodeList()[previousNodeType];

		//Loop though all the node types that can connect to 
                for(var i = 0, x = nodeOptionsList.length; i < x; i++){
                        if(i == 0)
                                completeSelectHTML += "<option value=\"" + nodeOptionsList[i] + "\" selected=\"selected\">" + nodeOptionsList[i] + "</option>";
                        else
                                completeSelectHTML += "<option value=\"" + nodeOptionsList[i] + "\">" + nodeOptionsList[i] + "</option>";
                }
		completeSelectHTML += "</select></div>";
                return completeSelectHTML;
        }

       /**
	*  Initialize the list of all possible nodes when the page first loads for the first node selection drop down "select"
	*  tag in the search interface. We need all possible node types in this box because the user can connect to anything 
	*  from the first one. 
	*/
       function setFirstSelectList(){
	       var optionsList = "";
	       var i = 0;
	       Object.keys(getFacetedNodeList()).sort().forEach(function(node){
		       if(i == 0)
                                optionsList += "<option value=\"" + node + "\" selected=\"selected\">" + node + "</option>";
                        else
                                optionsList += "<option value=\"" + node + "\">" + node + "</option>";
		       i++;
		   });
	       $("#query-node-1").append(optionsList);
       }

       /**
	*  When the button with the id "about" is clicked on, then open the about info window
	*/
       $('#about').qtip({
	       position: {
		   my: 'bottom center',
		       at: 'top center',
		       adjust: {
		       method: 'shift'
			   },
		       viewport: true
		       },
		   
		   show: {
		   event: 'click'
		       },
		   
		   hide: {
		   event: 'unfocus'
		       },
		   
		   style: {
		   classes: 'qtip-bootstrap qtip-about',
		       tip: {
		       width: 16,
			   height: 8
			   }
	       },
		   
		   content: $('#about-content')
       });

  /** Make data map fullscrenn 
   *  @params {object} element
   */
  function requestFullScreen(element) {
      // Supports most browsers and their versions.
      var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullscreen;

      if (requestMethod) { // Native full screen.
	  requestMethod.call(element);
      } else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
	  var wscript = new ActiveXObject("WScript.Shell");
	  if (wscript !== null) {
	      wscript.SendKeys("{F11}");
	  }
      }
  }

  /**
   * Make the user interface full screen. Useful when the page is hosted in an enclosing page in an iframe.
   */
  function makeFullScreen(){
      $("#cy").addClass("fullScreen");
      var element = document.body;
      requestFullScreen(element);
  }

  /** Event listener for full screen button
   */
  $("#full-screen").on('click', makeFullScreen);    

});