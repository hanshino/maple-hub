<!-- Sync Impact Report
Version change: 2.3.0 → 3.0.0
List of modified principles:
  - II. API Integration Excellence → II. API Integration Excellence (updated for Vercel constraints)
  - VIII. API Security and Architecture → VIII. API Security and Architecture (updated with Vercel cron patterns)
Added sections:
  - XIII. Vercel Platform Constraints
  - XIV. Zero-Cost External Service Integration
Removed sections: none
Templates requiring updates:
  - plan-template.md ✅ (no update needed - generic structure)
  - spec-template.md ✅ (no update needed - generic structure)
  - tasks-template.md ✅ (no update needed - generic structure)
Follow-up TODOs: none
Technology Stack Updated:
  - Next.js 14 → Next.js 15 (15.5.6)
  - React 18 → React 19 (19.2.1)
  - MUI 5 → MUI 7 (7.3.6)
  - Jest 29 → Jest 30 (30.2.0)
  - Recharts 2 → Recharts 3 (3.5.1)
  - Tailwind CSS 3 → Tailwind CSS 4 (4.1.17)
-->

# MapleStory Constitution

## Core Principles

### I. User-Centric Design

Prioritize intuitive user interfaces and accessibility; Ensure responsive design across all devices; Optimize for performance and fast loading times

### II. API Integration Excellence

Handle external API integrations robustly; Implement graceful error handling and recovery; Use efficient caching strategies for data persistence; Design APIs to be callable externally for scheduled task compatibility with third-party cron services

### III. Component Reusability

Build modular, reusable React components; Maintain consistent styling with Material-UI; Follow semantic HTML and accessibility standards

### IV. Comprehensive Testing

Write unit tests for all components; Include integration tests for API routes; Ensure accessibility and performance testing coverage

### V. Data Visualization

Provide clear and interactive data visualizations; Use charts for progress tracking; Support real-time data updates where applicable

### VI. Performance & Optimization

Apply React optimization techniques (memo, lazy loading); Implement efficient state management; Minimize bundle sizes and loading times

### VII. Simplicity & Maintainability

Write clean, readable code following ES2020+ standards; Maintain consistent project structure; Keep documentation up-to-date

### VIII. API Security and Architecture

Nexon OpenAPI integrations MUST be routed through Next.js backend API routes; Frontend components MUST NOT directly call external APIs; All API calls MUST go through server-side endpoints for security and data consistency; Scheduled/cron API endpoints MUST be exposed as public endpoints under `/api/cron/*` for external service integration (e.g., cron-job.org, GitHub Actions, UptimeRobot)

### IX. Code Quality Gates

Before any commit, developers MUST run `npm run lint` and `npm run format`; All linting and formatting issues MUST be resolved before submission; Automated checks SHOULD be implemented in CI/CD pipelines

### X. MUI Component Maximization

Maximize utilization of Material-UI components to ensure design consistency and reduce development overhead; Avoid creating custom components when suitable MUI equivalents exist; Leverage MUI's theming and component library for all UI elements

### XI. Naming Conventions

Follow the project's established naming conventions: camelCase for variables and functions, PascalCase for React components, kebab-case for files and directories, consistent with the existing codebase patterns

### XII. Minimalist Implementation Philosophy

Avoid over-engineering; Focus on functional implementation without unnecessary abstractions; Implement only what is required for the current feature scope; Prefer simple, direct solutions over complex architectures

### XIII. Vercel Platform Constraints

This project is deployed on Vercel's free tier (Hobby plan); Developers MUST adhere to the following platform limitations:

- **Serverless Functions**: 10-second execution timeout (Hobby); design API routes to complete within this limit
- **No Native Cron**: Vercel Cron requires Pro plan; expose `/api/cron/*` endpoints for external cron services instead
- **Edge Functions**: Use Edge Runtime sparingly; prefer Node.js runtime for database operations
- **Build Time**: 45-minute limit; keep builds optimized
- **Bandwidth**: 100GB/month on Hobby; implement caching strategies to reduce data transfer
- **No Persistent Storage**: Use external services (Google Sheets, external databases) for persistent data; in-memory caching is session-only
- **Cold Starts**: Serverless functions may have cold starts; design for stateless operation

### XIV. Zero-Cost External Service Integration

Maximize usage of free-tier external services to avoid costs:

- **Scheduled Tasks**: Use cron-job.org, GitHub Actions, or UptimeRobot (free tier) to call exposed API endpoints
- **Data Storage**: Google Sheets API (free within quota) for persistent data storage
- **Monitoring**: Use free monitoring tools (UptimeRobot, BetterStack free tier)
- **Analytics**: Vercel Analytics (limited free tier) or self-implemented logging
- When features require paid services, document alternatives or gracefully degrade functionality

## Additional Constraints

Technology stack: JavaScript ES2020+, Next.js 15, React 19, Axios, Material-UI 7, Jest 30, Recharts 3, Tailwind CSS 4

Deployment: Vercel (Hobby plan - free tier)

Runtime: Node.js 18.17+ (Vercel default)

Security: Client-side data handling, API key management for production, CRON_SECRET for scheduled endpoint authentication

## Development Workflow

Feature development follows user story prioritization; Test-first approach for critical functionality; Code review for all changes; Accessibility audits before deployment; Validate Vercel deployment constraints before implementing new features

## Governance

Constitution supersedes other practices; Amendments require documentation and team approval; Versioning follows semantic versioning for governance changes

**Version**: 3.0.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-12-06
