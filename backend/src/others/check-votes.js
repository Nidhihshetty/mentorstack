const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkVotes() {
  try {
    const questionVotes = await prisma.questionVote.findMany();
    const questions = await prisma.question.findMany({
      include: { votes: true }
    });
    
    console.log('📊 Vote data check:');
    console.log('Total question votes:', questionVotes.length);
    console.log('Questions with votes:');
    questions.forEach(q => {
      console.log(`  Q${q.id}: ${q.votes.length} votes`);
    });
    
    if (questionVotes.length > 0) {
      console.log('Sample votes:', questionVotes.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVotes();
