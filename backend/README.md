# MentorStack Backend

A comprehensive mentorship platform backend built with Node.js, Express, TypeScript, and PostgreSQL.

## Features

- **User Management**: Three user types (Mentors, Mentees, Admins) with role-based authentication
- **Mentorship System**: Connection requests and accepted mentorships with chat functionality
- **Q&A Platform**: Questions from mentees with answers from mentors and voting system
- **Content Sharing**: Article publishing by mentors with community voting
- **Communities**: Topic-based communities with posts and discussions
- **Gamification**: Reputation system, badges, and achievement tracking
- **AI Integration**: AI-powered assistance with comprehensive logging
- **Bookmarking**: Content saving and organization functionality

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (ready for implementation)

## Prerequisites

Before running this project, make sure you have:

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn package manager

## Database Setup

### 1. Install PostgreSQL

**Windows:**
```powershell
# Using Chocolatey
choco install postgresql

# Or download from https://www.postgresql.org/download/windows/
```

**macOS:**
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Create Database and User

```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create database
CREATE DATABASE mentorstack_db;

-- Create user (optional, you can use postgres user)
CREATE USER mentorstack_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mentorstack_db TO mentorstack_user;

-- Exit psql
\q
```

## Installation & Setup

### 1. Clone and Install Dependencies

```powershell
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```

### 2. Environment Configuration

```powershell
# Copy environment template
cp .env.example .env

# Edit .env file with your database credentials
```

Update your `.env` file:
```env
# Database Configuration
DATABASE_URL="postgresql://mentorstack_user:your_secure_password@localhost:5432/mentorstack_db"

# Application Configuration
NODE_ENV="development"
PORT=5000

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"
```

### 3. Database Migration and Seeding

```powershell
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production-like setup)
npm run db:migrate

# Seed the database with sample data
npm run db:seed
```

### 4. Start Development Server

```powershell
# Start development server with hot reload
npm run dev

# Or build and start production server
npm run build
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:seed` - Seed database with sample data
- `npm run db:reset` - Reset database and run migrations

## Database Schema Overview

### Core Entities

- **Mentor**: Experienced professionals offering guidance
- **Mentee**: Individuals seeking mentorship
- **Admin**: Platform administrators

### Key Features

- **Authentication**: Universal auth system supporting all user types
- **Mentorship**: Request system with connection management
- **Communication**: Real-time messaging between mentors and mentees
- **Q&A System**: Community-driven question and answer platform
- **Content**: Article publishing and sharing
- **Communities**: Topic-based groups and discussions
- **Gamification**: Reputation, badges, and achievement system
- **AI Integration**: Logged AI assistance for mentees
- **Bookmarking**: Save and organize content

### Relationships

- Many-to-many relationships between users and communities
- One-to-many relationships for mentorship connections
- Comprehensive voting systems for articles and community posts
- Audit trails for reputation changes and user activities

## API Endpoints (Planned)

```
Authentication:
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me

Users:
GET  /api/mentors
GET  /api/mentees
GET  /api/users/:id

Mentorship:
POST /api/mentorship/request
GET  /api/mentorship/requests
PUT  /api/mentorship/requests/:id

Q&A:
GET  /api/questions
POST /api/questions
GET  /api/questions/:id
POST /api/questions/:id/answers

Articles:
GET  /api/articles
POST /api/articles
GET  /api/articles/:id
POST /api/articles/:id/vote

Communities:
GET  /api/communities
POST /api/communities
GET  /api/communities/:id
POST /api/communities/:id/join
```

## Development Tools

### Prisma Studio
Access the database GUI:
```powershell
npm run db:studio
```

### Database Reset
To completely reset your database:
```powershell
npm run db:reset
```

## Troubleshooting

### Database Connection Issues

1. **Check PostgreSQL is running:**
   ```powershell
   # Windows
   Get-Service postgresql*
   
   # If not running, start it:
   Start-Service postgresql-x64-[version]
   ```

2. **Verify database exists:**
   ```sql
   psql -U postgres -l
   ```

3. **Test connection:**
   ```powershell
   psql -U mentorstack_user -d mentorstack_db -h localhost
   ```

### Prisma Issues

1. **Regenerate client:**
   ```powershell
   npx prisma generate
   ```

2. **Reset migrations:**
   ```powershell
   npx prisma migrate reset
   ```

3. **View migration status:**
   ```powershell
   npx prisma migrate status
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License.