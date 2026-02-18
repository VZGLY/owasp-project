#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
DOCKER_USERNAME="register-user" # IMPORTANT: Replace with your Docker username
APP_IMAGE_NAME="garage-app"
DB_IMAGE_NAME="garage-db" 
REGISTRY_URL="registry.gavinc.be" # e.g., docker.io for Docker Hub, or your private registry URL

# Extract version from package.json
VERSION=$(grep '"version":' package.json | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
  echo "Error: Could not extract version from package.json"
  exit 1
fi

echo "Detected version: ${VERSION}"
echo ""

# --- Login to Docker Registry (Optional, if already logged in) ---
echo "Attempting to login to Docker Registry: ${REGISTRY_URL}"
# docker login ${REGISTRY_URL} # Uncomment and run this command manually if you are not already logged in
                               # You will be prompted for your username and password.
echo "Assuming you are logged into Docker Registry. If not, this script will fail during push."
echo ""

# --- Build and Tag Application Image ---
echo "Building ${APP_IMAGE_NAME}:${VERSION} and latest..."
APP_FULL_IMAGE="${REGISTRY_URL}/${DOCKER_USERNAME}/${APP_IMAGE_NAME}"
docker build -t ${APP_FULL_IMAGE}:${VERSION} -t ${APP_FULL_IMAGE}:latest .
echo "Application image built and tagged successfully."
echo ""

# --- Build and Tag DB Image ---
echo "Building ${DB_IMAGE_NAME}:${VERSION} and latest..."
DB_FULL_IMAGE="${REGISTRY_URL}/${DOCKER_USERNAME}/${DB_IMAGE_NAME}"
docker build -f ./database/Dockerfile.db -t ${DB_FULL_IMAGE}:${VERSION} -t ${DB_FULL_IMAGE}:latest ./database
echo "DB image built and tagged successfully."
echo ""

# --- Push Application Image ---
echo "Pushing ${APP_IMAGE_NAME}:${VERSION} and latest to ${REGISTRY_URL}..."
docker push ${APP_FULL_IMAGE}:${VERSION}
docker push ${APP_FULL_IMAGE}:latest
echo "Application image pushed successfully."
echo ""

# --- Push DB Image ---
echo "Pushing ${DB_IMAGE_NAME}:${VERSION} and latest to ${REGISTRY_URL}..."
docker push ${DB_FULL_IMAGE}:${VERSION}
docker push ${DB_FULL_IMAGE}:latest
echo "DB image pushed successfully."
echo ""

echo "Docker images build and push process completed."
