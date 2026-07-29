# Arsenal AI - Web Frontend

A modern, high-performance web dashboard built for baseball analytics, performance tracking, and multi-tenant data visualization. Designed to replicate professional pitching lab interfaces (like Trackman/Rapsodo UI).

![Next.js](https://img.shields.io/badge/Next.js-14+-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2F%20DB-3ecf8e?style=flat-square&logo=supabase)

## 🚀 Features
- **Secure Authentication:** Multi-tenant user management powered by Supabase Auth with Row-Level Security (RLS).
- **Interactive Pitch Charting:** Built using Recharts to render a 1:1 square scatter plot (HB vs. IVB) from a pitcher's perspective, complete with color-coded pitch classifications and detailed hover tooltips.
- **Advanced Savant-Style Profiles:** Dynamic roster filtering that aggregates lifetime data across multiple outings, computing metrics like Whiff%, CSW%, Average Exit Velocity, and Hard-Hit Rate per pitch type.
- **Data Ingestion Engine:** Direct file-transfer bridge to the Python backend parsing raw Trackman CSV spreadsheets.

### 📊 Application Preview

<p align="center">
  <img src="/dashboard-view.png" alt="Arsenal AI Dashboard" width="800px" />
  <br>
  <em>Interactive Pitcher's Perspective Grid & Hover Metrics</em>
</p>

<p align="center">
  <img src="/savant-profile.png" alt="Advanced Savant Metrics Profile" width="800px" />
  <br>
  <em>Per-Pitch Savant Metrics (Whiff%, CSW%, Hard-Hit%)</em>
</p>

## 🛠️ Tech Stack
- **Framework:** Next.js (App Router, React Server/Client Components)
- **Styling:** Tailwind CSS, Shadcn UI primitives
- **Data Visualization:** Recharts
- **Backend Communication:** REST API integration with FastAPI / Supabase PostgreSQL Client

## 🏃‍♂️ Getting Started Locally
1. Clone the repository:
   ```bash
   git clone [https://github.com/liamprogulske/arsenal-ai-web.git](https://github.com/liamprogulske/arsenal-ai-web.git)
   ```
   
2. Install dependencies:
   ```bash
   npm install
   ```
   
4. Configure your environment variables in a `.env.local` file:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
6. Run the development server:
   ```bash
   npm run dev
   ```
