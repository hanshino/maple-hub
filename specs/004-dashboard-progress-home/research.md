# Research Findings

**Feature**: Dashboard Progress Home Enhancement

## Decisions Made

- **API Integration**: Use Nexon MapleStory OpenAPI for Alliance Battlefield data via /maplestorytw/v1/user/union endpoint
- **Data Fetching**: Implement in Next.js API routes for server-side data fetching and caching
- **UI Display**: Add Alliance Battlefield fields (union_grade, union_level, union_artifact_level) to character info display
- **Home Page**: Redirect root path to dashboard-progress page
- **Page Removal**: Remove dashboard page and other unused pages

## Rationale

- Nexon API provides reliable data source for Alliance Battlefield information
- Next.js API routes allow for efficient data fetching and error handling
- UI additions enhance user experience without disrupting existing layout
- Simplifying to single page reduces maintenance complexity

## Alternatives Considered

- Client-side API calls: Rejected due to potential CORS issues and lack of caching
- Full data display: Rejected to keep UI focused on key metrics
- Keeping multiple pages: Rejected due to current scope focusing on single functionality
