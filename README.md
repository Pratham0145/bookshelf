# 📚 BookShelf - Modern Book Reading Platform

A beautiful, feature-rich book reading platform where users can discover, read, upload, and share books. Built with Next.js 16, TypeScript, and modern web technologies.

![BookShelf](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 📖 Book Management
- **Upload Books** - Upload PDF books with cover images
- **Browse Library** - Discover books by category, search, or browse all
- **Read Online** - Built-in PDF reader with zoom and navigation
- **Download Books** - Download books for offline reading

### 🔐 Authentication
- **Google OAuth** - Secure login with Google account
- **User Profiles** - Personal dashboard and profile management

### 🎨 Beautiful UI
- **Modern Design** - Clean, responsive interface
- **Dark/Light Mode** - Theme switching support
- **Mobile Friendly** - Works on all devices

### 📊 User Dashboard
- **My Books** - Manage your uploaded books
- **Reading Progress** - Track your reading
- **Statistics** - View your reading stats

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Google Cloud Console account (for OAuth)

### 1. Clone the Repository

```bash
git clone https://github.com/Pratham0145/bookshelf.git
cd bookshelf
```

### 2. Install Dependencies

```bash
bun install
# or
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database
DATABASE_URL="file:./db/custom.db"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
AUTH_TRUST_HOST="true"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-google-client-secret"
```

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth client ID**
5. Select **Web application**
6. Add Authorized redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
7. Copy the **Client ID** and **Client Secret** to your `.env` file

### 5. Initialize Database

```bash
bun run db:push
# or
npx prisma db push
```

### 6. Start Development Server

```bash
bun run dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui |
| Database | SQLite with Prisma ORM |
| Authentication | NextAuth.js |
| Icons | Lucide React |
| Notifications | Sonner |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth configuration
│   │   ├── books/        # Book CRUD operations
│   │   ├── categories/   # Category management
│   │   ├── upload/       # File upload handling
│   │   └── user/         # User profile & stats
│   └── page.tsx          # Main application page
├── components/
│   ├── shared/           # Shared components
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   └── db.ts             # Prisma client
└── prisma/
    └── schema.prisma     # Database schema
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Update Google OAuth redirect URI to your Vercel domain:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```
5. Deploy!

### Deploy to Other Platforms

This app can be deployed to any platform that supports Next.js:
- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

Remember to update the `NEXTAUTH_URL` and Google OAuth redirect URI for your domain.

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push database schema |
| `bun run db:studio` | Open Prisma Studio |

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

Built with ❤️ using Next.js and modern web technologies.
