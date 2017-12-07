<?php
	ini_set('memory_limit', '1024M');
	require_once 'vendor/autoload.php';

	use GraphAware\Neo4j\Client\ClientBuilder;
	use GraphAware\Neo4j\Client\Formatter;

	//Create connection to database.
	$client = ClientBuilder::create()
    	->addConnection('default', 'http://neo4j:CoolBeans1@neo4j:7474') // Example for HTTP connection configuration (port is optional)
    	->build();

	//Need to filter out nodes with node.private = true. 
	$query = "MATCH (n) WHERE n.private IS NULL OR n.private <> true RETURN n ";

	//Return distinct nodes that are not private
	$relationsQuery = "MATCH (n)-[r]-(m) WHERE (n.private IS NULL OR n.private <> true) AND (m.private IS NULL OR m.private <> true) RETURN DISTINCT r";
	//Query database for nodes data
	$result = $client->run($query);
	//Query the database for relations data
	$relationsResult = $client->run($relationsQuery);

	$resultList = [];
	$data = [];
	$nodes = [];
	$relations = [];
	$elements = [];
	$x = 100;
	$y = 100;

	$xRole = 100;
	$yRole = 100;
	$xRole1 = 100;
	$yRole1 = 110;	
	$xTheme = 6500;
	$yTheme = 200;
	$xInstitution = 6500;
	$yInstitution = 6500;
	$xUmbrella = 100;
	$yUmbrella = 6500;

	//Construct nodes data for JSON result
	foreach($result->getRecords() as $record){
		$nodeKeys = $record->get('n')->keys(); 

		$nodeOne = array();
		//Loop though keys of node
		foreach($nodeKeys as $key){
			//If the key is the node's ID, save it 
			if($key != "id")
				$nodeOne[$key] = $record->get('n')->value($key);

			/* Need to generate common attribute in node with node label inserted to search
			 *  for that node in Cytoscape.js graph client-side.
			 */
			switch($key){

				      case "name":
                		      case "dscQues":
                                      case "dscProj":
                                      case "namUmb":
                                      case "namTheme":
                                      case "dscStatus":
                                      case "dscTopic":
                                      case "namLoc":
                                      case "title":
                                      case "namData":
                                      case "namLoc":
                                      case "dscTopic":
                                      case "dscClass":
                                      case "dscMeth":
                                      case "dscStatus":
                                      case "namMngr":
                                      case "dscEcoS":
                                      case "namProj":
						$nodeOne['node_label'] = $record->get('n')->value($key);
				      		break;
			}
		}
		//Get Neo4j's ID value to save in the "id" field. Need this for client-side graph generation.
		$nodeOne["id"] = "n" . $record->get('n')->identity();
		//Save node type (Person, Institution, etc.) to use for node styling client-side
		$nodeOne["type"] = $record->get('n')->labels()[0];
		$data["data"] = $nodeOne;
		/* Client-side graphing library uses x and y values to place nodes in graph. Generate those x,y values
		 * based on node type. Nodes group themselves by type in different sections of the graph. 
		 */
		if ($nodeOne["type"]=="Topic"){
			if($xRole<6500){
				$data["position"]["x"] = $xRole;
				$data["position"]["y"] = $yRole;
				$xRole = $xRole + 100 ;				
			}
			else
			{
				$data["position"]["x"] = $xRole1;
				$data["position"]["y"] = $yRole1;
				$yRole1 = $yRole1 + 100 ;					
			}

		}
		elseif($nodeOne["type"]=="Research Theme"){
			$data["position"]["x"] = $xTheme;
			$data["position"]["y"] = $yTheme;

			$yTheme = $yTheme + 100 ;			
		}
		elseif($nodeOne["type"]=="Institution"){
			$data["position"]["x"] = $xInstitution;
			$data["position"]["y"] = $yInstitution;
			$xInstitution = $xInstitution - 100 ;			
		}	
		elseif($nodeOne["type"]=="Ecosystem Service"){
			$data["position"]["x"] = $xUmbrella;
			$data["position"]["y"] = $yUmbrella;
			$yUmbrella = $yUmbrella - 100 ;
		}
		elseif($nodeOne["type"]=="Person"){
			$data["position"]["x"] = rand(200,3000);
			$data["position"]["y"] = rand(200,4000);
		}	
		elseif($nodeOne["type"]=="Question"){
			$data["position"]["x"] = rand(3500,6410);
			$data["position"]["y"] = rand(200,3600);
		}
		elseif($nodeOne["type"]=="Publication"){
			$data["position"]["x"] = rand(2700,4000);
			$data["position"]["y"] = rand(300,2200);
		}	
		elseif($nodeOne["type"]=="Data"){
			$data["position"]["x"] = rand(1000,5500);
			$data["position"]["y"] = rand(4000,6500);
		}	
		elseif($nodeOne["type"]=="Department"){
			$data["position"]["x"] = rand(2100,4200);
			$data["position"]["y"] = rand(3000,3500);
		}	
		elseif($nodeOne["type"]=="Proposal Objective"){
			$data["position"]["x"] = rand(4600,6300);
			$data["position"]["y"] = rand(3000,3500);
		}	
		elseif($nodeOne["type"]=="Project"){
			$data["position"]["x"] = rand(2700,4000);
			$data["position"]["y"] = rand(3000,5000);
		}
		elseif($nodeOne["type"]=="Status"){
			$data["position"]["x"] = rand(3000,3700);
			$data["position"]["y"] = rand(1600,2600);
		}	
		elseif($nodeOne["type"]=="Role"){
			$data["position"]["x"] = rand(5500,6500);
			$data["position"]["y"] = rand(5500,6500);
		}			
		else{
			$data["position"]["x"] = rand(500,6000);
			$data["position"]["y"] = rand(500,6000);
		}
 		array_push($resultList, $data);

	}

	$relationList = array();
	$data = [];
	/** Construct edges data for JSON result. Need to add an "e" to the beginning of edge ID's and an "n" to the beginning of node ID's to
	 *  make sure there are not two elements in the graph with the same ID because the ID's provided from Neo4j can be the same for edges
	 *  and nodes, but it will break Cytoscape.js if they have the same ID's. 
	 */
        foreach($relationsResult->getRecords() as $record){
        	$nodeOne = array();
		$nodeOne["id"] = "e" . $record->get('r')->identity();
		//Sorce node's ID of relation
		$nodeOne["source"] = "n" . $record->get('r')->startNodeIdentity();
		//Target node's ID of relation
		$nodeOne["target"] = "n" . $record->get('r')->endNodeIdentity();
		//Relation type
		$nodeOne["type"] = $record->get('r')->type();

		//Take the rest of the attributes and put them in to the associative array with their native keys
		foreach($record->get('r')->values() as $key => $value){
			$nodeOne[$key] = $value;
		}
		$data["data"] = $nodeOne;
		//Add to list of relations
        	array_push($relationList, $data);

        }

	/* Separate out nodes from relations in return associative array.
	 */ 
	$elements["elements"]["nodes"] = $resultList;
	$elements["elements"]["edges"] = $relationList;

	//Write json file to file system
	$fp = fopen('results.json', 'w');
	$jsonString = json_encode($elements);
	fwrite($fp, $jsonString);
	fclose($fp);

	/* Now, create file that describes schema for faceted search system.
	 */
	$schemaDescription = array();
       	$nodeOne = array();

	/* Return data that shows what nodes types can connect to other node types by ONE relation. EX: (a:Person)--(b:Department)
	 * would be returned because it is connected by one relation with not intermediate nodes in between, but 
	 * (a:Person)--(b:Question)--(c:Theme), the Person--Theme connection would NOT be returned because of the 
	 * intermediate node Question between the two.
	 */
 	$nodeConnectionsQuery = "MATCH (n)--(m) RETURN DISTINCT labels(n) AS sourceNode, labels(m) AS targetNode";
	//Run query
	$queryResult = $client->run($nodeConnectionsQuery);	 
	$nodeOne = array();		 

	//Construct source and target data for each node
        foreach($queryResult->records() as $record){
		$nodeOne = [];
		$nodeOne["source"] = $record->get('sourceNode')[0];
                $nodeOne["target"] = $record->get('targetNode')[0];
		//Put on to schema description list
        	array_push($schemaDescription, $nodeOne);
        }
	//Create associative array (later turned in to JSON object) for nodes AND relations database schema data
	$totalSchema = array();
	//Put node schema information in schema description array
	$totalSchema["nodes"] = $schemaDescription;
	
	//Return relation types data
 	$edgeTypesQuery = "MATCH (n)-[r]-() RETURN DISTINCT labels(n) AS sourceNode, type(r) AS relation";

	$queryResult = $client->run($edgeTypesQuery);	 
	$relationDescription = array();
	
	//Put relation data in to array
        foreach($queryResult->records() as $record){
		$nodeOne = [];
		$nodeOne["source"] = $record->get('sourceNode')[0];
                $nodeOne["relation"] = $record->get('relation');

        	array_push($relationDescription, $nodeOne);
        }
	
 	//Add relation data to total schema associative array in "relations" element. 
	$totalSchema["relations"] = $relationDescription;


	//Get a distinct list of node attributes per node type
 	$nodeAttributesQuery = "MATCH (n) RETURN DISTINCT labels(n) AS node, keys(n) AS attributes;";
	$queryResult = $client->run($nodeAttributesQuery);	 
	$attributesInNode = array();

        foreach($queryResult->records() as $record){
		$nodeOne = [];
		$nodeOne["node"] = $record->get('node')[0];
                $nodeOne["attributeList"] = $record->get('attributes');

        	array_push($attributesInNode, $nodeOne);
        }
	
	//Put node attribute description in to total schema description at "nodeAttributes" element
	$totalSchema["nodeAttributes"] = $attributesInNode;

	//Write JSON representation of schema description to file system
	$fp = fopen('schema.json', 'w');
	$jsonString = json_encode($totalSchema);
	fwrite($fp, $jsonString);
	fclose($fp);

	//Echo success to requesting entity
	echo("-----------------------------------------------------------------------------------------------------<br />\n");
	echo("-----------------------------------------------------------------------------------------------------<br />\n");
	echo("JSON UPDATED<br />\n");
	echo("-----------------------------------------------------------------------------------------------------<br />\n");
	echo("-----------------------------------------------------------------------------------------------------<br />\n");
?>
