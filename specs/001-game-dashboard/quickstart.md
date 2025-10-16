# Quickstart: Game Content Dashboard

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Access to the game's OpenAPI (API key if required)

## Installation

1. Clone the repository and checkout the feature branch:
   ```bash
   git checkout 001-game-dashboard
   ```

2. Navigate to the project root (Next.js app):
   ```bash
   cd .
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

1. Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://api.game.com/v1
   API_KEY=your_api_key_here
   ```

2. Update the API configuration in `app/api/characters/route.js` if needed.

## Running the Application

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:3000`

3. The dashboard should load and display character information.

## Testing

Run the test suite:
```bash
npm test
```

## Building for Production

```bash
npm run build
```

The built files will be in the `build` directory, ready for deployment to a static hosting service.

## Troubleshooting

- If API calls fail, check your internet connection and API key
- For local storage issues, clear browser data
- Check browser console for error messages