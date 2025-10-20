# Research: Optimize Rune Image Rendering

## Decision: Replace Next.js Image with Direct img Tags

**Rationale**: Next.js Image component provides optimization features like lazy loading, resizing, and WebP conversion, but for external Nexon URLs, this causes unnecessary backend processing and traffic. Direct img tags eliminate this overhead while maintaining functionality.

**Alternatives Considered**:

- Keep Next.js Image but configure to skip optimization (rejected: still routes through backend)
- Use custom image loader (rejected: adds complexity without benefit)
- Implement custom image component (rejected: overkill for simple replacement)

## Decision: Implement Error Fallback Handling

**Rationale**: Direct img tags don't have built-in error handling like Next.js Image. Need to implement onError handlers to show placeholder images when Nexon URLs fail.

**Alternatives Considered**:

- No fallback (rejected: poor UX with broken images)
- Use Next.js Image only for fallbacks (rejected: defeats purpose of optimization)
- Lazy load with intersection observer (rejected: adds complexity)

## Decision: Full Application Audit Approach

**Rationale**: Use grep search for "Image.*from.*next/image" and "nexon.com" patterns to identify all usage. Manual review of components to ensure comprehensive coverage.

**Alternatives Considered**:

- Manual code review only (rejected: error-prone for large codebase)
- Automated script (rejected: overkill for small changes)
- Component-level search (rejected: might miss indirect usage)

## Decision: Maintain Accessibility Standards

**Rationale**: Ensure alt text, loading states, and error states maintain accessibility. Use semantic HTML and ARIA attributes as in current implementation.

**Alternatives Considered**:

- Skip accessibility (rejected: violates constitution principles)
- Use different accessibility approach (rejected: current implementation is solid)

## Decision: Testing Strategy

**Rationale**: Update existing Jest tests to verify img src attributes use direct Nexon URLs. Add integration tests for image loading and error states.

**Alternatives Considered**:

- No test updates (rejected: breaks existing test assertions)
- Full e2e testing (rejected: overkill for component changes)
