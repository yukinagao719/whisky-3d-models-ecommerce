# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
# Initial setup
npm run dev:setup    # Generate Prisma client, run migrations, and seed DB

# Development server
npm run dev          # Start Next.js development server

# Testing
npm test             # Run unit tests (Jest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci      # CI-optimized test run

# Code quality
npm run lint         # ESLint check
npm run build        # Production build with Prisma operations
```

### Database Operations
```bash
# Reset demo environment (production only)
npm run demo:reset   # Force reset database for demo

# Manual Prisma operations
npx prisma generate  # Generate Prisma client
npx prisma migrate deploy # Apply migrations
npx prisma db seed   # Seed database with test data
npx prisma studio    # Open Prisma Studio for database inspection
```

### Stripe Development
```bash
# Webhook testing (requires Stripe CLI)
stripe listen --forward-to localhost:3000/api/checkout/webhook
stripe login  # Authenticate with correct Stripe account
```

## High-Level Architecture

### Core Application Structure
This is a **Next.js 14 App Router** e-commerce application for 3D whisky models with the following key architectural layers:

**Frontend**: React with TypeScript, using React Three Fiber for 3D model rendering and Zustand for state management.

**Authentication**: Multi-provider auth system using Auth.js with support for OAuth (Google, GitHub) and credential-based authentication.

**API Layer**: Next.js API routes handle business logic, with comprehensive rate limiting via Upstash Redis and input validation.

**Database**: PostgreSQL (Neon) with Prisma ORM, including models for Users, Products, Orders, Purchases, and Tokens.

**File Storage**: AWS S3 with CloudFront CDN for 3D models and images, featuring signed URLs for private content protection.

**Payment Processing**: Stripe integration with webhook handling for purchase completion and download token generation.

### Key Business Logic

**Purchase Flow**: 
1. User adds 3D models to cart → Stripe checkout → Webhook processes payment → Generates time-limited download tokens → Sends email with download links
2. Download tokens expire after 1 week, managed via database cleanup

**3D Model Rendering**: 
- Uses React Three Fiber with custom lighting setup (no HDR dependencies)
- Models loaded via GLTFLoader with error boundaries and loading states
- Mobile-responsive controls and optimized for performance

**Security Layers**:
- Rate limiting on authentication endpoints and downloads
- Input validation using custom utility functions  
- CloudFront signed URLs for protecting premium 3D model files
- Content Security Policy (CSP) configured for Stripe and Vercel Live compatibility
- Comprehensive error handling with user-friendly messages

### Important Configuration Files

**Database**: `prisma/schema.prisma` - Defines all data models and relationships
**Authentication**: `src/auth.ts` - Auth.js configuration with providers and callbacks  
**Middleware**: `src/middleware.ts` - Rate limiting and route protection (simplified from 321 to 210 lines)
**Email System**: `src/lib/email.ts` - Template-based email system (simplified from 357 to 217 lines)
**Validation**: `src/utils/validation.ts` - Input validation utilities (simplified from 137 to 111 lines)
**CSP Security**: `next.config.mjs` - Content Security Policy headers for Stripe and Vercel Live
**Stripe Config**: `src/lib/stripe-server.ts` - Uses API version 2025-01-27.acacia for webhook compatibility

### Development Notes

**Portfolio Optimizations**: This codebase has been simplified for portfolio presentation:
- Removed lodash dependency in favor of custom debounce implementation
- Simplified HDR environment mapping to custom lighting for 3D models  
- Consolidated middleware rate limiting logic
- E2E tests (Playwright) excluded from TypeScript compilation but preserved for reference

**Testing Strategy**: Unit tests cover API logic, components, and utilities. E2E tests exist in `tests/e2e/` but are excluded from main development workflow.

**Environment Management**: Uses separate `.env` files for development and production, with different CloudFront configurations for asset delivery.

## Critical Paths for Development

**Authentication Changes**: Always update both `src/auth.ts` and corresponding API routes in `src/app/api/auth/`. The system uses NextAuth.js v5 with custom providers.

**3D Model Viewer**: Main components in `src/components/model-viewer/` with `SafeStage.tsx` containing custom lighting setup. WebGL context loss handling is implemented in `Model.tsx`.

**Database Changes**: Run migrations and update seed file at `prisma/seed.ts`. Demo users have fixed IDs defined in `src/lib/demo.ts`.

**Payment Flow**: Webhook handling in `src/app/api/checkout/webhook/route.ts` processes Stripe events. Must maintain API version compatibility and ensure proper error handling.

**CSP Updates**: When adding new external services, update Content Security Policy in `next.config.mjs`. Current CSP allows Stripe and Vercel Live domains.

**Stripe Integration**: Use API version 2025-01-27.acacia. Webhook secrets differ between development (Stripe CLI) and production (Stripe Dashboard). Products must have `productId` metadata linking to database records.