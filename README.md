# SANYA - Gaming Platform

A full-stack gaming platform built with Next.js 15 and NestJS, featuring real-time multiplayer games, user authentication, and social features.

## 🎮 Features

- **Multiplayer Games**: Rock Paper Scissors, Coding War, and Turing Detective
- **Real-time Communication**: Socket.IO integration for live gameplay
- **User System**: Registration, authentication, profiles, and levels
- **Social Features**: Friends system, chat, and rankings
- **Responsive Design**: Mobile-friendly interface with modern UI components

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with Turbopack for fast development
- **TypeScript** for type safety
- **Apollo Client** for GraphQL communication
- **Socket.IO Client** for real-time features
- **NextAuth.js** for authentication
- **TailwindCSS** for styling
- **React Hook Form** with Zod validation

### Backend
- **NestJS** with TypeScript
- **GraphQL** with Apollo Server
- **Socket.IO** for real-time communication
- **Prisma ORM** with PostgreSQL
- **JWT** authentication
- **File uploads** with Multer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **pnpm** (recommended package manager)
- **PostgreSQL** (v13 or higher)
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FS-Final-Exam
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd FS-Final-Exam-Backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

**Configure your `.env` file:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fs_final_exam"

# JWT
JWT_SECRET="your-secure-jwt-secret"
JWT_REFRESH_SECRET="your-secure-refresh-secret"

# Server
PORT=3011
NODE_ENV=development
```

**Start PostgreSQL and create database:**
```bash
# Using Docker (recommended)
cd DB
docker-compose up -d

# Or manually create database
createdb fs_final_exam
```

**Set up Prisma and seed data:**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed the database
pnpm run seed
```

**Start the backend server:**
```bash
pnpm start:dev
```

The backend will be available at `http://localhost:3011`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd FS-Final-Exam-Frontend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

**Configure your `.env` file:**
```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3011
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:3011/graphql
NEXT_PUBLIC_WS_URL=http://localhost:3011
```

**Start the frontend development server:**
```bash
pnpm dev
```

The frontend will be available at `http://localhost:3000`

## 🎯 Usage

### Getting Started

1. **Register an Account**: Visit `http://localhost:3000/register` to create a new account
2. **Login**: Access `http://localhost:3000/login` with your credentials
3. **Explore Games**: Navigate to the games section to play multiplayer games
4. **Add Friends**: Use the friends system to connect with other players
5. **Check Rankings**: View leaderboards and your progress

### Available Games

#### Rock Paper Scissors
- Classic multiplayer game with real-time matches
- Create or join rooms
- Chat with opponents
- Track wins and losses

#### Coding War
- Programming challenge battles
- Real-time code editor
- Multiple programming problems
- Live typing progress sharing

#### Turing Detective
- AI detection game
- Chat-based gameplay
- Determine if you're talking to AI or human

### Key Features

- **Profile System**: Customize your avatar and view statistics
- **Level System**: Progress through 118 element-based levels
- **Real-time Chat**: Communicate during games
- **Responsive Design**: Play on desktop or mobile devices

## 🛠️ Development

### Available Scripts

**Frontend:**
```bash
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm storybook    # Start Storybook for component development
```

**Backend:**
```bash
pnpm start:dev    # Start development server with hot reload
pnpm build        # Build the application
pnpm start        # Start production server
pnpm seed         # Seed the database with initial data
pnpm test         # Run tests
```

### Project Structure

```
FS-Final-Exam/
├── FS-Final-Exam-Frontend/
│   ├── app/                    # Next.js app directory
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utilities and configurations
│   ├── types/                  # TypeScript type definitions
│   └── public/                 # Static assets
└── FS-Final-Exam-Backend/
    ├── src/
    │   ├── modules/            # Feature modules
    │   ├── common/             # Shared utilities
    │   └── types/              # Type definitions
    └── prisma/                 # Database schema and migrations
```

## 🔧 Configuration

### Database Configuration

The project uses PostgreSQL with Prisma ORM. The database schema includes:

- **Users**: User accounts with authentication
- **Games**: Available games and match history
- **Levels**: Element-based progression system
- **Skins**: Avatar customization options
- **Friends**: Social connections between users

### Socket.IO Events

The application uses various Socket.IO events for real-time features:

- **Game Events**: `createRoom`, `joinRoom`, `makeMove`, `gameState`
- **Chat Events**: `roomChat`, `privateMessage`
- **Friend Events**: `friendRequest`, `friendAccept`

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:

- Touch-friendly game interfaces
- Mobile-optimized chat system
- Responsive navigation
- Optimized performance for mobile browsers

## 🚀 Deployment

### Production Build

**Frontend:**
```bash
pnpm build
pnpm start
```

**Backend:**
```bash
pnpm build
pnpm start:prod
```

### Environment Variables for Production

Make sure to set appropriate production environment variables:

- Update `NEXTAUTH_URL` to your production domain
- Configure production database URL
- Set secure JWT secrets
- Update CORS origins for production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Issues:**
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists and is accessible

**Socket Connection Issues:**
- Check if backend server is running on correct port
- Verify `NEXT_PUBLIC_WS_URL` in frontend `.env`
- Check firewall settings

**Build Issues:**
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`
- Check for TypeScript errors: `pnpm lint`

### Getting Help

If you encounter issues:

1. Check the console for error messages
2. Verify all environment variables are set correctly
3. Ensure all services (database, backend, frontend) are running
4. Check network connectivity for real-time features

---

**Happy Gaming! 🎮**
