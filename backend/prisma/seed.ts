import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Converts kebab-case or snake_case filename to camelCase Prisma model name
 * Examples: 
 *   user.json -> user
 *   question-tag.json -> questionTag
 *   community-post.json -> communityPost
 */
function filenameToModelName(filename: string): string {
  const baseName = path.parse(filename).name;
  
  // Convert kebab-case or snake_case to camelCase
  return baseName
    .split(/[-_]/)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Defines seeding order based on foreign key dependencies
 * Models without dependencies should be seeded first
 */
function getSeedingOrder(): string[] {
  return [
    // Independent tables (no FK dependencies)
    'user',
    'tag',
    'badge',
    
    // Depends on User
    'question',
    'answer',
    'article',
    'community',
    'connection',
    'aiLog',
    'reputationHistory',
    
    // Depends on Connection
    'conversation',
    
    // Depends on User (both mentor and mentee)
    'mentorshipRequest',
    
    // Depends on Community
    'communityMember',
    'communityPost',
    
    // Depends on Conversation
    'message',
    
    // Junction/relationship tables - depend on multiple tables
    'questionTag',
    'articleTag',
    'communityPostTag',
    
    // Bookmarks - depend on User and the resource
    'questionBookmark',
    'articleBookmark',
    'communityPostBookmark',
    
    // Votes - depend on User and the resource
    'answerVote',
    'articleVote',
    'communityPostVote',
    
    // Depends on User and Badge
    'userBadge',
  ];
}

/**
 * Seeds a single model from its JSON file
 */
async function seedModel(modelName: string, filePath: string): Promise<void> {
  console.log(`\n📝 Seeding ${modelName}...`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!Array.isArray(data)) {
      console.warn(`⚠️  Skipping ${modelName}: JSON is not an array`);
      return;
    }
    
    if (data.length === 0) {
      console.log(`ℹ️  Skipping ${modelName}: Empty array`);
      return;
    }
    
    // Access Prisma model dynamically
    const model = (prisma as any)[modelName];
    
    if (!model) {
      console.warn(`⚠️  Model '${modelName}' not found in Prisma Client`);
      return;
    }
    
    // Try createMany first (faster, but may fail on some constraints)
    try {
      const result = await model.createMany({
        data,
        skipDuplicates: true,
      });
      console.log(`✅ Successfully seeded ${result.count} ${modelName} records`);
    } catch (bulkError: any) {
      console.warn(`⚠️  Bulk insert failed for ${modelName}, trying individual inserts...`);
      
      // Fallback: insert one by one
      let successCount = 0;
      let errorCount = 0;
      
      for (const record of data) {
        try {
          await model.create({ data: record });
          successCount++;
        } catch (error: any) {
          errorCount++;
          if (errorCount <= 3) { // Only show first 3 errors to avoid spam
            console.error(`   ❌ Failed to insert record:`, error.message);
          }
        }
      }
      
      console.log(`✅ Inserted ${successCount}/${data.length} ${modelName} records (${errorCount} failed)`);
    }
    
  } catch (error: any) {
    console.error(`❌ Error seeding ${modelName}:`, error.message);
  }
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');
  
  const dataDir = path.join(__dirname, 'data');
  
  // Get all JSON files in the data directory
  const files = fs.readdirSync(dataDir)
    .filter(file => file.endsWith('.json'));
  
  // Create a map of model names to file paths
  const fileMap = new Map<string, string>();
  
  for (const file of files) {
    const modelName = filenameToModelName(file);
    fileMap.set(modelName, path.join(dataDir, file));
  }
  
  console.log(`📁 Found ${files.length} JSON files in data directory`);
  console.log(`📋 Models to seed: ${Array.from(fileMap.keys()).join(', ')}\n`);
  
  // Seed in dependency order
  const seedingOrder = getSeedingOrder();
  
  for (const modelName of seedingOrder) {
    const filePath = fileMap.get(modelName);
    
    if (filePath) {
      await seedModel(modelName, filePath);
      fileMap.delete(modelName); // Mark as processed
    }
  }
  
  // Seed any remaining files not in the explicit order
  for (const [modelName, filePath] of fileMap.entries()) {
    console.warn(`⚠️  Model '${modelName}' not in seeding order, seeding now...`);
    await seedModel(modelName, filePath);
  }
  
  console.log('\n✨ Database seeding completed!\n');
}

main()
  .catch((error) => {
    console.error('\n💥 Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
