#!/usr/bin/env bash

# Check if dolt is already installed
if ! command -v dolt &> /dev/null
then
    echo "dolt not found. Installing dolt..."
    sudo bash -c 'curl -L https://github.com/dolthub/dolt/releases/latest/download/install.sh | bash'
    echo "dolt installation complete."
else
    echo "dolt is already installed."
fi

# Check if curl is installed
if ! command -v curl &> /dev/null
then
    echo "curl not found. Please install curl and try again."
    exit 1
fi

# Create databases folder if it doesn't exist
if [ ! -d "databases" ]; then
    mkdir databases
    echo "Created databases folder."
else
    echo "Databases folder already exists."
fi

cd databases

# Create nance_sys database and apply schema
dolt sql -q "CREATE DATABASE IF NOT EXISTS nance_sys"
dolt --use-db=nance_sys sql < $PWD/../../../../assets/sysSchema.sql

dolt --use-db=nance_sys sql < $PWD/../config.sql

# Create waterbox database
dolt sql -q "CREATE DATABASE IF NOT EXISTS waterbox"
# Execute the SQL file from assets
dolt --use-db=waterbox sql < $PWD/../../../../assets/schema.sql

echo "Waterbox config has been updated in the nance_sys database."
