<!-- Sync Impact Report
Version change: 2.0.2 → 2.1.0
List of modified principles: none
Added sections: VIII. API Security and Architecture, IX. Code Quality Gates
Removed sections: none
Templates requiring updates: plan-template.md (Constitution Check updated)
Follow-up TODOs: none
-->

# MapleStory Constitution

## Core Principles

### I. User-Centric Design

Prioritize intuitive user interfaces and accessibility; Ensure responsive design across all devices; Optimize for performance and fast loading times

### II. API Integration Excellence

Handle external API integrations robustly; Implement graceful error handling and recovery; Use efficient caching strategies for data persistence

### III. Component Reusability

Build modular, reusable React components; Maintain consistent styling with Material-UI; Follow semantic HTML and accessibility standards

### IV. Comprehensive Testing

Write unit tests for all components; Include integration tests for API routes; Ensure accessibility and performance testing coverage

### V. Data Visualization

Provide clear and interactive data visualizations; Use charts for progress tracking; Support real-time data updates where applicable

### VI. Performance & Optimization

Apply React optimization techniques (memo, lazy loading); Implement efficient state management; Minimize bundle sizes and loading times

### VII. Simplicity & Maintainability

Write clean, readable code following ES2020 standards; Maintain consistent project structure; Keep documentation up-to-date

### VIII. API Security and Architecture

Nexon OpenAPI integrations MUST be routed through Next.js backend API routes; Frontend components MUST NOT directly call external APIs; All API calls MUST go through server-side endpoints for security and data consistency

### IX. Code Quality Gates

Before any commit, developers MUST run `npm run lint` and `npm run format`; All linting and formatting issues MUST be resolved before submission; Automated checks SHOULD be implemented in CI/CD pipelines

## Additional Constraints

Technology stack: JavaScript ES2020, Next.js 14, React 18, Axios, Material-UI, Jest, Recharts, Tailwind CSS

Deployment: Vercel or manual with Node.js 18+

Security: Client-side data handling, API key management for production

## Development Workflow

Feature development follows user story prioritization; Test-first approach for critical functionality; Code review for all changes; Accessibility audits before deployment

## Governance

Constitution supersedes other practices; Amendments require documentation and team approval; Versioning follows semantic versioning for governance changes

**Version**: 2.1.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-20
