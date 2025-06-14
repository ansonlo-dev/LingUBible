#!/bin/bash

# Simple Appwrite Functions Deployment Script
# Quick deployment of all functions using CLI

echo "🚀 Deploying all Appwrite functions..."

# Deploy each function
appwrite functions create-deployment --function-id=send-verification-email --code=functions/send-verification-email --activate=true
echo "✅ send-verification-email deployed"

appwrite functions create-deployment --function-id=cleanup-expired-codes --code=functions/cleanup-expired-codes --activate=true
echo "✅ cleanup-expired-codes deployed"

appwrite functions create-deployment --function-id=get-user-stats --code=functions/get-user-stats --activate=true
echo "✅ get-user-stats deployed"

echo "🎉 All functions deployed successfully!"
echo "📊 Check status with: appwrite functions list" 