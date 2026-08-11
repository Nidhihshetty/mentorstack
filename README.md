# 🎓 MentorStack

**MentorStack** is a full-stack mentorship platform with a properly implemented backend that supports authentication, role-based access, content publishing, community discussions, real-time chat, AI-assisted utilities, reputation tracking, and admin analytics. The backend is not just a set of endpoints; it is a structured system built to handle data integrity, security, asynchronous processing, and operational visibility.

![Next.js](https://img.shields.io/badge/Next.js-15.5.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748?logo=prisma)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Latest-orange?logo=rabbitmq)

---

# Implementation Overview

## 1. Architecture Overview

The backend follows a layered architecture:

- HTTP API layer for client requests
- authentication and authorization middleware for access control
- service and utility layer for business logic
- database layer for persistent storage
- message broker for asynchronous tasks and real-time delivery
- AI agent service for delegated Gemini processing
- admin layer for analytics and moderation

The main technologies used are Node.js, Express, TypeScript, PostgreSQL, Prisma, RabbitMQ, WebSocket, Cloudinary, Docker, and Google Gemini for API.

## 2. System Structure

The backend is organized around a few clear concerns:

- user authentication and profile management
- mentorship request and connection workflow
- questions, answers, articles, votes, and bookmarks
- communities and community posts
- real-time discussions and mentor chat
- AI tools such as validation, summarization, rephrasing, spell checking, and tag suggestion
- reputation and badge management
- admin moderation, user management, and analytics

## 3. Data Model and Schema Complexity

The schema supports the platform through several connected entities:

- User for mentor, mentee, and admin accounts
- Question and Answer for the Q&A workflow
- Article for longer-form content
- Community and CommunityPost for group learning spaces
- Conversation and Message for mentorship chat
- MentorshipRequest and Connection for mentor-mentee pairing
- Tag for content categorization
- Bookmark tables for saving content
- Vote tables for upvote and downvote tracking
- Badge, UserBadge, and ReputationHistory for gamification and audit history
- AiLog for tracking AI prompts and responses

```mermaid
graph TD
    User --> Questions
    User --> Answers
    User --> Articles
    User --> Communities
    User --> Memberships

    Question --> AnswersQ
    Question --> Tags
    Question --> Votes
    Question --> Bookmarks

    Article --> ArticleTags
    Article --> ArticleVotes
    Article --> ArticleBookmarks

    Community --> Members
    Community --> Posts
    Community --> Messages

    MentorshipRequest --> Connection
    Connection --> Conversation
    Conversation --> Messages2
```

## 4. Authentication and Access Control

Authentication is JWT-based, which makes the system stateless and scalable. Passwords are hashed before storage, and protected routes verify the token before any sensitive action is allowed.

What was implemented:

- signup with validation and password hashing
- login with token issuance
- current-user lookup from token data
- admin-only access control
- role-aware route protection for mentor and mentee behavior

## 5. Core Feature Implementation

### 5.1 Mentorship Workflow

The mentorship flow is implemented as a proper multi-step backend process:

- a mentee submits a request
- the mentor receives and reviews it
- accepting the request creates a connection record
- the acceptance also creates a private conversation
- the reputation system rewards the accepted mentor interaction

Reason:

- duplicate requests are prevented
- only the intended mentor can accept a request
- a request cannot be processed twice
- the acceptance process is linked to conversation creation

### 5.2 Questions, Answers, Votes, and Bookmarks

The Q&A subsystem demonstrates that the backend handles a complete content lifecycle:

- question creation with validation
- answer submission with validation
- vote creation, vote switching, and vote removal
- content bookmarking
- tag linking for discoverability
- reputation updates based on user actions

Reason:

- duplicate votes are prevented at the database level
- vote changes are handled as net deltas instead of loose counters
- bookmarks are idempotent, so repeated requests do not create duplicate records
- content owners receive reputation rewards through controlled backend logic

### 5.3 Communities and Realtime Discussion

Communities are not just static groups. They support membership, posts, and live discussion.

What the backend does:

- creates communities and adds the creator automatically
- allows users to join and leave communities
- stores community posts with content and media
- manages community messages with persistence
- sends live updates through WebSocket
- replays recent history so users do not lose context on reconnect

Reason:

- it proves that the project handles both persistent and real-time data
- it shows the backend can serve many users at the same time
- it demonstrates that messages are not lost when a client disconnects

### 5. 6 AI Features

The project includes multiple AI-powered backend utilities:

- answer validation
- summary generation
- rephrasing
- similar question detection
- spelling and grammar checking
- tag suggestion

## 6. Error Handling Strategy

The backend uses practical error handling rather than vague failure messages.

Key strategies:

- validate inputs before database writes
- reject missing or malformed requests early
- return clear status codes for unauthorized, forbidden, and not found cases
- avoid exposing internal stack traces to users
- protect against duplicate actions such as duplicate votes or duplicate bookmarks
- treat AI logging failures as non-fatal so core user flows continue
- retry database operations when the cloud database is waking from inactivity

## 7. Security Checklist

Security is a major strength of the backend implementation.

Implemented security measures:

- password hashing before storage
- JWT-based session control
- token expiration for user and admin access
- role-based access checks on protected endpoints
- admin-only route separation
- database-level uniqueness constraints to prevent abuse
- input validation before persistence
- authenticated AI agent logging using a shared secret header
- membership checks before allowing community actions
- use of environment variables for secrets and service credentials

Why this is important:

- it reduces the chance of unauthorized access
- it prevents common account and content manipulation issues
- it shows the backend is designed with real-world misuse in mind

## 8. API Reference Summary

This section shows the breadth of backend coverage.

| Area | Main Capability | What It Demonstrates |
|---|---|---|
| Authentication | Signup, login, current user, admin login | Secure identity and role control |
| Mentorship | Request, accept, reject, connection management | Multi-step workflow handling |
| Questions | Create, list, detail, answer, vote, edit, delete | Full content lifecycle |
| Articles | Create, list, detail, vote, edit, delete | Media-backed publishing |
| Communities | Create, join, leave, post, discuss | Group collaboration |
| Chat | Private mentor-mentee conversation | Realtime communication |
| AI Tools | Validate, summarize, rephrase, spellcheck, similar questions, tags | External AI integration |
| Reputation | Award, adjust, history | Gamification and auditability |
| Badges | Earn, display, manage | Progress tracking |
| Admin | Users, content, communities, mentorship, tags, badges, analytics | Platform oversight |

## 9. Admin Dashboard Stats

The admin panel is strong evidence that the backend was built properly. It is backed by real queries and aggregated metrics.

Important analytics exposed by the backend:

- total users, mentors, mentees, and admins
- new users over time
- questions, answers, articles, communities, and posts totals
- votes and bookmarks counts
- mentorship request totals and acceptance rates
- top active or top reputation users
- content trends over recent days
- community growth and contributor rankings
- tag usage and content distribution

## 10. Docker and RabbitMQ

Docker was used to make the backend infrastructure more consistent and easier to run.

Why Docker matters here:

- RabbitMQ can be run as a container instead of depending on manual local setup
- the backend and chatbot service can be packaged consistently
- the same setup approach works for development and deployment
- containerization makes service startup more reproducible

RabbitMQ specifically benefits from Docker because the message broker becomes easier to start, restart, and share across machines. That is especially helpful in a project with real-time discussion and chatbot queueing.

## 11. Summary of Backend Implementation

- the system has a real database schema with multiple related entities
- the project enforces security through JWT, roles, and middleware
- the mentorship flow requires transactional consistency and was implemented that way
- voting and bookmarking are handled safely to avoid duplicates
- real-time chat is backed by WebSocket and RabbitMQ, not simulated frontend state
- AI features are separated into a dedicated agent rather than being hardcoded into the request cycle
- admin views are powered by actual backend aggregation queries
- the project includes monitoring-style metrics and operational thinking
- Docker improves service reproducibility, especially for RabbitMQ and related services

## 12. Conclusion

This project demonstrates a properly implemented backend because it combines architecture, database design, security, asynchronous processing, real-time communication, analytics, and operational reliability in one system. The added evidence sections make it easier to present the work in a placement setting and show that the backend was built with production concerns in mind.

---

## ✨ Features

### 🤝 Mentorship System
- **Mentor-Mentee Matching**: Connect mentees with experienced mentors based on skills and interests
- **Request Management**: Send, accept, or reject mentorship requests
- **Real-time Chat**: WebSocket-powered private messaging between mentors and mentees
- **Connection Tracking**: Manage active mentorship relationships

### ❓ Q&A Platform
- **Ask & Answer**: Post questions and provide detailed answers
- **Voting System**: Upvote/downvote questions and answers
- **Answer Validation**: AI-powered answer quality assessment
- **Bookmarking**: Save important questions for later reference
- **Tags**: Organize questions with relevant tags

### 📝 Articles & Knowledge Sharing
- **Article Publishing**: Write and share technical articles with rich formatting
- **Image Support**: Upload images via Cloudinary integration
- **Categories & Tags**: Organize content by topics
- **Voting & Engagement**: Upvote quality content
- **Bookmarking**: Save articles to your collection

### 💬 Communities
- **Create Communities**: Build topic-specific communities
- **Discussion Posts**: Share ideas and engage with community members
- **Member Management**: Join communities and manage memberships
- **Tags & Organization**: Categorize community posts
- **Real-time Discussions**: WebSocket-powered community chat

### 🤖 AI Features
- **AI Chatbot**: Get instant answers powered by Google Gemini AI
- **Answer Summarization**: Automatically summarize multiple answers
- **Answer Validation**: AI assessment of answer quality and relevance
- **Similar Questions**: Find related questions using AI
- **Content Rephrasing**: Improve your writing with AI assistance
- **Spell Checking**: Real-time spelling corrections

### 🏆 Gamification
- **Reputation System**: Earn points for helpful contributions
- **Badges**: Unlock achievements based on reputation milestones
- **Activity Tracking**: Monitor your reputation history
- **Leaderboard**: Compare your progress with others

### 🎨 User Experience
- **Fully Responsive**: Mobile-first design that works on all devices
- **GSAP Animations**: Smooth, intuitive animations throughout the app
- **Dark Mode Support**: Custom CSS variables for theming
- **Profile Customization**: Upload avatars, manage bio, skills, and more
- **Bookmarks Management**: Organize saved questions, articles, and posts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Pages   │  │Components│  │  Utils   │  │  Hooks   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑ HTTPS / WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                     Backend (Express + TypeScript)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Routes  │  │Middleware│  │WebSocket │  │  Prisma  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────────────────────────────────────────────────────┐
│                      Message Queue (RabbitMQ)                    │
│         AI Request Queue  →  Chatbot Agent Worker               │
└─────────────────────────────────────────────────────────────────┘
                              ↓ ↑
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   Cloudinary    │  │  Google Gemini  │
│   (Neon.tech)   │  │  (Image CDN)    │  │   (AI Model)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Tech Stack

#### Frontend
- **Framework**: Next.js 15.5.6 (App Router)
- **UI Library**: React 19.0.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Animations**: GSAP (GreenSock Animation Platform)
- **State Management**: React Hooks & Context
- **HTTP Client**: Fetch API with custom auth wrapper
- **Image Handling**: Next.js Image component

#### Backend
- **Runtime**: Node.js 20.x
- **Framework**: Express.js 5.1.0
- **Language**: TypeScript 5.8.3
- **Database ORM**: Prisma 6.15.0
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: WebSocket (ws library)
- **Message Queue**: RabbitMQ via amqplib
- **File Upload**: Multer with Cloudinary storage
- **AI Integration**: Google Generative AI (Gemini)

#### Database
- **Primary Database**: PostgreSQL (hosted on Neon.tech)
- **ORM**: Prisma with 26+ relational models
- **Migrations**: Prisma Migrate

#### Infrastructure
- **Frontend Hosting**: Vercel (Auto-deployment from GitHub)
- **Backend Hosting**: Render.com (Docker container)
- **Chatbot Agent**: Render.com (Background worker)
- **Database**: Neon.tech (Serverless PostgreSQL)
- **Message Broker**: CloudAMQP (RabbitMQ managed service)
- **CDN**: Cloudinary (Image storage and optimization)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: Database instance (local or cloud)
- **RabbitMQ**: Message broker instance
- **Git**: Version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Major-Project-26/mentorstack.git
   cd mentorstack
   ```

2. **Install dependencies**

   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```

   **Backend:**
   ```bash
   cd backend
   npm install
   ```

   **Chatbot Agent:**
   ```bash
   cd chatbot-agent
   npm install
   ```

3. **Environment Configuration**

   **Frontend (.env.local):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

   **Backend (.env):**
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/mentorstack

   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # Google Gemini AI
   GEMINI_API_KEY=your-gemini-api-key

   # RabbitMQ
   RABBITMQ_URL=amqp://localhost:5672
   ```

   **Chatbot Agent (.env):**
   ```env
   BACKEND_API_URL=http://localhost:5000
   RABBITMQ_URL=amqp://localhost:5672
   GEMINI_API_KEY=your-gemini-api-key
   ```

4. **Database Setup**

   ```bash
   cd backend
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (optional)
   npx prisma db seed
   ```

5. **Run the Application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

   **Terminal 3 - Chatbot Agent:**
   ```bash
   cd chatbot-agent
   node agent.js
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Backend Health: http://localhost:5000/health

---

## 📁 Project Structure

```
mentorstack/
├── frontend/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # Reusable React components
│   │   ├── lib/             # Utilities and API client
│   │   └── utils/           # Helper functions
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Auth and validation middleware
│   │   ├── lib/            # Database and external services
│   │   └── realtime/       # WebSocket and RabbitMQ logic
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   ├── migrations/     # Database migrations
│   │   └── seed.ts         # Database seeding script
│   └── package.json
│
├── chatbot-agent/           # AI chatbot worker
│   ├── agent.js            # Main worker process
│   └── package.json
│
├── docker-compose.yml       # Local development services
└── README.md               # This file
```

---

## 🔑 Key Features Implementation

### Authentication Flow
1. User registers with email, password, and role (mentor/mentee)
2. JWT token generated on successful login
3. Token stored in localStorage and sent with each API request
4. Middleware validates token and attaches user info to request

### Real-time Communication
- **WebSocket Server**: Handles connections for chat and AI responses
- **RabbitMQ**: Asynchronous message processing for AI requests
- **Pub/Sub Pattern**: Efficient message distribution

### Database Models
- **26+ Prisma models** including:
  - User management (Users, Roles)
  - Mentorship (Requests, Connections, Conversations, Messages)
  - Content (Questions, Answers, Articles, Communities, Posts)
  - Engagement (Votes, Bookmarks, Tags)
  - Gamification (Badges, Reputation History)
  - AI Logs

### API Endpoints
- **/api/auth** - Authentication (login, register)
- **/api/users** - User management
- **/api/questions** - Q&A operations
- **/api/articles** - Article CRUD
- **/api/communities** - Community management
- **/api/chat** - Messaging and AI chat
- **/api/badges** - Badge system
- **/api/upload** - File uploads
- **/api/bookmarks** - Bookmark management

---

## 🚀 Deployment

### Production URLs
- **Frontend**: https://mentorstack.vercel.app
- **Backend**: https://mentorstack-backend.onrender.com
- **Chatbot**: https://mentorstack-chatbot-agent.onrender.com

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Team

**Major-Project-26 Team**
- Full-stack development
- UI/UX design
- Database architecture
- AI integration

---

**Built with ❤️ by the MentorStack Team**
