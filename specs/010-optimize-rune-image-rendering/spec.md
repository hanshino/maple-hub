# Feature Specification: Optimize Rune Image Rendering

**Feature Branch**: `010-optimize-rune-image-rendering`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "現在這個元件有個問題，他的圖片會先透過 next 後端來產生，這個會對我們後端產生流量，但實際上 nexon api 有回傳 nexon 圖片網址，我們應該多利用這個網址來渲染圖片，等等我會補充具體產生出來的 html"

## Clarifications

### Session 2025-10-21

- Q: Should the scope of this feature be expanded to audit and update all image usages in the application that currently use Next.js Image component with Nexon URLs, ensuring complete avoidance of backend image generation? → A: Yes, expand scope to full application audit

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Display Rune Images Using Nexon URLs (Priority: P1)

As a user viewing the rune systems in the MapleStory dashboard, I want rune images to load directly from Nexon-provided URLs instead of being generated through our Next.js backend, so that I can see the images faster and reduce unnecessary traffic on our servers.

**Why this priority**: This is the core optimization that directly addresses the traffic issue and improves user experience by faster image loading.

**Independent Test**: Can be fully tested by inspecting the rendered HTML to verify images use Nexon URLs, and monitoring backend traffic to confirm reduction.

**Acceptance Scenarios**:

1. **Given** the RuneSystems component is loaded with rune data from Nexon API, **When** the component renders rune cards, **Then** each rune image should use the direct Nexon URL as the src attribute.
2. **Given** a rune has a valid Nexon image URL, **When** the page loads, **Then** the image should display without any backend processing.

---

### User Story 2 - Handle Invalid Nexon URLs (Priority: P2)

As a user, if a Nexon image URL is invalid or fails to load, I want a fallback mechanism so that the interface remains functional and doesn't show broken images.

**Why this priority**: Ensures robustness of the feature, preventing user experience degradation.

**Independent Test**: Can be tested by providing invalid URLs and verifying fallback behavior.

**Acceptance Scenarios**:

1. **Given** a rune has an invalid Nexon image URL, **When** the image fails to load, **Then** a placeholder or error state should be displayed.

---

### User Story 3 - Audit and Optimize All Nexon Image Usages (Priority: P1)

As a developer maintaining the MapleStory dashboard, I want to audit all components that use Next.js Image component with Nexon URLs and replace them with direct Nexon URLs, so that the entire application avoids backend image generation and reduces server traffic comprehensively.

**Why this priority**: Ensures complete elimination of the traffic issue across the application, preventing future similar problems.

**Independent Test**: Can be tested by auditing all components and verifying no Next.js Image usage with Nexon URLs remains.

**Acceptance Scenarios**:

1. **Given** all components in the application that display Nexon images, **When** the audit is complete, **Then** all such components should use direct Nexon URLs instead of Next.js Image component.
2. **Given** new components are added that use Nexon images, **When** they are implemented, **Then** they should follow the direct URL pattern established by this feature.

---

### Edge Cases

- What happens when Nexon API returns empty or null image URLs?
- How does the system handle network timeouts when loading Nexon images?
- What if the Nexon URLs change or become inaccessible?
- How to handle components that currently use Next.js Image with Nexon URLs in EquipmentDialog or other parts of the application?
- What if new components are added that use Nexon images - how to ensure they follow the direct URL pattern?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The RuneSystems component MUST use the direct Nexon API image URL (e.g., https://open.api.nexon.com/static/maplestorytw/item/icon/...) directly in img src attributes instead of routing through Next.js Image component (/next/image?url=...).
- **FR-002**: The system MUST implement fallback handling for cases where Nexon image URLs are invalid or fail to load.
- **FR-003**: Image loading MUST not impact the overall page performance or cause excessive backend traffic.
- **FR-004**: The system MUST audit all components in the application that use Next.js Image component with Nexon URLs and replace them with direct Nexon URL usage to ensure complete avoidance of backend image generation.

### Key Entities _(include if feature involves data)_

- **Rune**: Represents a rune with attributes including symbol_name and image URL from Nexon API.
- **Equipment Item**: Represents equipment with attributes including item_name and item_icon URL from Nexon API.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: All Nexon images across the application load directly from Nexon URLs without backend processing, reducing server traffic by at least 50% for image requests.
- **SC-002**: Page load time for sections with Nexon images improves by 20% due to eliminated backend image generation.
- **SC-003**: Users experience no broken images, with fallback mechanisms handling 100% of invalid URL cases.
- **SC-004**: Audit confirms zero usage of Next.js Image component with Nexon URLs in the application codebase.
