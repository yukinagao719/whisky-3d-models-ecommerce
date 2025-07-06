# CI/CD Setup Guide

## Overview

This guide explains how to set up the CI/CD pipeline for complete control over deployments, replacing Vercel's automatic Git integration.

## 1. Disable Vercel Automatic Deployments

### Step 1: Access Vercel Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Git**

### Step 2: Disable Git Integration
1. Find the **Git Integration** section
2. Click **Disconnect** to disable automatic deployments
3. Confirm the disconnection

### Alternative: Configure Git Integration
If you prefer to keep Git integration but prevent automatic deployments:
1. Go to **Settings** → **Git** → **Ignored Build Step**
2. Add the following command:
   ```bash
   [[ "$VERCEL_GIT_COMMIT_REF" != "main" ]] && [[ "$VERCEL_ENV" != "production" ]]
   ```
   This prevents automatic production deployments except from CI/CD.

## 2. Configure GitHub Secrets

### Required Secrets
Add these secrets in your GitHub repository settings (**Settings** → **Secrets and variables** → **Actions**):

#### Vercel Configuration
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Optional: Security Tools
```
SNYK_TOKEN=your_snyk_token
CODECOV_TOKEN=your_codecov_token
```

### How to Get Vercel Values

#### VERCEL_TOKEN
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Create a new token with appropriate scopes
3. Copy the token value

#### VERCEL_ORG_ID
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` and authenticate
3. Navigate to your project directory
4. Run `vercel link` to link the project
5. Check `.vercel/project.json` for `orgId`

#### VERCEL_PROJECT_ID
1. After running `vercel link` (above)
2. Check `.vercel/project.json` for `projectId`
3. Or find it in Vercel dashboard under project settings

## 3. Configure Environment Protection

### Production Environment
1. Go to **Settings** → **Environments** in GitHub
2. Create a new environment named `production`
3. Add protection rules:
   - **Required reviewers**: Add yourself or team members
   - **Wait timer**: Optional delay before deployment
   - **Deployment branches**: Only `main` branch

### Environment Secrets
Add production-specific secrets to the `production` environment:
```
DATABASE_URL=your_production_database_url
AUTH_SECRET=your_production_auth_secret
# ... other production variables
```

## 4. Test the Pipeline

### First Deployment
1. Create a feature branch
2. Make a small change
3. Push and create a PR
4. Verify that PR checks run (without deploying to production)
5. Merge to main
6. Verify that production deployment runs

### Verification Steps
- [ ] PR triggers preview deployment
- [ ] All tests pass before deployment
- [ ] Main branch deployment requires all checks to pass
- [ ] Health checks run after deployment
- [ ] Failed deployments are properly reported

## 5. Monitoring and Notifications

### Slack Integration (Optional)
Add Slack webhook for deployment notifications:
```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Email Notifications
GitHub automatically sends email notifications for:
- Failed workflows
- Deployment status changes
- Security alerts

## 6. Branch Protection Rules

### Configure Main Branch Protection
1. Go to **Settings** → **Branches**
2. Add rule for `main` branch:
   - **Require pull request reviews**: Enable
   - **Require status checks**: Enable and select:
     - `Lint and Type Check`
     - `Unit Tests`
     - `Build Check`
     - `Security Scan`
   - **Require up-to-date branches**: Enable
   - **Include administrators**: Enable

## 7. Troubleshooting

### Common Issues

#### Deployment Fails
1. Check GitHub Actions logs
2. Verify all secrets are set correctly
3. Ensure Vercel project is properly linked
4. Check environment variables in Vercel dashboard

#### Tests Fail in CI
1. Verify `.env.test.example` is complete
2. Check database setup in CI
3. Ensure all dependencies are installed
4. Review test timeout settings

#### Security Scan Failures
1. Run `npm audit` locally to identify issues
2. Update vulnerable dependencies
3. Add exemptions for false positives (if necessary)

### Debug Commands
```bash
# Test CI scripts locally
npm run ci:test
npm run ci:e2e

# Check workflow syntax
npx @github/actionlint

# Verify Vercel configuration
vercel --version
vercel whoami
vercel ls
```

## 8. Maintenance

### Regular Tasks
- Review and update dependencies via Dependabot PRs
- Monitor security alerts and apply fixes
- Review workflow performance and optimize
- Update Node.js version in workflows as needed

### Performance Optimization
- Cache dependencies aggressively
- Parallelize independent jobs
- Use matrix builds for multi-environment testing
- Monitor workflow execution times

### Security Best Practices
- Rotate secrets regularly
- Use least-privilege access for tokens
- Enable branch protection rules
- Review and approve all dependency updates
- Monitor for security vulnerabilities

## 9. Advanced Configuration

### Custom Deployment Conditions
Add custom logic for when to deploy:
```yaml
if: |
  github.ref == 'refs/heads/main' && 
  github.event_name == 'push' &&
  !contains(github.event.head_commit.message, '[skip deploy]')
```

### Multi-Environment Deployment
Configure staging environment:
1. Create `staging` environment in GitHub
2. Add staging-specific secrets
3. Modify workflow to deploy to staging on develop branch

### Performance Testing
Add lighthouse CI for performance regression testing:
```yaml
- name: Lighthouse CI
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

This CI/CD setup provides robust quality gates while maintaining deployment control and monitoring capabilities.