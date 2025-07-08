# High Score Tracker

A mobile-first web application for tracking high scores and best times across multiple games and players. Built with React, MobX, React Bootstrap, and Google Cloud Storage.

## Features

- 🏆 **Multi-Game Support**: Track scores for unlimited games
- ⏱️ **Time & Score Based**: Support for both time-based (racing) and score-based (points) games
- 👥 **Multi-Player**: Add and manage multiple players
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- 🏅 **Leaderboards**: Automatic ranking and leaderboard generation
- ☁️ **Cloud Storage**: Data persistence using Google Cloud Storage
- 🚀 **Cloud Run Ready**: Containerized deployment to Google Cloud Run

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: MobX with observer pattern
- **UI Components**: React Bootstrap 5
- **Storage**: Google Cloud Storage (one JSON file per game)
- **Deployment**: Google Cloud Run with Docker
- **Build Tools**: Create React App with custom configuration

## Architecture

### Data Model
```typescript
// Each game is stored as a separate JSON file in Google Cloud Storage bucket
Game {
  id: string
  name: string
  description?: string
  isTimeBased: boolean  // true for racing/speedrun games
  scores: Score[]
  createdAt: Date
  updatedAt: Date
}

Score {
  id: string
  playerId: string
  playerName: string
  value: number  // seconds for time-based, points for score-based
  isTime: boolean
  achievedAt: Date
  notes?: string
}
```

### Store Architecture
- **GameStore**: MobX store managing all game state and operations
- **StorageService**: Service layer for Google Cloud Storage operations
- **Observer Pattern**: Components automatically re-render when state changes
- **No Local Component State**: All state managed in stores following MobX patterns

### Component Structure
```
src/
├── components/
│   ├── GameList.tsx        # Display all games in responsive grid
│   ├── GameDetail.tsx      # Individual game view with leaderboard
│   ├── AddGameForm.tsx     # Form for creating new games
│   └── AddScoreForm.tsx    # Form for adding scores
├── stores/
│   └── GameStore.ts        # MobX store for game state management
├── services/
│   └── StorageService.ts   # Google Cloud Storage operations
└── types/
    └── index.ts           # TypeScript type definitions
```

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Google Cloud Platform account
- Google Cloud Storage bucket
- Service account with Storage Admin permissions

### 1. Clone and Install
```bash
git clone <repository-url>
cd highscore-tracker
npm install
```

### 2. Google Cloud Setup

#### Create Storage Bucket
```bash
# Create bucket (replace with your bucket name)
gsutil mb gs://your-highscore-bucket

# Set bucket permissions (optional - for public read)
gsutil iam ch allUsers:objectViewer gs://your-highscore-bucket
```

#### Create Service Account
```bash
# Create service account
gcloud iam service-accounts create highscore-tracker \
  --display-name="High Score Tracker Service Account"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:highscore-tracker@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Create and download key file
gcloud iam service-accounts keys create ./config/gcp-service-account-key.json \
  --iam-account=highscore-tracker@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

### 3. Environment Configuration
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your values
REACT_APP_GCP_PROJECT_ID=your-project-id
REACT_APP_STORAGE_BUCKET=your-highscore-bucket
REACT_APP_GCP_KEY_FILE=./config/gcp-service-account-key.json
```

### 4. Development Server
```bash
# Start development server
npm start

# App will be available at http://localhost:3000
```

## Deployment to Google Cloud Run

### Option 1: Using Google Cloud Build (Recommended)
```bash
# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com

# Submit build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _STORAGE_BUCKET=your-bucket-name

# Your app will be deployed automatically
```

### Option 2: Manual Docker Deployment
```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/highscore-tracker .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/highscore-tracker

# Deploy to Cloud Run
gcloud run deploy highscore-tracker \
  --image gcr.io/YOUR_PROJECT_ID/highscore-tracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars REACT_APP_GCP_PROJECT_ID=YOUR_PROJECT_ID \
  --set-env-vars REACT_APP_STORAGE_BUCKET=your-bucket-name
```

## Usage Guide

### Creating Games
1. Click "Add Game" in the navigation
2. Enter game name and description
3. Choose game type:
   - **Score-Based**: Higher numbers are better (e.g., arcade games)
   - **Time-Based**: Lower numbers are better (e.g., racing games)
4. Click "Create Game"

### Adding Scores
1. Click "Add Score" in the navigation
2. Select the game from the dropdown
3. Choose existing player or create new one
4. Enter score value:
   - For time-based games: enter seconds (e.g., 95.5 for 1:35.50)
   - For score-based games: enter points (e.g., 1000)
5. Add optional notes
6. Click "Add Score"

### Viewing Leaderboards
1. Click on any game card to view details
2. See top players in the leaderboard section
3. View all scores sorted by rank or date
4. Use "Show All Scores" to see complete history

## File Structure

```
highscore-tracker/
├── public/
│   └── index.html              # Mobile-optimized HTML template
├── src/
│   ├── components/
│   │   ├── GameList.tsx        # Game grid with responsive cards
│   │   ├── GameDetail.tsx      # Game details with leaderboard
│   │   ├── AddGameForm.tsx     # New game creation form
│   │   └── AddScoreForm.tsx    # Score addition form
│   ├── services/
│   │   └── StorageService.ts   # Google Cloud Storage integration
│   ├── stores/
│   │   └── GameStore.ts        # MobX state management
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   ├── App.tsx                # Main app component
│   ├── index.tsx              # React entry point
│   └── index.css              # Global styles
├── Dockerfile                 # Container configuration
├── nginx.conf                 # Nginx web server config
├── cloudbuild.yaml           # Google Cloud Build config
├── start.sh                  # Container startup script
└── package.json              # Dependencies and scripts
```

## Troubleshooting

### Common Issues

#### "Storage bucket not found"
- Verify bucket name in environment variables
- Check bucket exists: `gsutil ls gs://your-bucket-name`
- Verify service account has access

#### "Permission denied" errors
- Check service account has Storage Admin role
- Verify key file path is correct
- Ensure key file is valid JSON

#### Build failures
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

#### Deployment issues
- Check Google Cloud APIs are enabled
- Verify project ID is correct
- Check Cloud Run service account permissions

### Debugging

#### Local Development
```bash
# Enable debug logging
REACT_APP_DEBUG=true npm start

# Check browser console for errors
# Check network tab for API calls
```



## Roadmap

### Future Features
- [ ] Import/Export functionality
- [ ] Game categories and tags
- [ ] Player statistics and achievements
- [ ] Social features (sharing, comments)
- [ ] Advanced analytics and charts
- [ ] Mobile app with offline sync
- [ ] Real-time multiplayer competitions
- [ ] Integration with gaming platforms

### Technical Improvements
- [ ] GraphQL API for better data fetching
- [ ] Progressive Web App (PWA) features
- [ ] Advanced caching strategies
- [ ] Database migration from JSON files
- [ ] Automated testing pipeline
- [ ] Performance monitoring
- [ ] Advanced security features
