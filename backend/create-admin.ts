import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Get email and password from command line args or use defaults
        const email = process.argv[2] || 'admin@mentorstack.com';
        const password = process.argv[3] || 'admin123';
        const name = process.argv[4] || 'Admin User';

        console.log('🔐 Creating admin user with email:', email);
        console.log('📝 Arguments received:', process.argv);

        // Check if user with this email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            console.log('⚠️  User already exists with this email!');
            console.log(`📧 Email: ${existingUser.email}`);
            console.log(`👤 Name: ${existingUser.name}`);
            console.log(`🔰 Role: ${existingUser.role}`);

            if (existingUser.role !== 'admin') {
                console.log('\n💡 This user exists but is NOT an admin. Promoting to admin...');
                const updated = await prisma.user.update({
                    where: { id: existingUser.id },
                    data: { role: Role.admin },
                    select: { id: true, email: true, name: true, role: true }
                });
                console.log('✅ User promoted to admin:', updated);
                console.log('🔑 Use their existing password to login');
            } else {
                console.log('\n💡 This email already has an admin account.');
                console.log('🔑 Use the existing password to login');
            }

            console.log('\nUsage: npm run create-admin [email] [password] [name]');
            console.log('Example: npm run create-admin admin@example.com mypass123 "John Admin"');
            process.exit(0);
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: Role.admin,
                reputation: 0,
                skills: ['Platform Management', 'User Support'],
                bio: 'Platform Administrator'
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log(`📧 Email: ${admin.email}`);
        console.log(`👤 Name: ${admin.name}`);
        console.log(`🔑 Password: ${password}`);
        console.log('⚠️  Please change this password after first login!');
        console.log('\n🔗 Login at: http://localhost:3000/admin/login');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        if (error instanceof Error) {
            console.error('Details:', error.message);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();