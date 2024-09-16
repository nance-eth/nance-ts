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

# Create databases folder if it doesn't exist
if [ ! -d "databases" ]; then
    mkdir databases
    echo "Created databases folder."
else
    echo "Databases folder already exists."
fi

cd $PWD/databases

# Clone system database
dolt clone nance/nance_sys
read -e -p "Specify space name or ALL: " selection

# Delete space entries if not ALL
if [ "$selection" != "ALL" ]; then
    dolt sql -q "DELETE FROM nance_sys.config WHERE space != '$selection'"
fi

dolt sql -q "SELECT CONCAT(JSON_UNQUOTE(JSON_EXTRACT(config, '$.dolt.owner')), '/', JSON_UNQUOTE(JSON_EXTRACT(config, '$.dolt.repo'))) AS repo_url FROM config" -r csv | tail -n +2 | while read repo_url; do
  dolt clone "$repo_url"
done
