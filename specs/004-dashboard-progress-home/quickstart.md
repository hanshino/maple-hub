# Quickstart Guide

## Prerequisites

- Node.js 18.17 or higher
- npm or yarn
- Nexon MapleStory OpenAPI key

## Setup

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd maplestory
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment file:

   ```bash
   cp .env.example .env.local
   ```

4. Add your Nexon API key to `.env.local`:
   ```
   API_KEY=your_nexon_api_key_here
   ```

## Development

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

3. The dashboard-progress page will load as the home page

## Testing

Run the test suite:

```bash
npm test
```

## Key Features

- Search for MapleStory characters
- View character details including Alliance Battlefield information
- Responsive design optimized for all devices

## API Endpoints

- `GET /api/character/search?character_name={name}` - Search characters
- `GET /api/characters/{ocid}` - Get character details
- `GET /api/union/{ocid}` - Get Alliance Battlefield data
