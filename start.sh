#!/bin/bash
cd bundle
echo "Starte Meteor"
export PORT=58080
export ROOT_URL="http://revier-plan.de"
export MAIL_URL="smtp://localhost:25"
export MONGO_URL="mongodb://localhost:27017/revier-plan"
node main.js
