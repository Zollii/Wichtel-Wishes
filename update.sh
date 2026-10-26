#!/bin/sh
# Updates the app on the server: pulls the latest code from GitHub, then
# rebuilds and restarts the container. The database lives in the
# `wichtel_data` volume and is kept; new migrations run when the app starts.
#
#   ./update.sh
set -eu
cd "$(dirname "$0")"

echo "Pulling the latest code..."
git pull --ff-only

echo "Rebuilding and restarting – this can take a few minutes..."
docker compose up -d --build --wait

# Drop the image layers the previous build left behind.
docker image prune -f > /dev/null

echo "Done. Running: $(git log -1 --format='%h %s')"
