#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
DOCKER_USERNAME="your_docker_username" # IMPORTANT: Replace with your Docker username
APP_IMAGE_NAME="garage-app"
DB_IMAGE_NAME="garage-db" # Even if using a base image, you might want to tag it for consistency
APP_TAG="latest"
DB_TAG="latest"
REGISTRY_URL="docker.io" # e.g., docker.io for Docker Hub, or your private registry URL

# --- Login to Docker Registry (Optional, if already logged in) ---
echo "Attempting to login to Docker Registry: ${REGISTRY_URL}"
# docker login ${REGISTRY_URL} # Uncomment and run this command manually if you are not already logged in
                               # You will be prompted for your username and password.
echo "Assuming you are logged into Docker Registry. If not, this script will fail during push."
echo ""

# --- Build Application Image ---
echo "Building ${APP_IMAGE_NAME}:${APP_TAG}..."
docker build -t ${DOCKER_USERNAME}/${APP_IMAGE_NAME}:${APP_TAG} .
echo "Application image built successfully."
echo ""

# --- Build DB Image ---
echo "Building ${DB_IMAGE_NAME}:${DB_TAG}..."
docker build -f ./database/Dockerfile.db -t ${DOCKER_USERNAME}/${DB_IMAGE_NAME}:${DB_TAG} ./database
echo "DB image built successfully."
echo ""

# --- Tag and Push Application Image ---
echo "Tagging and pushing ${APP_IMAGE_NAME}:${APP_TAG} to ${REGISTRY_URL}..."
docker push ${DOCKER_USERNAME}/${APP_IMAGE_NAME}:${APP_TAG}
echo "Application image pushed successfully."
echo ""

# --- Tag and Push DB Image ---
echo "Tagging and pushing ${DB_IMAGE_NAME}:${DB_TAG} to ${REGISTRY_URL}..."
docker push ${DOCKER_USERNAME}/${DB_IMAGE_NAME}:${DB_TAG}
echo "DB image pushed successfully."
echo ""

echo "Docker images build and push process completed."
