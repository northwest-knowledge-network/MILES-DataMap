Data Map: Visualize Neo4j graphs in a browser

Steps to running it locally

1 Clone repo to local machine
------------------------------
* Clone the repository using Git into an empty directory.

`git clone https://github.com/northwest-knowledge-network/DataMap.git`
  
2 Install Docker
------------------------------
* Navigate to Docker's download page, and choose the appropriate download depending on your system. Then follow the install instructions for your OS.

`https://www.docker.com/products/overview`

3 Open terminal (Mac and Linux), Windows Powershell (Windows) or Docker Quickstart Terminal (Windows with Docker Toolbox installation)
------------------------------
4 Navigate to directory where Git repo was downloaded using the terminal, Windows Powershell, or Docker Quickstart Terminal (Windows), then navigate to the "StartScripts" directory.
------------------------------

5 Copy Database CSV files In To Neo4j/CSVFiles
----------------------------------
 * A new directory must be made in the Neo4j directory. This directory will hold the .CSV files used to seed the database with data.
 * Run
 `cd Neo4j && mkdir CSVFiles`
 
 * Locate the CSV files you want to use with this system. Copy all the .CSV files:
 `cp pathToCSVs/*.csv Neo4j/CSVFiles`
 
6 Building Docker Containers
-----------------------------
**Only build containers if the Dockerfile is changed for a container, or if new files or data have been added to a container. Do not re-build every time you want to start a container. This will eat up a lot of disk space making new images.**

*If you have already built the images for the containers in this step before, skip to step 7.

* First change directories to the development Docker Compose file:
`cd StartScripts/Compose/Development`

* Run 

`docker-compose build`

in the terminal (use Windows Powershell, or Docker Quickstart Terminal, on Windows machines). This will build docker images used to make containers.

7 Running Containers (Starting System)
------------------------------

There are two different Docker Compose files: one is for local development, and one is for production versions on NKN servers. The development version does not copy website files in to the PHP-Apache container: it mounts a directory from the host operating system's file system and adds it to the container's file system. This allows the developer to modify the website's files (in PHP-Apache/PHP/ file) in the host operating system using whatever development tools they like (Atom, Vim, Emacs, etc.). Since the host machine's website files are mounted in the container, they will automatically show the new changes in the browser when a file is saved on the host machine.

This eliminates trying to do development inside a container, which is difficult because none of these containers have GUI's or development tools installed (like VIM or Emacs). 

* Change to the Development Docker Compose file location:

  `cd StartScripts/Compose/Development`

* Run 

  `docker-compose up`

to run the containers. 
This uses the Docker Compose system to start the containers.

7.1 First Time Setup Only
----------------------------

For the Data Map system, the import queries in Neo4j/import.txt file will be used. If a different database for a different project will be used, then replace the import.txt file with your own Cypher import queries.

* Now, in the terminal (or Docker Quickstart Terminal for Windows users), type 

`docker exec -it $(docker ps | grep 'development_neo4j' | awk '{print $1}') /bin/bash` 


**Windows users not using Docker Toolbox Only** 
Windows Powershell: run 

`docker ps`

and find the container ID for the development_neo4j container and copy that ID into 

`docker exec -it containerID /bin/bash` 

replacing "containerID" with the Neo4j container's ID.

* A bash shell should start inside the Neo4j container. Now, type "cd /var/lib/neo4j/bin/ && ./neo4j-shell -file /var/lib/neo4j/import/queries/import.txt" to run the database data import script." 

* Once this completes, then type "exit" to exit the container. The database is populated with all the nodes now. 

**Run Update Script**

* When the database is changed, the update script must be run. The system queries the database, then saves a JSON representation of the data at PHP-Apache/PHP/results.json for performance enhancements. However, when the database is first populated, or changed in any way, then the update script must regenerate this results.json file and save it.

To update the data used by the graph, run (on Mac, Linux, and non-Docker Toolbox installations on Windows):

`localhost:10000/php/updateGraph.php`

and at this address for Windows systems using Docker Toolbox only:

`IPAddressOfDockerSystemOnWindows:10000/php/updateGraph.php`

The IP address of the Docker system for Docker Toolbox is displayed when the Docker Quickstart Terminal is first started.

*If you receive a 500 server error here, then the database password in Neo4j/Dockerfile and PHP-Apache/PHP/updateGraph.php probably do not match. 


**View Web Page**

 If all scripts execute without errors, then the webpage can be viewed at the following address for Mac and Windows (not using Docker Toolbox):
`localhost:10000`

* and at the IP address specified for the Docker Toolbox system for Windows installations using Docker Toolbox
`IPAddressOfDockerSystemOnWindows:10000`

8 Editing webpage
------------------------------
When the Docker stack is mounted using the Docker Compose file in StartScripts/Compose/Development, the system automatically mounts the directory with the PHP files on your local machine, and shares them in the Apache server. So,
using your local machine, edit PHP files found in:

`PHP-Apache/PHP/`

and the changes to those files will be automatically updated in the container. Then refresh the page in your browser to see the changes.

9 Stopping the containers
------------------------------
* Using the stop container script in the StartScripts Directory, the containers can be stopped by running:

`cd pathToDataMapRepository/StartScripts/Compose/Development/ && docker-compose stop`

replacing "pathToDatamapRepository" with the path on your development machine to the DataMap repository.

10 Remaking Containers if Docker Images Changed
-----------------------------------------------
* If a Dockerfile has been changed for a container after it was first built, and the containers' images have been built again using

`cd pathToDataMapRepository/StartScripts/Compose/Development/ && docker-compose build`

11 Committing Changes to Git
------------------------------
* Since all changes to PHP files are edited on the development machine (if you are using the development Docker compose script at StartScripts/Compose/Development/docker-compose.yml), and not inside the Docker Containers, use Git on you development machine in the directory where the Git repo was cloned into to add, commit, and push changes.

* This Docker system mounts the PHP-Apache/PHP/ directory into the Apache server container, so that when a file in that directory is changed
on you local machine, it is used in the Apache container too, so there is no need to use Bash in the container to make changes. 

12 Making Production Version
--------
* Once all files are in a production level state, then you can make a production container. by running

`cd StartScripts/Compose/Production && docker-compose build && docker-compose up -d`

production containers are made. Production containers do not mount volumes from the host OS in to the container. Instead, they copy files from the host OS and put a new copy inside the container's file sytem. That way, when the container is pushed to a Docker registry, it is a stand alone unit, and can be used on a production Docker system without first downloading the Git code on the host system. 
* Note: developers will not be able to do development on the production containers! They will not have access to website files unless they attach to the container, and manually edit them WHICH IS NOT ADVISED! When a container without a mounted volume is deleted, such as the production containers, then all data inside the container is delted. If that data is not shared to the host operating system via a Docker volume, and some files were changed, then that DATA IS LOST!  
