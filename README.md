<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Clerk Pro v2.0 - Operations Hub

A premium-grade operations management system for the Government of Khyber Pakhtunkhwa, Education Department. Optimized for performance, security, and accessibility.

## 🚀 Key Features (v2.0 Overhaul)

- **Premium UI/UX**: Material Design 3 (M3) implementation with glassmorphism, fluid animations, and responsive layouts.
- **Performance Optimized**: 
  - ⚡ Code splitting and lazy loading for faster initial paint.
  - 🧠 Intelligent memoization of complex calculations and filters.
  - 📦 Asset compression and optimized chunking strategy.
- **Production Ready**:
  - 🛡️ Global Error Boundary handling for stability.
  - 📝 Comprehensive Audit Logging for security.
  - 🧪 Vitest-powered test suite with >80% target coverage.
  - 👷 CI/CD ready with GitHub Actions.
- **Accessibility**: Full WCAG 2.1 AA compliance with ARIA support and semantic HTML.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion.
- **Date Handling**: date-fns.
- **PDF Generation**: pdf-lib.
- **Icons**: Material Symbols.

## 💻 Local Development

1. **Install Dependencies**:
   `npm install`
2. **Setup Environment**:
   Create `.env.local` with your `GEMINI_API_KEY`.
3. **Start Development Server**:
   `npm run dev`
4. **Run Backend (AI Service)**:
   `npm run dev:server`

## 🧪 Testing & Linting

- **Run Tests**: `npm test`
- **Check Coverage**: `npm run test -- --coverage`
- **Lint Code**: `npm run lint`
- **Format Code**: `npm run format`

## 📦 Deployment

Follow the [PRODUCTION_GUIDE.md](PRODUCTION_GUIDE.md) for detailed deployment instructions.

---
*Maintained by Fazal Ali - 2026*
