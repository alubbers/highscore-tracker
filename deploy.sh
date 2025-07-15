#!/bin/bash

# High Score Tracker Deployment Script
# This script automates the deployment process to Google Cloud Run

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROJECT_ID=""
REGION="us-central1"
SERVICE_NAME="highscore-tracker"
STORAGE_BUCKET=""
SERVICE_ACCOUNT="highscore-tracker-service"
MEMORY="512Mi"
CPU="1"
MAX_INSTANCES="10"
MIN_INSTANCES="0"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi

    print_success "All dependencies are installed."
}

# Function to check if user is authenticated
check_authentication() {
    print_status "Checking Google Cloud authentication..."

    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with Google Cloud."
        echo "Please run: gcloud auth login"
        exit 1
    fi

    print_success "Authentication verified."
}

# Function to validate project ID
validate_project() {
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set."
        exit 1
    fi

    print_status "Validating project: $PROJECT_ID"

    if ! gcloud projects describe "$PROJECT_ID" &> /dev/null; then
        print_error "Project $PROJECT_ID does not exist or you don't have access."
        exit 1
    fi

    # Set the project
    gcloud config set project "$PROJECT_ID"
    print_success "Project validated and set."
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."

    apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "storage.googleapis.com"
        "containerregistry.googleapis.com"
    )

    for api in "${apis[@]}"; do
        print_status "Enabling $api..."
        gcloud services enable "$api" --quiet
    done

    print_success "All APIs enabled."
}

# Function to create storage bucket if it doesn't exist
create_storage_bucket() {
    if [ -z "$STORAGE_BUCKET" ]; then
        STORAGE_BUCKET="${PROJECT_ID}-highscore-storage"
        print_warning "Storage bucket not specified. Using default: $STORAGE_BUCKET"
    fi

    print_status "Checking storage bucket: $STORAGE_BUCKET"

    if ! gsutil ls "gs://$STORAGE_BUCKET" &> /dev/null; then
        print_status "Creating storage bucket: $STORAGE_BUCKET"
        gsutil mb "gs://$STORAGE_BUCKET"

        # Set lifecycle policy to prevent accidental deletion
        cat > bucket_lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {
        "age": 365,
        "matchesPrefix": ["old/"]
      }
    }
  ]
}
EOF
        gsutil lifecycle set bucket_lifecycle.json "gs://$STORAGE_BUCKET"
        rm bucket_lifecycle.json

        print_success "Storage bucket created."
    else
        print_success "Storage bucket already exists."
    fi
}

# Function to create service account if it doesn't exist
create_service_account() {
    print_status "Checking service account: $SERVICE_ACCOUNT"

    if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" &> /dev/null; then
        print_status "Creating service account: $SERVICE_ACCOUNT"

        gcloud iam service-accounts create "$SERVICE_ACCOUNT" \
            --display-name="High Score Tracker Service Account" \
            --description="Service account for High Score Tracker Cloud Run service"

        # Grant necessary roles
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/storage.admin"

        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/run.invoker"

        print_success "Service account created and configured."
    else
        print_success "Service account already exists."
    fi
}

# Function to build and deploy using Cloud Build
deploy_with_cloud_build() {
    print_status "Starting Cloud Build deployment..."

    # Check if cloudbuild.yaml exists
    if [ ! -f "cloudbuild.yaml" ]; then
        print_error "cloudbuild.yaml not found. Please ensure you're in the project root directory."
        exit 1
    fi

    # Submit build
    gcloud builds submit --config cloudbuild.yaml \
        --substitutions "_STORAGE_BUCKET=$STORAGE_BUCKET,_SERVICE_ACCOUNT=$SERVICE_ACCOUNT,_REGION=$REGION" \
        --timeout=1200s

    print_success "Cloud Build deployment completed!"
}

# Function to deploy using manual Docker build
deploy_with_docker() {
    print_status "Starting manual Docker deployment..."

    # Build image
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
    BUILD_ID=$(date +%Y%m%d-%H%M%S)

    print_status "Building Docker image: $IMAGE_NAME:$BUILD_ID"
    docker build -t "$IMAGE_NAME:$BUILD_ID" -t "$IMAGE_NAME:latest" .

    # Push image
    print_status "Pushing Docker image..."
    docker push "$IMAGE_NAME:$BUILD_ID"
    docker push "$IMAGE_NAME:latest"

    # Deploy to Cloud Run
    print_status "Deploying to Cloud Run..."
    gcloud run deploy "$SERVICE_NAME" \
        --image "$IMAGE_NAME:$BUILD_ID" \
        --region "$REGION" \
        --platform managed \
        --allow-unauthenticated \
        --port 8080 \
        --memory "$MEMORY" \
        --cpu "$CPU" \
        --min-instances "$MIN_INSTANCES" \
        --max-instances "$MAX_INSTANCES" \
        --timeout 300 \
        --service-account "${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com" \
        --set-env-vars "REACT_APP_ENV=production" \
        --set-env-vars "REACT_APP_GCP_PROJECT_ID=$PROJECT_ID" \
        --set-env-vars "REACT_APP_STORAGE_BUCKET=$STORAGE_BUCKET" \
        --set-env-vars "REACT_APP_VERSION=$BUILD_ID"

    print_success "Manual Docker deployment completed!"
}

# Function to get service URL
get_service_url() {
    print_status "Getting service URL..."

    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --region "$REGION" \
        --format="value(status.url)")

    if [ -n "$SERVICE_URL" ]; then
        print_success "Service deployed successfully!"
        echo ""
        echo "🚀 Your High Score Tracker is now available at:"
        echo "   $SERVICE_URL"
        echo ""
        echo "📝 Service details:"
        echo "   Project: $PROJECT_ID"
        echo "   Region: $REGION"
        echo "   Service: $SERVICE_NAME"
        echo "   Storage: gs://$STORAGE_BUCKET"
        echo ""
    else
        print_error "Could not retrieve service URL."
    fi
}

# Function to run health check
health_check() {
    if [ -n "$SERVICE_URL" ]; then
        print_status "Running health check..."

        if curl -f -s "$SERVICE_URL/health" > /dev/null; then
            print_success "Health check passed!"
        else
            print_warning "Health check failed. The service might still be starting up."
        fi
    fi
}

# Function to show usage
usage() {
    cat << EOF
High Score Tracker Deployment Script

Usage: $0 [OPTIONS]

Options:
    -p, --project-id PROJECT_ID     Google Cloud Project ID (required)
    -r, --region REGION             Deployment region (default: us-central1)
    -s, --service-name NAME         Cloud Run service name (default: highscore-tracker)
    -b, --storage-bucket BUCKET     Storage bucket name (default: PROJECT_ID-highscore-storage)
    -a, --service-account ACCOUNT   Service account name (default: highscore-tracker-service)
    -m, --memory MEMORY             Memory allocation (default: 512Mi)
    -c, --cpu CPU                   CPU allocation (default: 1)
    --max-instances MAX             Maximum instances (default: 10)
    --min-instances MIN             Minimum instances (default: 0)
    --cloud-build                   Use Cloud Build for deployment (default)
    --docker                        Use manual Docker build and push
    -h, --help                      Show this help message

Examples:
    $0 -p my-project-id
    $0 -p my-project-id -r europe-west1 -b my-custom-bucket
    $0 -p my-project-id --docker

EOF
}

# Parse command line arguments
DEPLOYMENT_METHOD="cloud-build"

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--project-id)
            PROJECT_ID="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -s|--service-name)
            SERVICE_NAME="$2"
            shift 2
            ;;
        -b|--storage-bucket)
            STORAGE_BUCKET="$2"
            shift 2
            ;;
        -a|--service-account)
            SERVICE_ACCOUNT="$2"
            shift 2
            ;;
        -m|--memory)
            MEMORY="$2"
            shift 2
            ;;
        -c|--cpu)
            CPU="$2"
            shift 2
            ;;
        --max-instances)
            MAX_INSTANCES="$2"
            shift 2
            ;;
        --min-instances)
            MIN_INSTANCES="$2"
            shift 2
            ;;
        --cloud-build)
            DEPLOYMENT_METHOD="cloud-build"
            shift
            ;;
        --docker)
            DEPLOYMENT_METHOD="docker"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Main deployment process
main() {
    echo "🚀 High Score Tracker Deployment Script"
    echo "========================================"
    echo ""

    # Check if project ID is provided
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID is required."
        echo ""
        usage
        exit 1
    fi

    # Run deployment steps
    check_dependencies
    check_authentication
    validate_project
    enable_apis
    create_storage_bucket
    create_service_account

    # Deploy based on method
    case $DEPLOYMENT_METHOD in
        "cloud-build")
            deploy_with_cloud_build
            ;;
        "docker")
            deploy_with_docker
            ;;
        *)
            print_error "Unknown deployment method: $DEPLOYMENT_METHOD"
            exit 1
            ;;
    esac

    get_service_url
    health_check

    echo ""
    print_success "Deployment completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Visit your application at the URL above"
    echo "2. Create your first game"
    echo "3. Add some high scores"
    echo "4. Share the URL with your friends!"
    echo ""
}

# Run main function
main "$@"
