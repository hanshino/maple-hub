# Quickstart: 六轉進度 Display

## Overview

This feature adds 六轉進度 visualization to the dashboard-progress page for characters at class level 6, showing total progress with expandable detailed core information.

## Prerequisites

- Node.js 18.17+
- npm or yarn
- Nexon MapleStory OpenAPI key
- Character at class level 6

## Development Setup

1. **Environment Configuration**

   ```bash
   # Add to .env.local
   NEXT_PUBLIC_API_BASE_URL=https://open.api.nexon.com
   API_KEY=your_nexon_api_key_here
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Development Server**

   ```bash
   npm run dev
   ```

4. **Access Feature**
   - Navigate to `/dashboard-progress`
   - Search for a level 6 character
   - 六轉進度 block should appear below existing progress

## Testing

```bash
# Run all tests
npm test

# Run specific component tests
npm test -- components/HexaMatrixProgress.test.js
```

## Key Components

- `HexaMatrixProgress.js`: Main progress display component with expandable details
- `hexaMatrixUtils.js`: Calculation utilities for resource consumption
- `hexaMatrixApi.js`: API integration for Hexa Matrix data

## Data Flow

1. Character search returns OCID
2. Check character_class_level === 6
3. Fetch Hexa Matrix data from Nexon API
4. Calculate progress using level cost table
5. Render total progress with MUI Accordion for detailed core information

## Troubleshooting

- **No 六轉進度 block**: Ensure character is level 6
- **API errors**: Check API key and network connectivity
- **Calculation issues**: Verify level cost data matches specification
