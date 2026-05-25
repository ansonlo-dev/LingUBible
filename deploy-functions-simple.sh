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

appwrite functions create-deployment --function-id=user-validation --code=functions/user-validation --activate=true
echo "✅ user-validation deployed"

appwrite functions create-deployment --function-id=recompute-course-stats --code=functions/recompute-course-stats --activate=true
echo "✅ recompute-course-stats deployed"

echo "🎉 All functions deployed successfully!"
echo "📊 Check status with: appwrite functions list" 