# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
bun run dev              # Start development server on port 8080
bun run preview          # Preview production build
```

### Building & Deployment
```bash
bun run build            # Build production version
bun run deploy           # Build and deploy to Cloudflare Workers
```

### Code Quality
```bash
bun run lint             # Run ESLint for code linting
```

### Testing
```bash
bun test                 # Run tests (minimal test coverage currently)
```

## Architecture

### Technology Stack
- **Frontend**: React 18.3.1 + TypeScript 5.5.3 + Vite 7.0.0
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Appwrite 18.1.1 (Backend as a Service)
- **Deployment**: Cloudflare Workers
- **Package Manager**: Bun (replaces npm)

### Key Architectural Patterns

1. **Component Organization**
   - `/components/ui/` - shadcn/ui base components
   - `/components/features/` - Feature-specific components (reviews, search, etc.)
   - `/components/layout/` - Layout components (Header, Footer, Navigation)
   - `/components/auth/` - Authentication components
   - `/pages/` - Route-level page components

2. **State Management**
   - Context API for global state (Auth, Language, Theme, Recaptcha)
   - Tanstack Query for server state management
   - Local state with React hooks

3. **API Integration**
   - All API calls through `/services/` directory
   - Appwrite SDK for backend operations
   - Environment variables for configuration

4. **Internationalization**
   - Multi-language support (en, zh-CN, zh-TW)
   - Translation files in `/locales/`
   - Language context for runtime switching

5. **Code Splitting Strategy**
   - Manual chunks in vite.config.ts:
     - `react-vendor`: React and related libraries
     - `ui-vendor`: UI component libraries
     - `utils-vendor`: Utility libraries
     - `app`: Application code

### Important Configurations

1. **Path Aliases**
   - `@/` maps to `/src/` directory
   - Used throughout the codebase for clean imports

2. **Environment Variables**
   - Appwrite configuration (endpoint, project ID, database ID)
   - Google reCAPTCHA site key
   - Build-time variables handled by Vite

3. **TypeScript Configuration**
   - Relaxed strictness (`noImplicitAny: false`)
   - Path mapping for `@/` alias
   - Separate configs for app and node environments

### Backend Functions (Appwrite)
Located in `/functions/` directory:
- `send-verification-email`: Handles email verification
- `cleanup-expired-codes`: Scheduled cleanup job
- `get-user-stats`: User statistics API
- `handle-review-vote`: Manages voting on reviews
- `user-validation`: Additional user validation logic

### Database Structure

#### Main Database: `lingubible`
1. **courses** - Course catalog with multilingual support
   - Fields: course_code, course_title, course_title_tc, course_title_sc, department, course_language
   
2. **instructors** - Instructor profiles
   - Fields: name, name_tc, name_sc, email, department
   
3. **teaching_records** - Links courses to instructors by term
   - Fields: course_code, term_code, instructor_name, session_type, service_learning
   
4. **terms** - Academic terms
   - Fields: term_code, name, start_date, end_date
   
5. **reviews** - Course reviews with detailed ratings
   - Fields: user_id, course_code, term_code, workload/difficulties/usefulness ratings, final_grade, comments
   - Complex field: instructor_details (JSON with per-instructor feedback)
   
6. **review_votes** - Upvote/downvote system
   - Fields: review_id, user_id, vote_type ('up'/'down')
   
7. **user_avatars** - Custom user avatars
   - Fields: userId, animal, backgroundIndex

#### Other Databases
- **favorites** database: `user_favorites` collection for course/instructor favorites
- **user-stats-db**: Real-time analytics (`user-sessions`, `user-stats`)
- **verification_system**: Email verification codes

#### Key Relationships
- Courses ↔ Instructors: Many-to-many via teaching_records
- Reviews → Courses/Terms: Foreign key relationships
- Multilingual fields: Base field + `_tc` (Traditional Chinese) + `_sc` (Simplified Chinese)

### Development Notes
- Development server runs on port 8080
- Uses Bun for package management (not npm/yarn)
- Vite 7 requires Node.js >= 20.19.0
- Browser targets: Chrome 107+, Firefox 104+, Safari 16.0+
- Performance-focused with lazy loading and code splitting
- Mobile-first responsive design with swipe gestures