FROM neo4j:3.0.12

#Set password
ENV NEO4J_AUTH=neo4j/CoolBeans1

ADD ./import.txt /var/lib/neo4j/import/

#Add all CSV files to container
ADD ./CSVFiles/ /var/lib/neo4j/import/

#Add script to run database import command
ADD ./neo4j.conf conf/neo4j.conf
ADD ./startScript.sh /var/lib/neo4j

#Set permissions on start script
#Warning: this script deletes any existing data and re-populates database with import script!
RUN ["chmod", "+x", "./startScript.sh"]

EXPOSE 7474 7687