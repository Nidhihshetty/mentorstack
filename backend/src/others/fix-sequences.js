require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetSequences() {
  try {
    console.log('🔧 Resetting database sequences...');
    
    // helper to safely reset a table's id sequence, ignoring missing tables
    const reset = async (table) => {
      try {
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"','id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
        );
        console.log(`✅ ${table} sequence reset`);
      } catch (e) {
        console.warn(`⚠️  Skipped ${table} (missing or no sequence):`, e?.code || e?.message || e);
      }
    };

    // Core tables
    await reset('Community');
    await reset('CommunityMember');
    await reset('CommunityPost');
    await reset('CommunityPostVote');
    await reset('Question');
    await reset('Answer');
    // No QuestionVote table in schema – skip safely
    await reset('AnswerVote');
    await reset('Article');
    await reset('ArticleVote');

    // Messaging/Connections
    await reset('Connection');
    await reset('Conversation');
    await reset('Message');

    // Bookmarks
    await reset('QuestionBookmark');
    await reset('ArticleBookmark');
    await reset('CommunityPostBookmark');

  // Community discussions
  await reset('CommunityMessage');

    // Reputation/Badges/Logs
    await reset('ReputationHistory');
    await reset('Badge');
    await reset('UserBadge');
    await reset('AiLog');
    
    console.log('🎉 All database sequences reset (best-effort).');
    console.log('🚀 Inserts should now work properly across all core tables');
  } catch (error) {
    console.error('❌ Error resetting sequences:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetSequences();
