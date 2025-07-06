# Deployment Guide

## Overview

This project uses automated CI/CD pipelines with GitHub Actions for testing, building, and deploying to Vercel.

## Environment Setup

### Required Secrets

Configure the following secrets in your GitHub repository settings:

#### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Optional Security Scanning
```
SNYK_TOKEN=your_snyk_token  # For vulnerability scanning
```

### Environment Variables

Each environment (development, staging, production) requires specific environment variables:

#### Development (.env)
```env
APP_URL=http://localhost:3000
DATABASE_URL=your_dev_database_url
AUTH_SECRET=your_auth_secret
# ... other development variables
```

#### Production (.env.production)
```env
APP_URL=https://your-production-domain.com
DATABASE_URL=your_production_database_url
AUTH_SECRET=your_production_auth_secret
# ... other production variables
```

## Deployment Workflows

### 1. Pull Request Workflow

**Triggers:** PR opened, synchronized, or reopened
**Actions:**
- Lint and type checking
- Unit tests
- Build verification
- Bundle size analysis
- Lighthouse performance check
- Security scanning
- Deploy preview to Vercel

### 2. Main Branch Workflow

**Triggers:** Push to main branch
**Actions:**
- Full test suite (unit + E2E)
- Security scanning
- Build verification
- Deploy to production (Vercel)

### 3. Release Workflow

**Triggers:** Git tag creation (v*)
**Actions:**
- Run all tests
- Create GitHub release with changelog
- Deploy to production
- Health check verification
- Post-deployment monitoring

## Manual Deployment

### Local Development
```bash
# Setup development environment
npm run dev:setup

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Testing Before Deployment
```bash
# Run all tests
npm run test:ci
npm run test:e2e

# Check code quality
npm run lint
npx tsc --noEmit

# Security audit
npm audit
```

## Vercel Configuration

### Project Settings
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm ci`

### Environment Variables in Vercel
Add all production environment variables in the Vercel dashboard under:
Settings → Environment Variables

### Domain Configuration
1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Enable automatic HTTPS

## Database Migrations

### Development
```bash
# Generate Prisma client
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed database
npx prisma db seed
```

### Production
Migrations are automatically applied during the build process via:
```bash
npm run build
```

## Monitoring and Health Checks

### Health Check Endpoints
- `/api/health` - Basic health check
- `/api/status` - Detailed system status

### Monitoring
- Automatic health checks after deployment
- Performance monitoring via Lighthouse
- Security monitoring via CodeQL and Snyk
- Bundle size tracking

## Rollback Procedure

### Vercel Rollback
1. Go to Vercel dashboard
2. Navigate to your project
3. Click on the "Deployments" tab
4. Find the previous working deployment
5. Click "Promote to Production"

### Git Rollback
```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force-with-lease
```

## Troubleshooting

### Common Issues

#### Build Failures
1. Check environment variables
2. Verify database connectivity
3. Check for TypeScript errors
4. Review dependency issues

#### Deployment Failures
1. Check Vercel function logs
2. Verify environment variables in Vercel
3. Check database migrations
4. Review API route implementations

#### Test Failures
1. Check test environment setup
2. Verify test database configuration
3. Review E2E test browser compatibility
4. Check for race conditions in tests

### Debugging Commands
```bash
# View Vercel logs
vercel logs

# Check local build
npm run build
npm start

# Debug specific tests
npm run test -- --verbose
npm run test:e2e:headed
```

## Security Considerations

### Secrets Management
- Never commit secrets to repository
- Use environment variables for all sensitive data
- Rotate secrets regularly
- Use different secrets for each environment

### Deployment Security
- All deployments use HTTPS
- Environment variables are encrypted
- Security scanning runs on every deployment
- Dependencies are regularly updated via Dependabot

### Access Control
- Limit GitHub repository access
- Use branch protection rules
- Require PR reviews for main branch
- Enable 2FA for all team members

## Performance Optimization

### Build Optimization
- Code splitting enabled
- Image optimization configured
- Bundle analysis on every build
- Tree shaking for unused code

### Runtime Optimization
- CDN delivery via Vercel
- Automatic image optimization
- Edge caching configured
- Performance monitoring enabled