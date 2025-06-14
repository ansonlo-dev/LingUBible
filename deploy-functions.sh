#!/bin/bash

# Appwrite Functions Deployment Script
# This script deploys all functions using CLI to avoid the 180MB+ VCS deployment issue

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if appwrite CLI is installed
if ! command -v appwrite &> /dev/null; then
    print_error "Appwrite CLI is not installed. Please install it first:"
    echo "npm install -g appwrite-cli"
    exit 1
fi

# Function definitions with their directories
declare -A FUNCTIONS=(
    ["send-verification-email"]="functions/send-verification-email"
    ["cleanup-expired-codes"]="functions/cleanup-expired-codes"
    ["get-user-stats"]="functions/get-user-stats"
)

# Check if functions directory exists
if [ ! -d "functions" ]; then
    print_error "Functions directory not found. Please run this script from the project root."
    exit 1
fi

print_status "Starting deployment of all Appwrite functions..."
echo

# Deploy each function
DEPLOYED_COUNT=0
FAILED_COUNT=0
FAILED_FUNCTIONS=()

for FUNCTION_ID in "${!FUNCTIONS[@]}"; do
    FUNCTION_PATH="${FUNCTIONS[$FUNCTION_ID]}"
    
    print_status "Deploying function: $FUNCTION_ID"
    print_status "Function path: $FUNCTION_PATH"
    
    # Check if function directory exists
    if [ ! -d "$FUNCTION_PATH" ]; then
        print_warning "Function directory $FUNCTION_PATH not found. Skipping..."
        ((FAILED_COUNT++))
        FAILED_FUNCTIONS+=("$FUNCTION_ID (directory not found)")
        continue
    fi
    
    # Check if function has package.json
    if [ ! -f "$FUNCTION_PATH/package.json" ]; then
        print_warning "No package.json found in $FUNCTION_PATH. Skipping..."
        ((FAILED_COUNT++))
        FAILED_FUNCTIONS+=("$FUNCTION_ID (no package.json)")
        continue
    fi
    
    # Deploy the function
    echo "Running: appwrite functions create-deployment --function-id=$FUNCTION_ID --code=$FUNCTION_PATH --activate=true"
    
    if appwrite functions create-deployment \
        --function-id="$FUNCTION_ID" \
        --code="$FUNCTION_PATH" \
        --activate=true; then
        
        print_success "Successfully deployed: $FUNCTION_ID"
        ((DEPLOYED_COUNT++))
    else
        print_error "Failed to deploy: $FUNCTION_ID"
        ((FAILED_COUNT++))
        FAILED_FUNCTIONS+=("$FUNCTION_ID (deployment failed)")
    fi
    
    echo "----------------------------------------"
done

# Summary
echo
print_status "Deployment Summary:"
echo "✅ Successfully deployed: $DEPLOYED_COUNT functions"
echo "❌ Failed deployments: $FAILED_COUNT functions"

if [ $FAILED_COUNT -gt 0 ]; then
    echo
    print_warning "Failed functions:"
    for failed_func in "${FAILED_FUNCTIONS[@]}"; do
        echo "  - $failed_func"
    done
fi

echo
if [ $DEPLOYED_COUNT -gt 0 ]; then
    print_success "Deployment completed! $DEPLOYED_COUNT functions were successfully deployed."
    print_status "All deployed functions are now using CLI deployment (small size) instead of VCS deployment (180MB+)."
else
    print_error "No functions were successfully deployed."
    exit 1
fi

# Optional: Show function status
echo
read -p "Do you want to check the status of all functions? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Checking function status..."
    appwrite functions list
fi 