<!-- Sync Impact Report
Version change: 2.2.0 → 2.3.0
List of modified principles: none
Added sections: XI. Naming Conventions, XII. Minimalist Implementation Philosophy
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

### X. MUI Component Maximization

Maximize utilization of Material-UI components to ensure design consistency and reduce development overhead; Avoid creating custom components when suitable MUI equivalents exist; Leverage MUI's theming and component library for all UI elements

### XI. Naming Conventions

Follow the project's established naming conventions: camelCase for variables and functions, PascalCase for React components, kebab-case for files and directories, consistent with the existing codebase patterns

### XII. Minimalist Implementation Philosophy

Avoid over-engineering; Focus on functional implementation without unnecessary abstractions; Implement only what is required for the current feature scope; Prefer simple, direct solutions over complex architectures

## Additional Constraints

Technology stack: JavaScript ES2020, Next.js 14, React 18, Axios, Material-UI, Jest, Recharts, Tailwind CSS

Deployment: Vercel or manual with Node.js 18+

Security: Client-side data handling, API key management for production

## Development Workflow

Feature development follows user story prioritization; Test-first approach for critical functionality; Code review for all changes; Accessibility audits before deployment

## Governance

Constitution supersedes other practices; Amendments require documentation and team approval; Versioning follows semantic versioning for governance changes

**Version**: 2.3.0 | **Ratified**: 2025-10-16 | **Last Amended**: 2025-10-26
