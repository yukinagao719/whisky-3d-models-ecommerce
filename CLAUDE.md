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
- Comprehensive error handling with user-friendly messages

### Important Configuration Files

**Database**: `prisma/schema.prisma` - Defines all data models and relationships
**Authentication**: `src/auth.ts` - Auth.js configuration with providers and callbacks  
**Middleware**: `src/middleware.ts` - Rate limiting and route protection (simplified from 321 to 210 lines)
**Email System**: `src/lib/email.ts` - Template-based email system (simplified from 357 to 217 lines)
**Validation**: `src/utils/validation.ts` - Input validation utilities (simplified from 137 to 111 lines)

### Development Notes

**Portfolio Optimizations**: This codebase has been simplified for portfolio presentation:
- Removed lodash dependency in favor of custom debounce implementation
- Simplified HDR environment mapping to custom lighting for 3D models  
- Consolidated middleware rate limiting logic
- E2E tests (Playwright) excluded from TypeScript compilation but preserved for reference

**Testing Strategy**: Unit tests cover API logic, components, and utilities. E2E tests exist in `tests/e2e/` but are excluded from main development workflow.

**Environment Management**: Uses separate `.env` files for development and production, with different CloudFront configurations for asset delivery.

## Critical Paths for Development

When modifying authentication flows, always update both `src/auth.ts` and the corresponding API routes in `src/app/api/auth/`.

For 3D model viewer changes, the main components are in `src/components/model-viewer/` with `SafeStage.tsx` containing the lighting setup.

Database schema changes require running migrations and updating the seed file at `prisma/seed.ts`.

Payment flow modifications must consider webhook handling in `src/app/api/checkout/webhook/route.ts` and email template generation.