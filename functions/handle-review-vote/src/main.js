import { Client, Databases, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  try {
    // Parse request body
    const { reviewId, userId, voteType } = JSON.parse(req.body || '{}');

    // Validate input
    if (!reviewId || !userId) {
      return res.json({
        success: false,
        error: 'Missing required parameters: reviewId and userId'
      }, 400);
    }

    if (voteType && !['up', 'down'].includes(voteType)) {
      return res.json({
        success: false,
        error: 'Invalid vote type. Must be "up" or "down"'
      }, 400);
    }

    const DATABASE_ID = 'lingubible';
    const REVIEW_VOTES_COLLECTION_ID = 'review_votes';

    // Check if user has already voted on this review
    const existingVotes = await databases.listDocuments(
      DATABASE_ID,
      REVIEW_VOTES_COLLECTION_ID,
      [
        Query.equal('review_id', reviewId),
        Query.equal('user_id', userId)
      ]
    );

    const existingVote = existingVotes.documents[0];

    if (!voteType) {
      // Remove vote if no vote type provided
      if (existingVote) {
        await databases.deleteDocument(
          DATABASE_ID,
          REVIEW_VOTES_COLLECTION_ID,
          existingVote.$id
        );
        log('Vote removed successfully');
      }
    } else if (existingVote) {
      // Update existing vote
      if (existingVote.vote_type !== voteType) {
        await databases.updateDocument(
          DATABASE_ID,
          REVIEW_VOTES_COLLECTION_ID,
          existingVote.$id,
          {
            vote_type: voteType,
            voted_at: new Date().toISOString()
          }
        );
        log('Vote updated successfully');
      } else {
        // Same vote type - remove the vote (toggle off)
        await databases.deleteDocument(
          DATABASE_ID,
          REVIEW_VOTES_COLLECTION_ID,
          existingVote.$id
        );
        log('Vote toggled off successfully');
      }
    } else {
      // Create new vote
      await databases.createDocument(
        DATABASE_ID,
        REVIEW_VOTES_COLLECTION_ID,
        ID.unique(),
        {
          review_id: reviewId,
          user_id: userId,
          vote_type: voteType,
          voted_at: new Date().toISOString()
        }
      );
      log('New vote created successfully');
    }

    // Get updated vote counts
    const allVotes = await databases.listDocuments(
      DATABASE_ID,
      REVIEW_VOTES_COLLECTION_ID,
      [
        Query.equal('review_id', reviewId),
        Query.limit(1000)
      ]
    );

    const upvotes = allVotes.documents.filter(vote => vote.vote_type === 'up').length;
    const downvotes = allVotes.documents.filter(vote => vote.vote_type === 'down').length;
    
    // Get user's current vote
    const userVote = allVotes.documents.find(vote => vote.user_id === userId);

    return res.json({
      success: true,
      data: {
        upvotes,
        downvotes,
        userVote: userVote ? userVote.vote_type : null
      }
    });

  } catch (err) {
    error('Error handling review vote:', err);
    return res.json({
      success: false,
      error: 'Internal server error'
    }, 500);
  }
}; 