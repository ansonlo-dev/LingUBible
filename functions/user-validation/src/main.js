import { Client, Users } from 'node-appwrite';

// Appwrite User Validation Function for Bun runtime
export default async ({ req, res, log, error }) => {
  // Initialize Appwrite client
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || 'lingubible')
    .setKey(process.env.APPWRITE_API_KEY);

  const users = new Users(client);

  // Student email validation function
  const isStudentEmail = (email) => {
    return email && (email.endsWith('@ln.hk') || email.endsWith('@ln.edu.hk'));
  };

  try {
    log('🔍 User validation function triggered');
    
    // Parse the request body for manual API calls
    let requestBody = {};
    try {
      if (req.bodyRaw) {
        requestBody = JSON.parse(req.bodyRaw);
        log('📦 Request body:', JSON.stringify(requestBody, null, 2));
      }
    } catch (parseError) {
      log('⚠️ Failed to parse request body, treating as event trigger');
    }

    // Handle direct API calls for immediate user deletion
    if (requestBody.action === 'immediate_user_deletion') {
      const { userId, email, reason } = requestBody;
      log(`🚨 IMMEDIATE USER DELETION REQUEST: ${email} (${userId})`);
      
      if (!userId) {
        return res.json({
          success: false,
          error: 'Missing userId for deletion'
        }, 400);
      }

      // Validate email if provided
      if (email && isStudentEmail(email)) {
        log(`⚠️ Refusing to delete student email: ${email}`);
        return res.json({
          success: false,
          error: 'Cannot delete student email accounts',
          email: email
        }, 403);
      }

      try {
        // Immediately delete the user account
        log(`🗑️ Deleting user account: ${userId}`);
        await users.delete(userId);
        log(`✅ User account deleted successfully: ${userId}`);
        
        return res.json({
          success: true,
          action: 'user_deleted',
          userId: userId,
          email: email,
          reason: reason,
          message: 'User account deleted successfully'
        });
        
      } catch (deleteError) {
        error(`❌ Failed to delete user account ${userId}: ${deleteError.message}`);
        return res.json({
          success: false,
          action: 'deletion_failed',
          userId: userId,
          email: email,
          error: deleteError.message
        }, 500);
      }
    }

    // Handle event-triggered validation (original logic)
    const eventData = requestBody;
    log('📦 Event data:', JSON.stringify(eventData, null, 2));
    
    // Extract user information from the event
    let userId = null;
    let userEmail = null;
    
    // Handle different event types
    if (eventData.$id) {
      userId = eventData.$id;
      userEmail = eventData.email;
    } else if (eventData.userId) {
      userId = eventData.userId;
    }
    
    // If we have a user ID but no email, fetch the user details
    if (userId && !userEmail) {
      try {
        const user = await users.get(userId);
        userEmail = user.email;
        log(`📧 Retrieved user email: ${userEmail}`);
      } catch (getUserError) {
        log(`❌ Failed to get user details: ${getUserError.message}`);
      }
    }
    
    // Validate the email if we have it
    if (userEmail) {
      log(`🎓 Validating email: ${userEmail}`);
      
      if (!isStudentEmail(userEmail)) {
        log(`🚨 NON-STUDENT EMAIL DETECTED: ${userEmail}`);
        
        // Immediately delete the user account
        if (userId) {
          try {
            log(`🗑️ Immediately deleting user account: ${userId}`);
            await users.delete(userId);
            log(`✅ User account deleted successfully: ${userId}`);
            
            // Return error response to prevent further processing
            return res.json({
              success: false,
              action: 'user_deleted',
              reason: 'non_student_email',
              email: userEmail,
              userId: userId,
              message: 'Non-student email account immediately deleted'
            }, 403);
            
          } catch (deleteError) {
            error(`❌ Failed to delete user account ${userId}: ${deleteError.message}`);
            
            // Even if deletion fails, return error to prevent login
            return res.json({
              success: false,
              action: 'deletion_failed',
              reason: 'non_student_email',
              email: userEmail,
              userId: userId,
              message: 'Non-student email detected, deletion attempted',
              deleteError: deleteError.message
            }, 403);
          }
        } else {
          log('⚠️ No user ID available for deletion');
          return res.json({
            success: false,
            action: 'validation_failed',
            reason: 'non_student_email_no_user_id',
            email: userEmail,
            message: 'Non-student email detected but no user ID available'
          }, 403);
        }
      } else {
        log(`✅ Valid student email: ${userEmail}`);
        return res.json({
          success: true,
          action: 'validation_passed',
          email: userEmail,
          userId: userId,
          message: 'Student email validation passed'
        });
      }
    } else {
      log('⚠️ No email found in event data');
      
      // If no email is available, we can't validate, but we should not block
      // This might be a system user or other legitimate account
      return res.json({
        success: true,
        action: 'no_email_to_validate',
        message: 'No email found for validation'
      });
    }
    
  } catch (validationError) {
    error(`❌ User validation error: ${validationError.message}`);
    error(`Stack trace: ${validationError.stack}`);
    
    return res.json({
      success: false,
      action: 'validation_error',
      message: validationError.message,
      error: validationError.stack
    }, 500);
  }
}; 