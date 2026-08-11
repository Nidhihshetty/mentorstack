// Test script to validate Cloudinary configuration
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  console.log('Testing Cloudinary connection...\n');
  
  console.log('Configuration:');
  console.log('- Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('- API Key:', process.env.CLOUDINARY_API_KEY);
  console.log('- API Secret:', process.env.CLOUDINARY_API_SECRET ? '***' + process.env.CLOUDINARY_API_SECRET.slice(-4) : 'NOT SET');
  console.log('');

  try {
    // Test by getting account details
    const result = await cloudinary.api.ping();
    console.log('✅ SUCCESS: Cloudinary connection working!');
    console.log('Response:', result);
  } catch (error) {
    console.error('❌ ERROR: Failed to connect to Cloudinary');
    console.error('Error details:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.error('\n⚠️  This looks like an authentication error.');
        console.error('Please check that your CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are correct.');
      } else if (error.message.includes('404')) {
        console.error('\n⚠️  This looks like the cloud name is incorrect.');
        console.error('Please check that your CLOUDINARY_CLOUD_NAME is correct.');
      }
    }
  }
}

testCloudinary();
