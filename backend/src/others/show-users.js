const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showUsers() {
  try {
    console.log('🔍 Showing user credentials for testing...');
    
    // Get some auth credentials
    const authCredentials = await prisma.authCredentials.findMany({
      take: 5,
      select: {
        email: true,
        role: true,
        userId: true
      }
    });
    
    console.log('\n👥 Sample users for testing:');
    for (const auth of authCredentials) {
      console.log(`- Email: ${auth.email} | Role: ${auth.role}`);
    }
    
    console.log('\n💡 Note: You can use any of these emails with password "password123" to test login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showUsers();
