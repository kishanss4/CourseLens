# POSSPOLE WEB APPLICATION ASSIGNMENT

## 📚 CourseLens

CourseLens is a modern course feedback and management platform built with **React + Vite + Supabase**.  
It provides a scalable and user-friendly system for handling courses, user profiles, and feedback with real-time updates.

---

## 🛠️ Tech Stack

### Frontend Framework & Build Tool
- **React 18.3.1** - Core frontend framework  
- **Vite 5.4.19** - Fast build tool and development server  
- **TypeScript 5.8.3** - Static type checking  

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework  
- **shadcn/ui** - Modern React component library built on Radix UI  
- **Radix UI** - Accessible, unstyled UI primitives  
- **Lucide React** - Beautiful & consistent icon library  
- **Tailwind CSS Animate** - Animation utilities  

### State Management & Data Fetching
- **TanStack React Query 5.83.0** - Server state management  
- **React Hook Form 7.61.1** - Form state management  
- **Zod 3.25.76** - Schema validation  

### Backend & Database
- **Supabase 2.57.4** - Backend-as-a-Service (PostgreSQL database, authentication, storage, edge functions)  

### Routing & Navigation
- **React Router DOM 6.30.1** - Client-side routing  

### Additional Libraries
- **date-fns** - Date utility library  
- **Recharts** - Chart and data visualization  
- **Sonner** - Toast notifications  
- **next-themes** - Theme management  

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/courselens.git
cd courselens
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Supabase

1. Go to [Supabase](https://supabase.com) and create a new project.  
2. Get your **Project URL** and **Anon Key** from the project settings.  
3. Create a `.env.local` file in the root of your project:  

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## 🗄️ Supabase Setup (Database & CLI)

### Install Supabase CLI
```bash
npm install -g supabase
```

### Initialize Supabase
```bash
supabase init
```

### Start Local Supabase
```bash
supabase start
```

### Example Schema (SQL)
```sql
-- Example: User Profiles
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Example: Courses
create table courses (
  id serial primary key,
  title text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Example: Feedback
create table feedback (
  id serial primary key,
  course_id int references courses(id),
  user_id uuid references profiles(id),
  rating int check (rating between 1 and 5),
  comment text,
  created_at timestamp with time zone default now()
);
```

### Run migrations
```bash
supabase migration new init
supabase db push
```

---

## ▶️ Run Locally

Start the dev server:

```bash
npm run dev
```

App runs at localhost

---

## 🚀 Deployment (Vercel)

### 1. Push Code to GitHub
Make sure your repository is committed and pushed to GitHub (or GitLab/Bitbucket).

### 2. Deploy on Vercel
1. Go to [Vercel](https://vercel.com)  
2. Import your repository  
3. Configure with these settings:  

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node.js Version: 18.x or higher
```

### 3. Add Environment Variables
In **Vercel Project Settings → Environment Variables**, add:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Deploy
Click **Deploy** and your app will be live 🎉

---

## 📂 Suggested Folder Structure

```
courselens/
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page-level components
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Supabase and utility functions
│   ├── styles/            # Global styles
│   ├── App.tsx            # Root component
│   └── main.tsx           # Entry point
├── .env.local             # Local environment variables
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

