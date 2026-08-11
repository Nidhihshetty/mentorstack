import dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables Check:');
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_SECRET type:', typeof process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('Is undefined?', process.env.JWT_SECRET === undefined);
console.log('Is empty string?', process.env.JWT_SECRET === '');
