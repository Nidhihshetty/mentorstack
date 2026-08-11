const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugQuestion() {
  try {
    const question = await prisma.question.findFirst({
      where: { id: 1 },
      include: {
        mentee: {
          select: {
            name: true
          }
        },
        answers: true,
        votes: true,
        tags: {
          include: {
            tag: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('🔍 Raw question data:');
    console.log(JSON.stringify(question, null, 2));
    
    console.log('\n📊 Vote calculations:');
    const upvotes = question.votes.filter(v => v.voteType === 'upvote').length;
    const downvotes = question.votes.filter(v => v.voteType === 'downvote').length;
    console.log('Upvotes:', upvotes);
    console.log('Downvotes:', downvotes);
    console.log('Score:', upvotes - downvotes);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugQuestion();
