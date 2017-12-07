#!/bin/bash

#remove old database
rm -rf /data/graph.db

cd /var/lib/neo4j/bin/ && ./neo4j-shell -file /var/lib/neo4j/import/import.txt