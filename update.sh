#!/bin/bash
echo "Sichere Datenbank"
MD5=$(date|md5sum)
MD5=${MD5:0:32}
OF=db-$MD5-$(date +%Y-%m-%d).tgz
echo "Archiviere Datenbank nach :"$OF
mongodump  --quiet -d revier-plan -o db_dump
tar cf $OF db_dump/
rm -R db_dump
echo "Starte Update"
forever stopall
tar xf deployme.tar.gz
echo "Upate Complete"
cd bundle
export PORT=8080
export ROOT_URL="http://revier-plan.de"
export MAIL_URL="smtp://localhost:25"
export MONGO_URL="mongodb://localhost:27017/revier-plan"
forever start --append --uid "revier-plan" -l "/home/revier-plan/logfile.log" main.js
echo "Server Started"
