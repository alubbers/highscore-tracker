#!/bin/bash

# Start script for High Score Tracker container
# This script handles container startup for Google Cloud Run

set -e

# Set default port if not provided
export PORT=${PORT:-8080}

# Create log directory
mkdir -p /var/log/nginx

# Update nginx configuration with correct port
sed -i "s/listen 8080;/listen ${PORT};/" /etc/nginx/nginx.conf

# Print startup information
echo "Starting High Score Tracker..."
echo "Port: ${PORT}"
echo "Environment: ${REACT_APP_ENV:-production}"
echo "Version: ${REACT_APP_VERSION:-1.0.0}"

# Validate environment variables
if [ -z "${REACT_APP_GCP_PROJECT_ID}" ]; then
    echo "Warning: REACT_APP_GCP_PROJECT_ID not set"
fi

if [ -z "${REACT_APP_STORAGE_BUCKET}" ]; then
    echo "Warning: REACT_APP_STORAGE_BUCKET not set"
fi

# Start nginx
echo "Starting nginx..."
nginx -g "daemon off;"
