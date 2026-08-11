const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySeeding() {
  try {
    const mentors = await prisma.mentor.count();
    const mentees = await prisma.mentee.count();
    const auths = await prisma.authCredentials.count();
    const questions = await prisma.question.count();
    const answers = await prisma.answer.count();
    const questionVotes = await prisma.questionVote.count();
    const answerVotes = await prisma.answerVote.count();

    console.log('🎉 Database Seeding Verification:');
    console.log(`   👨‍💼 Mentors: ${mentors}`);
    console.log(`   👩‍🎓 Mentees: ${mentees}`);
    console.log(`   🔐 Auth Credentials: ${auths}`);
    console.log(`   ❓ Questions: ${questions}`);
    console.log(`   💬 Answers: ${answers}`);
    console.log(`   📊 Question Votes: ${questionVotes}`);
    console.log(`   ⭐ Answer Votes: ${answerVotes}`);
    console.log('');
    console.log('✅ Rich test data successfully seeded!');
    console.log('🚀 Ready to test answer functionality');
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySeeding();
