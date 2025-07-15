# Deployment Guide for High Score Tracker

This guide provides step-by-step instructions for deploying the High Score Tracker application to Google Cloud Run.

## Prerequisites

Before deploying, ensure you have:

1. **Google Cloud Platform Account** with billing enabled
2. **Google Cloud SDK** installed and configured
3. **Docker** installed (for manual deployment)
4. **Node.js 18+** and npm installed
5. **Project permissions** to create resources in GCP

## Quick Start Deployment

### 1. Clone and Setup

```bash
git clone <repository-url>
cd highscore-tracker
npm install
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required environment variables:
- `REACT_APP_GCP_PROJECT_ID`: Your GCP project ID
- `REACT_APP_STORAGE_BUCKET`: Storage bucket name
- `REACT_APP_GCP_KEY_FILE`: Path to service account key (for local dev)

### 3. Deploy with Script

```bash
# Make script executable
chmod +x deploy.sh

# Deploy (replace with your project ID)
./deploy.sh -p your-project-id
```

The script will:
- ✅ Check dependencies and authentication
- ✅ Enable required Google Cloud APIs
- ✅ Create storage bucket
- ✅ Create service account
- ✅ Build and deploy to Cloud Run
- ✅ Provide service URL

## Manual Deployment Steps

### Step 1: Google Cloud Setup

#### Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### Create Storage Bucket
```bash
# Create bucket
gsutil mb gs://your-bucket-name

# Verify bucket creation
gsutil ls gs://your-bucket-name
```

#### Create Service Account
```bash
# Create service account
gcloud iam service-accounts create highscore-tracker-service \
  --display-name="High Score Tracker Service Account"

# Grant Storage Admin role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:highscore-tracker-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Step 2: Build and Deploy

#### Option A: Using Cloud Build (Recommended)
```bash
# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml \
  --substitutions _STORAGE_BUCKET=your-bucket-name
```

#### Option B: Manual Docker Build
```bash
# Build Docker image
docker build -t gcr.io/YOUR_PROJECT_ID/highscore-tracker .

# Push to Container Registry
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

### Step 3: Verify Deployment

```bash
# Get service URL
gcloud run services describe highscore-tracker \
  --region us-central1 \
  --format="value(status.url)"

# Test health endpoint
curl -f https://your-service-url/health
```

## Environment Configuration

### Production Environment Variables

Set these in Cloud Run:

```bash
REACT_APP_ENV=production
REACT_APP_GCP_PROJECT_ID=your-project-id
REACT_APP_STORAGE_BUCKET=your-bucket-name
REACT_APP_VERSION=1.0.0
```

### Optional Configuration

```bash
# Performance settings
REACT_APP_MAX_GAMES=100
REACT_APP_MAX_PLAYERS=1000
REACT_APP_CACHE_DURATION=300000

# Feature flags
REACT_APP_ENABLE_EXPORT=true
REACT_APP_ENABLE_IMPORT=true
REACT_APP_ENABLE_ANALYTICS=false
```

## Security Configuration

### Service Account Permissions

The service account needs these roles:
- `roles/storage.admin` - For Cloud Storage access
- `roles/run.invoker` - For Cloud Run execution

### Storage Bucket Security

```bash
# Set bucket to private (recommended)
gsutil iam ch -d allUsers:objectViewer gs://your-bucket-name

# Or allow public read (if sharing data)
gsutil iam ch allUsers:objectViewer gs://your-bucket-name
```

### CORS Configuration (if needed)

```bash
# Create CORS configuration
cat > cors.json << EOF
[
  {
    "origin": ["https://your-domain.com"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Apply CORS to bucket
gsutil cors set cors.json gs://your-bucket-name
```

## Monitoring and Logging

### View Logs
```bash
# Cloud Run logs
gcloud run services logs tail highscore-tracker --region us-central1

# Build logs
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### Health Monitoring
```bash
# Check service health
curl -f https://your-service-url/health

# Check service status
gcloud run services describe highscore-tracker --region us-central1
```

## Scaling Configuration

### Auto-scaling Settings
```bash
gcloud run services update highscore-tracker \
  --region us-central1 \
  --min-instances 0 \
  --max-instances 10 \
  --concurrency 80 \
  --cpu 1 \
  --memory 512Mi
```

### Performance Tuning
```bash
# For higher traffic
gcloud run services update highscore-tracker \
  --region us-central1 \
  --min-instances 1 \
  --max-instances 50 \
  --concurrency 100 \
  --cpu 2 \
  --memory 1Gi
```

## Troubleshooting

### Common Issues

#### 1. "Permission Denied" Errors
```bash
# Check service account permissions
gcloud projects get-iam-policy YOUR_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*highscore-tracker-service*"

# Re-add permissions if needed
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:highscore-tracker-service@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
```

#### 2. "Storage Bucket Not Found"
```bash
# List buckets
gsutil ls

# Create bucket if missing
gsutil mb gs://your-bucket-name
```

#### 3. "Build Failed"
```bash
# Check build logs
gcloud builds list --limit 5
gcloud builds log BUILD_ID

# Common fixes:
# - Check Dockerfile syntax
# - Verify source files exist
# - Check build timeouts
```

#### 4. "Service Not Accessible"
```bash
# Check service status
gcloud run services describe highscore-tracker --region us-central1

# Check IAM permissions
gcloud run services get-iam-policy highscore-tracker --region us-central1

# Make service public
gcloud run services add-iam-policy-binding highscore-tracker \
  --region us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Debug Commands

```bash
# Check service configuration
gcloud run services describe highscore-tracker --region us-central1

# Test container locally
docker run -p 8080:8080 -e REACT_APP_GCP_PROJECT_ID=test gcr.io/YOUR_PROJECT_ID/highscore-tracker

# Check Cloud Build configuration
gcloud builds submit --config cloudbuild.yaml --dry-run
```

## Cost Optimization

### Cloud Run Pricing
- CPU: $0.00002400 per vCPU-second
- Memory: $0.00000250 per GiB-second
- Requests: $0.40 per million requests

### Storage Pricing
- Standard storage: $0.020 per GB per month
- Operations: $0.05 per 10,000 operations

### Optimization Tips
1. Use minimum instances = 0 for low traffic
2. Set appropriate memory limits
3. Enable request timeout
4. Use Cloud CDN for static assets
5. Implement caching strategies

## CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SERVICE_ACCOUNT_KEY }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud builds submit --config cloudbuild.yaml \
          --substitutions _STORAGE_BUCKET=${{ secrets.STORAGE_BUCKET }}
```

## Backup and Recovery

### Data Backup
```bash
# Backup all game files
gsutil -m cp -r gs://your-bucket-name/game-*.json ./backup/

# Restore from backup
gsutil -m cp -r ./backup/* gs://your-bucket-name/
```

### Service Backup
```bash
# Export service configuration
gcloud run services describe highscore-tracker \
  --region us-central1 \
  --format export > service-config.yaml

# Restore service from configuration
gcloud run services replace service-config.yaml --region us-central1
```

## Support and Resources

### Documentation
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
- [React Bootstrap Documentation](https://react-bootstrap.github.io/)

### Community
- [GitHub Issues](https://github.com/your-repo/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-cloud-run)

### Contact
For deployment issues, create an issue in the GitHub repository with:
- Error messages
- Deployment command used
- Environment details
- Log outputs