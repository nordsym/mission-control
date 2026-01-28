# 🛸 Symbot Mission Control

A real-time dashboard for solo founders to monitor and control their AI agent.

![Mission Control](https://img.shields.io/badge/Status-Active-00D4FF)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Convex](https://img.shields.io/badge/Convex-Realtime-9370DB)

## Features

- **📊 Dashboard** - Today's summary, quick stats, recent activity preview
- **📜 Activity Feed** - Real-time log with status filters (auto/notified/pending)
- **✅ Approval Queue** - Review and approve/reject pending actions with bulk support
- **⌨️ Command Bar** - Quick commands with ⌘K shortcut
- **⚙️ Settings** - Agent config and webhook integration

## Tech Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript
- **Backend:** Convex (real-time database + serverless functions)
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel + Convex

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Convex account (free tier works)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/NordSym/mission-control.git
   cd mission-control
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Convex**
   ```bash
   npx convex dev
   ```
   This will prompt you to log in and create a new project.

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   Visit [http://localhost:3000](http://localhost:3000)

The app will auto-seed with demo data on first load!

## Project Structure

```
mission-control/
├── convex/                 # Backend (Convex)
│   ├── schema.ts          # Database schema
│   ├── activities.ts      # Activity queries/mutations
│   ├── approvals.ts       # Approval management
│   ├── commands.ts        # Command handling
│   ├── dailySummaries.ts  # Daily summaries
│   ├── settings.ts        # App settings
│   └── seed.ts            # Demo data seeder
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── page.tsx       # Dashboard
│   │   ├── activity/      # Activity feed
│   │   ├── approvals/     # Approval queue
│   │   └── settings/      # Settings page
│   └── components/        # React components
│       ├── Navigation.tsx
│       ├── CommandBar.tsx
│       ├── ActivityCard.tsx
│       ├── ApprovalCard.tsx
│       └── StatCard.tsx
```

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
```

The Convex URL is automatically set when you run `npx convex dev`.

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Connect repo to Vercel
3. Add `NEXT_PUBLIC_CONVEX_URL` environment variable
4. Deploy!

### Deploy Convex

```bash
npx convex deploy
```

## Design System

- **Base:** #050608
- **Surface:** #0d0f12
- **Cyan:** #00D4FF (primary accent)
- **Purple:** #9370DB (secondary)
- **Orange:** #FF8C00 (warnings)
- **Green:** #10B981 (success)
- **Red:** #EF4444 (danger)

## License

MIT © NordSym

---

Built with ❤️ for solo founders who automate everything.
