# Design Document: AgroMod

## 1. System Architecture

### 1.1 High-Level Architecture

AgroMod follows a modern cloud-native microservices architecture deployed on AWS infrastructure:

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│  React SPA (Responsive Web App) + Voice Interface              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                          │
│  AWS API Gateway + Lambda Authorizer + Rate Limiting           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend Services Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Auth Service │  │ User Service │  │Vendor Service│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Crop Service │  │Weather Service│  │Policy Service│        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Notification  │  │ Planner Svc  │  │ Chatbot Svc  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Services Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │Disease Detect│  │Yield Predictor│  │Amazon Bedrock│        │
│  │(Bedrock)     │  │(Bedrock)     │  │  (Chatbot)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │AWS Transcribe│  │  AWS Polly   │                          │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘

                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data & Storage Layer                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  RDS Postgres│  │  DynamoDB    │  │   S3 Bucket  │        │
│  │  (Relational)│  │  (NoSQL)     │  │   (Images)   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│  ┌──────────────┐  ┌──────────────┐                          │
│  │ElastiCache   │  │  CloudWatch  │                          │
│  │(Redis Cache) │  │  (Logs/Metrics)│                        │
│  └──────────────┘  └──────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend:**
- React 18+ with TypeScript
- React Router for navigation
- Axios for API calls
- i18next for internationalization (Hindi/English)
- TailwindCSS for responsive styling
- React Query for state management and caching
- Web Speech API integration for voice input
- Progressive Web App (PWA) capabilities for offline support

**Backend Services:**
- Django
- TypeScript for type safety
- AWS Lambda for serverless compute
- AWS API Gateway for REST API management
- JWT for authentication tokens

**AI & ML Services:**
- Amazon Bedrock (Claude/Titan models) for chatbot and AI inference
- Amazon Rekognition Custom Labels for disease detection
- AWS Transcribe for speech-to-text (Hindi/English)
- AWS Polly for text-to-speech (Hindi/English)
- Custom ML models for yield prediction (SageMaker)

**Data Storage:**
- Amazon RDS PostgreSQL for relational data (users, crops, vendors)
- Amazon DynamoDB for high-velocity data (chat history, notifications)
- Amazon S3 for image storage with CloudFront CDN
- Amazon ElastiCache (Redis) for session and data caching

**Infrastructure & DevOps:**
- AWS ECS/Fargate or Lambda for service deployment
- AWS CodePipeline for CI/CD
- AWS CodeBuild for builds and tests
- AWS CodeDeploy for deployments
- Terraform or AWS CDK for infrastructure as code
- Docker for containerization

**Monitoring & Observability:**
- AWS CloudWatch for logs and metrics
- AWS X-Ray for distributed tracing
- AWS SNS for alerting
- Custom dashboards for business metrics

**External Integrations:**
- Weather API (OpenWeatherMap or AWS Weather Service)
- SMS gateway (AWS SNS)
- Email service (AWS SES)
- Push notifications (Firebase Cloud Messaging)

### 1.3 Deployment Architecture

**Environment Strategy:**
- Development: Local Docker Compose + AWS dev account
- Staging: Full AWS deployment with reduced capacity
- Production: Multi-AZ deployment with auto-scaling

**Scaling Strategy:**
- Horizontal scaling for stateless services (Lambda auto-scales)
- Read replicas for RDS PostgreSQL
- DynamoDB on-demand capacity mode
- CloudFront CDN for static assets and images
- ElastiCache for reducing database load

**Security Layers:**
- AWS WAF for API Gateway protection
- VPC with private subnets for backend services
- Security groups and NACLs for network isolation
- AWS Secrets Manager for credentials
- AWS KMS for encryption keys
- IAM roles with least privilege principle

## 2. Data Models

### 2.1 User and Authentication

**User Table (PostgreSQL)**
```typescript
interface User {
  id: string;                    // UUID primary key
  email: string;                 // Unique, indexed
  passwordHash: string;          // bcrypt hashed
  userType: 'farmer' | 'vendor'; // User role
  phoneNumber: string;           // For SMS notifications
  language: 'en' | 'hi';         // Preferred language
  isVerified: boolean;           // Email verification status
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

**Session Table (DynamoDB)**
```typescript
interface Session {
  sessionId: string;             // Partition key
  userId: string;                // GSI
  token: string;                 // JWT token
  expiresAt: number;             // TTL for auto-deletion
  createdAt: number;
  ipAddress: string;
  userAgent: string;
}
```

### 2.2 Farmer Profile and Farm Management

**FarmerProfile Table (PostgreSQL)**
```typescript
interface FarmerProfile {
  id: string;                    // UUID, foreign key to User
  fullName: string;
  farmName: string;
  totalFarmSize: number;         // In acres/hectares
  primaryLocation: {
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    state: string;
    pincode: string;
  };
  soilType: string[];            // e.g., ['loamy', 'clay']
  waterSource: string[];         // e.g., ['borewell', 'canal']
  preferredCrops: string[];      // Crop types
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

**CropRecord Table (PostgreSQL)**
```typescript
interface CropRecord {
  id: string;                    // UUID primary key
  farmerId: string;              // Foreign key to User
  cropType: string;              // e.g., 'wheat', 'rice'
  cropVariety: string;           // Specific variety
  fieldLocation: {
    latitude: number;
    longitude: number;
    fieldName: string;
  };
  fieldSize: number;             // In acres/hectares
  plantingDate: Date;
  expectedHarvestDate: Date;
  actualHarvestDate?: Date;
  status: 'planned' | 'planted' | 'growing' | 'harvested' | 'failed';
  yieldPrediction?: {
    estimatedYield: number;      // In kg or tons
    confidenceLevel: number;     // 0-100
    lastUpdated: Date;
  };
  actualYield?: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**CropActivity Table (PostgreSQL)**
```typescript
interface CropActivity {
  id: string;                    // UUID primary key
  cropRecordId: string;          // Foreign key to CropRecord
  activityType: 'irrigation' | 'fertilization' | 'pestControl' | 'weeding' | 'custom';
  scheduledDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'skipped' | 'rescheduled';
  notes: string;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.3 Vendor Marketplace

**VendorProfile Table (PostgreSQL)**
```typescript
interface VendorProfile {
  id: string;                    // UUID, foreign key to User
  businessName: string;
  ownerName: string;
  businessType: string[];        // e.g., ['seeds', 'fertilizers', 'equipment']
  location: {
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    state: string;
    pincode: string;
  };
  serviceRadius: number;         // In kilometers
  contactPhone: string;
  contactEmail: string;
  description: string;
  averageRating: number;         // 0-5
  totalReviews: number;
  responseTime: number;          // Average in hours
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**VendorProduct Table (PostgreSQL)**
```typescript
interface VendorProduct {
  id: string;                    // UUID primary key
  vendorId: string;              // Foreign key to VendorProfile
  productName: string;
  category: string;              // e.g., 'seeds', 'fertilizer'
  description: string;
  price: number;
  unit: string;                  // e.g., 'kg', 'liter', 'piece'
  availability: 'in-stock' | 'out-of-stock' | 'limited';
  imageUrls: string[];           // S3 URLs
  createdAt: Date;
  updatedAt: Date;
}
```

**VendorReview Table (PostgreSQL)**
```typescript
interface VendorReview {
  id: string;                    // UUID primary key
  vendorId: string;              // Foreign key to VendorProfile
  farmerId: string;              // Foreign key to User
  rating: number;                // 1-5
  comment: string;
  transactionId?: string;        // Optional reference
  createdAt: Date;
  updatedAt: Date;
}
```

**VendorInteraction Table (DynamoDB)**
```typescript
interface VendorInteraction {
  interactionId: string;         // Partition key
  farmerId: string;              // GSI
  vendorId: string;              // GSI
  interactionType: 'inquiry' | 'call' | 'message';
  message: string;
  timestamp: number;
  status: 'pending' | 'responded' | 'closed';
}
```

### 2.4 Disease Detection

**DiseaseDetection Table (PostgreSQL)**
```typescript
interface DiseaseDetection {
  id: string;                    // UUID primary key
  cropRecordId: string;          // Foreign key to CropRecord
  farmerId: string;              // Foreign key to User
  imageUrl: string;              // S3 URL
  detectedDiseases: Array<{
    diseaseName: string;
    confidence: number;          // 0-100
    severity: 'low' | 'medium' | 'high';
  }>;
  treatments: Array<{
    treatmentType: 'chemical' | 'organic' | 'preventive';
    productName: string;
    applicationMethod: string;
    dosage: string;
    safetyPrecautions: string;
    estimatedCost: number;
  }>;
  detectionDate: Date;
  status: 'detected' | 'treating' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}
```

### 2.5 Government Policies

**GovernmentPolicy Table (PostgreSQL)**
```typescript
interface GovernmentPolicy {
  id: string;                    // UUID primary key
  policyName: string;
  policyNameHindi: string;
  policyType: 'subsidy' | 'loan' | 'insurance' | 'training' | 'market-support';
  description: string;
  descriptionHindi: string;
  eligibilityCriteria: string;
  eligibilityCriteriaHindi: string;
  applicationProcess: string;
  applicationProcessHindi: string;
  deadline?: Date;
  officialUrl: string;
  contactInfo: string;
  applicableStates: string[];
  applicableCrops: string[];
  isActive: boolean;
  publishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**PolicyBookmark Table (PostgreSQL)**
```typescript
interface PolicyBookmark {
  id: string;                    // UUID primary key
  farmerId: string;              // Foreign key to User
  policyId: string;              // Foreign key to GovernmentPolicy
  reminderEnabled: boolean;
  createdAt: Date;
}
```

### 2.6 Weather and Notifications

**WeatherAlert Table (DynamoDB)**
```typescript
interface WeatherAlert {
  alertId: string;               // Partition key
  farmerId: string;              // GSI
  location: {
    latitude: number;
    longitude: number;
  };
  alertType: 'heavy-rain' | 'frost' | 'heatwave' | 'storm' | 'hail' | 'flood';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  messageHindi: string;
  forecastTime: number;
  sentAt: number;
  expiresAt: number;             // TTL
}
```

**Notification Table (DynamoDB)**
```typescript
interface Notification {
  notificationId: string;        // Partition key
  userId: string;                // GSI
  type: 'weather' | 'reminder' | 'policy' | 'system';
  title: string;
  message: string;
  language: 'en' | 'hi';
  channels: ('email' | 'sms' | 'push')[];
  status: 'pending' | 'sent' | 'failed';
  sentAt?: number;
  createdAt: number;
  expiresAt: number;             // TTL
}
```

### 2.7 Chatbot Conversations

**ChatConversation Table (DynamoDB)**
```typescript
interface ChatConversation {
  conversationId: string;        // Partition key
  userId: string;                // GSI
  messages: Array<{
    messageId: string;
    role: 'user' | 'assistant';
    content: string;
    language: 'en' | 'hi';
    inputMode: 'text' | 'voice';
    timestamp: number;
  }>;
  context: {
    cropRecords: string[];       // Referenced crop IDs
    lastTopic: string;
  };
  createdAt: number;
  updatedAt: number;
  expiresAt: number;             // TTL after 30 days
}
```

## 3. API Design

### 3.1 API Structure and Conventions

**Base URL:** `https://api.agromod.com/v1`

**Authentication:** Bearer token in Authorization header
```
Authorization: Bearer <JWT_TOKEN>
```

**Standard Response Format:**
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
```

**Error Codes:**
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `VAL_001`: Validation error
- `RES_001`: Resource not found
- `SYS_001`: Internal server error
- `RATE_001`: Rate limit exceeded

### 3.2 Authentication Endpoints

**POST /auth/register**
```typescript
Request: {
  email: string;
  password: string;
  userType: 'farmer' | 'vendor';
  phoneNumber: string;
  language: 'en' | 'hi';
}

Response: {
  userId: string;
  message: string; // "Verification email sent"
}
```

**POST /auth/login**
```typescript
Request: {
  email: string;
  password: string;
}

Response: {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    userType: string;
    language: string;
  };
}
```

**POST /auth/logout**
```typescript
Request: {} // Token in header

Response: {
  message: string;
}
```

**POST /auth/refresh-token**
```typescript
Request: {
  refreshToken: string;
}

Response: {
  token: string;
  expiresIn: number;
}
```

**POST /auth/forgot-password**
```typescript
Request: {
  email: string;
}

Response: {
  message: string;
}
```

**POST /auth/reset-password**
```typescript
Request: {
  resetToken: string;
  newPassword: string;
}

Response: {
  message: string;
}
```

### 3.3 User Profile Endpoints

**GET /users/profile**
```typescript
Response: {
  user: User;
  profile: FarmerProfile | VendorProfile;
}
```

**PUT /users/profile**
```typescript
Request: Partial<FarmerProfile | VendorProfile>

Response: {
  profile: FarmerProfile | VendorProfile;
}
```

**PATCH /users/language**
```typescript
Request: {
  language: 'en' | 'hi';
}

Response: {
  message: string;
}
```

### 3.4 Crop Management Endpoints

**GET /crops**
```typescript
Query: {
  status?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  crops: CropRecord[];
  pagination: PaginationMetadata;
}
```

**POST /crops**
```typescript
Request: {
  cropType: string;
  cropVariety: string;
  fieldLocation: Location;
  fieldSize: number;
  plantingDate: string;
  expectedHarvestDate: string;
}

Response: {
  crop: CropRecord;
  schedule: CropActivity[]; // Auto-generated schedule
}
```

**GET /crops/:cropId**
```typescript
Response: {
  crop: CropRecord;
  activities: CropActivity[];
  diseaseHistory: DiseaseDetection[];
}
```

**PUT /crops/:cropId**
```typescript
Request: Partial<CropRecord>

Response: {
  crop: CropRecord;
}
```

**DELETE /crops/:cropId**
```typescript
Response: {
  message: string;
}
```

**GET /crops/:cropId/activities**
```typescript
Response: {
  activities: CropActivity[];
}
```

**POST /crops/:cropId/activities**
```typescript
Request: {
  activityType: string;
  scheduledDate: string;
  notes?: string;
}

Response: {
  activity: CropActivity;
}
```

**PATCH /crops/:cropId/activities/:activityId/complete**
```typescript
Request: {
  notes?: string;
}

Response: {
  activity: CropActivity;
}
```

### 3.5 Vendor Marketplace Endpoints

**GET /vendors**
```typescript
Query: {
  category?: string;
  location?: string; // lat,lng
  radius?: number;   // km
  search?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  vendors: VendorProfile[];
  pagination: PaginationMetadata;
}
```

**GET /vendors/:vendorId**
```typescript
Response: {
  vendor: VendorProfile;
  products: VendorProduct[];
  reviews: VendorReview[];
}
```

**GET /vendors/:vendorId/products**
```typescript
Response: {
  products: VendorProduct[];
}
```

**POST /vendors/:vendorId/contact**
```typescript
Request: {
  message: string;
  contactMethod: 'phone' | 'email' | 'chat';
}

Response: {
  interactionId: string;
  message: string;
}
```

**POST /vendors/:vendorId/reviews**
```typescript
Request: {
  rating: number; // 1-5
  comment: string;
  transactionId?: string;
}

Response: {
  review: VendorReview;
}
```

### 3.6 Disease Detection Endpoints

**POST /disease-detection**
```typescript
Request: FormData {
  image: File;
  cropRecordId: string;
}

Response: {
  detectionId: string;
  detectedDiseases: Array<{
    diseaseName: string;
    diseaseNameHindi: string;
    confidence: number;
    severity: string;
  }>;
  treatments: Array<{
    treatmentType: string;
    productName: string;
    productNameHindi: string;
    applicationMethod: string;
    applicationMethodHindi: string;
    dosage: string;
    safetyPrecautions: string;
    safetyPrecautionsHindi: string;
    estimatedCost: number;
  }>;
  imageUrl: string;
}
```

**GET /disease-detection/:detectionId**
```typescript
Response: {
  detection: DiseaseDetection;
}
```

**GET /disease-detection**
```typescript
Query: {
  cropRecordId?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  detections: DiseaseDetection[];
  pagination: PaginationMetadata;
}
```

### 3.7 Yield Prediction Endpoints

**POST /yield-prediction**
```typescript
Request: {
  cropRecordId: string;
}

Response: {
  cropRecordId: string;
  estimatedYield: number;
  unit: string;
  confidenceLevel: number;
  influencingFactors: Array<{
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }>;
  chartData: {
    historical: Array<{ date: string; yield: number }>;
    forecast: Array<{ date: string; yield: number; confidence: number }>;
  };
  lastUpdated: string;
}
```

**GET /yield-prediction/:cropRecordId**
```typescript
Response: {
  prediction: YieldPrediction;
}
```

### 3.8 Weather Endpoints

**GET /weather/current**
```typescript
Query: {
  latitude: number;
  longitude: number;
}

Response: {
  location: Location;
  current: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    condition: string;
    timestamp: string;
  };
  agriculturalImpact: {
    irrigationAdvice: string;
    fieldWorkSuitability: 'excellent' | 'good' | 'fair' | 'poor';
  };
}
```

**GET /weather/forecast**
```typescript
Query: {
  latitude: number;
  longitude: number;
  days?: number; // Default 7
}

Response: {
  location: Location;
  hourly: Array<HourlyForecast>;
  daily: Array<DailyForecast>;
}
```

**GET /weather/alerts**
```typescript
Response: {
  alerts: WeatherAlert[];
}
```

**PUT /weather/alert-preferences**
```typescript
Request: {
  thresholds: {
    temperature?: { min: number; max: number };
    rainfall?: { max: number };
    windSpeed?: { max: number };
  };
}

Response: {
  message: string;
}
```

### 3.9 Government Policy Endpoints

**GET /policies**
```typescript
Query: {
  search?: string;
  policyType?: string;
  state?: string;
  cropType?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  policies: GovernmentPolicy[];
  pagination: PaginationMetadata;
}
```

**GET /policies/:policyId**
```typescript
Response: {
  policy: GovernmentPolicy;
  isBookmarked: boolean;
}
```

**POST /policies/:policyId/bookmark**
```typescript
Request: {
  reminderEnabled: boolean;
}

Response: {
  bookmark: PolicyBookmark;
}
```

**DELETE /policies/:policyId/bookmark**
```typescript
Response: {
  message: string;
}
```

**GET /policies/bookmarks**
```typescript
Response: {
  bookmarks: Array<{
    bookmark: PolicyBookmark;
    policy: GovernmentPolicy;
  }>;
}
```

### 3.10 Chatbot Endpoints

**POST /chatbot/message**
```typescript
Request: {
  message: string;
  language: 'en' | 'hi';
  conversationId?: string;
  inputMode: 'text' | 'voice';
}

Response: {
  conversationId: string;
  response: string;
  language: 'en' | 'hi';
  suggestions?: string[];
  relatedResources?: Array<{
    type: 'policy' | 'disease' | 'crop';
    id: string;
    title: string;
  }>;
}
```

**POST /chatbot/voice**
```typescript
Request: FormData {
  audio: File; // Audio file
  language: 'en' | 'hi';
  conversationId?: string;
}

Response: {
  conversationId: string;
  transcription: string;
  response: string;
  audioUrl: string; // Polly-generated audio response
  language: 'en' | 'hi';
}
```

**GET /chatbot/conversations**
```typescript
Response: {
  conversations: Array<{
    conversationId: string;
    lastMessage: string;
    timestamp: string;
  }>;
}
```

**GET /chatbot/conversations/:conversationId**
```typescript
Response: {
  conversation: ChatConversation;
}
```

### 3.11 Notification Endpoints

**GET /notifications**
```typescript
Query: {
  type?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

Response: {
  notifications: Notification[];
  unreadCount: number;
  pagination: PaginationMetadata;
}
```

**PATCH /notifications/:notificationId/read**
```typescript
Response: {
  message: string;
}
```

**PUT /notifications/preferences**
```typescript
Request: {
  email: boolean;
  sms: boolean;
  push: boolean;
}

Response: {
  message: string;
}
```

## 4. Service Implementation Details

### 4.1 Authentication Service

**Technology:** Node.js + Express + JWT + bcrypt

**Key Features:**
- Password hashing with bcrypt (salt rounds: 12)
- JWT tokens with 1-hour expiration
- Refresh tokens with 7-day expiration
- Email verification using AWS SES
- Password reset with time-limited tokens (1 hour)
- Failed login attempt tracking (lock after 5 attempts)
- Session management in DynamoDB with TTL

**Security Measures:**
- Rate limiting: 5 login attempts per 15 minutes per IP
- Password complexity validation
- HTTPS-only cookies for refresh tokens
- Token rotation on refresh
- Audit logging for all auth events

### 4.2 Disease Detection Service

**Technology:** Python + FastAPI + Amazon Bedrock + Rekognition

**Implementation Flow:**
1. Receive image upload via API Gateway
2. Validate image format and size (max 10MB)
3. Store original image in S3 with unique key
4. Invoke Rekognition Custom Labels model for disease detection
5. If confidence > 70%, query Bedrock for treatment recommendations
6. Translate results to Hindi if needed
7. Store detection results in PostgreSQL
8. Return response with diseases and treatments

**Model Training:**
- Custom Rekognition model trained on 50+ crop diseases
- Minimum 500 images per disease class
- Regular retraining with new data
- A/B testing for model improvements

**Fallback Strategy:**
- If confidence < 70%, suggest expert consultation
- Provide general crop health tips
- Allow farmers to request human expert review

### 4.3 Yield Prediction Service

**Technology:** Python + FastAPI + SageMaker + Amazon Bedrock

**Implementation Flow:**
1. Receive crop details and location
2. Fetch historical weather data for location
3. Retrieve regional yield patterns from database
4. Query soil data and crop-specific parameters
5. Invoke SageMaker endpoint with ML model
6. Calculate confidence intervals
7. Use Bedrock to generate natural language explanations
8. Store prediction in database
9. Return forecast with visualizations

**ML Model:**
- Random Forest or XGBoost for yield prediction
- Features: weather patterns, soil type, crop variety, historical yields, planting date
- Training data: 5+ years of regional agricultural data
- Model retraining: Quarterly with new harvest data
- Confidence scoring based on data quality and model uncertainty

**Update Strategy:**
- Recalculate predictions when weather forecasts change significantly
- Notify farmers of major prediction changes (>15% difference)
- Improve accuracy with actual harvest data feedback loop

### 4.4 Chatbot Service

**Technology:** Node.js + Express + Amazon Bedrock + Transcribe + Polly

**Implementation Flow (Text):**
1. Receive user message and conversation context
2. Retrieve user profile and crop records for personalization
3. Build prompt with context and agricultural knowledge base
4. Invoke Bedrock (Claude 3) for response generation
5. Translate response if language differs from input
6. Store conversation in DynamoDB
7. Return response with suggestions

**Implementation Flow (Voice):**
1. Receive audio file
2. Invoke AWS Transcribe for speech-to-text (Hindi/English)
3. Process transcribed text through chatbot logic
4. Generate text response
5. Invoke AWS Polly for text-to-speech in target language
6. Store audio response in S3 with short TTL (24 hours)
7. Return transcription, text response, and audio URL

**Prompt Engineering:**
- System prompt with agricultural expertise context
- Include user's crops, location, and recent activities
- Provide access to policy database, disease info, and weather data
- Instruct model to suggest relevant features (disease detection, yield prediction)
- Limit response length for voice output (max 200 words)

**Context Management:**
- Maintain last 10 messages in conversation
- Track referenced crops and topics
- Clear context after 30 minutes of inactivity
- Use DynamoDB TTL for automatic cleanup

### 4.5 Weather Service

**Technology:** Node.js + Express + OpenWeatherMap API + AWS SNS

**Implementation Flow:**
1. Poll weather API every 15 minutes for registered locations
2. Compare current conditions with farmer alert thresholds
3. Detect severe weather events from API alerts
4. Generate alert messages in English and Hindi
5. Store alerts in DynamoDB
6. Send notifications via SNS (SMS, email, push)
7. Update weather cache in ElastiCache

**Alert Logic:**
- Heavy rain: >50mm in 24 hours
- Frost: Temperature <2°C
- Heatwave: Temperature >40°C for 3+ days
- Storm: Wind speed >60 km/h
- Critical events: Hail, tornado, flood warnings

**Optimization:**
- Cache weather forecasts for 15 minutes
- Batch location queries by region
- Use CloudWatch Events for scheduled polling
- Deduplicate alerts within 6-hour window

### 4.6 Crop Planner Service

**Technology:** Node.js + Express + AWS EventBridge

**Implementation Flow:**
1. When crop is created, generate activity schedule based on crop type
2. Store activities in PostgreSQL with scheduled dates
3. Create EventBridge rules for reminder triggers
4. When reminder fires, check weather conditions
5. If weather is unfavorable, suggest rescheduling
6. Send notification via Notification Service
7. Mark reminder as sent

**Schedule Generation:**
- Crop-specific templates (e.g., wheat: irrigation every 7 days, fertilization at 30/60 days)
- Adjust for growth stages and local climate
- Allow farmer customization
- Factor in expected weather patterns

**Reminder Timing:**
- Default: 24 hours before activity
- Customizable per farmer preference
- Multiple reminders for critical activities
- Smart rescheduling based on weather

### 4.7 Notification Service

**Technology:** Node.js + Express + AWS SNS + AWS SES + Firebase FCM

**Implementation Flow:**
1. Receive notification request from other services
2. Check user notification preferences
3. Translate message to user's preferred language
4. Route to appropriate channels:
   - Email: AWS SES
   - SMS: AWS SNS
   - Push: Firebase Cloud Messaging
5. Store notification record in DynamoDB
6. Track delivery status
7. Retry failed notifications (max 3 attempts)

**Message Templates:**
- Weather alerts
- Crop activity reminders
- Policy updates
- Disease detection results
- Yield prediction updates
- System announcements

**Delivery Guarantees:**
- At-least-once delivery
- Exponential backoff for retries
- Dead letter queue for failed notifications
- Delivery status tracking

## 5. Frontend Architecture

### 5.1 Application Structure

```
src/
├── components/
│   ├── common/           # Reusable UI components
│   ├── auth/             # Login, register, password reset
│   ├── dashboard/        # Farmer/vendor dashboards
│   ├── crops/            # Crop management
│   ├── vendors/          # Vendor marketplace
│   ├── disease/          # Disease detection
│   ├── weather/          # Weather display
│   ├── policies/         # Government policies
│   ├── chatbot/          # AI chatbot interface
│   └── planner/          # Crop planner calendar
├── pages/                # Route components
├── services/             # API client services
├── hooks/                # Custom React hooks
├── contexts/             # React contexts (auth, language)
├── utils/                # Helper functions
├── i18n/                 # Translations (en, hi)
├── types/                # TypeScript types
└── assets/               # Images, icons
```

### 5.2 Key Frontend Features

**Responsive Design:**
- Mobile-first approach with TailwindCSS
- Breakpoints: 320px (mobile), 768px (tablet), 1024px (desktop)
- Touch-optimized controls for mobile
- Adaptive layouts for different screen sizes

**Internationalization:**
- i18next for translation management
- Language switcher in header
- RTL support for future languages
- Number and date formatting per locale
- Devanagari script support for Hindi

**State Management:**
- React Query for server state
- React Context for global state (auth, language, theme)
- Local state for component-specific data
- Optimistic updates for better UX

**Performance Optimization:**
- Code splitting by route
- Lazy loading for images
- Virtual scrolling for long lists
- Service worker for offline support
- Image compression before upload
- Debounced search inputs

**Accessibility:**
- WCAG 2.1 Level AA compliance
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode
- Focus indicators

### 5.3 Voice Interface

**Implementation:**
- Web Speech API for browser-based voice input
- Fallback to file upload for unsupported browsers
- Visual feedback during recording
- Audio waveform visualization
- Language selection before voice input
- Noise cancellation hints for users

### 5.4 Progressive Web App (PWA)

**Features:**
- Service worker for offline functionality
- Cache API for storing critical data
- Background sync for queued actions
- Push notification support
- Add to home screen prompt
- Offline indicator in UI

**Offline Capabilities:**
- View cached crop records
- View cached weather forecasts
- View saved policies
- Queue actions for sync when online
- Offline-first architecture for core features

## 6. Security Implementation

### 6.1 Authentication & Authorization

**JWT Token Structure:**
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  userType: 'farmer' | 'vendor';
  iat: number;
  exp: number;
}
```

**Authorization Levels:**
- Public: Registration, login, password reset
- Authenticated: All user-specific endpoints
- Farmer-only: Crop management, disease detection, yield prediction
- Vendor-only: Product management, vendor profile
- Admin: Policy management, user management (future)

**Implementation:**
- Lambda authorizer for API Gateway
- Token validation on every request
- Role-based access control (RBAC)
- Resource ownership verification

### 6.2 Data Protection

**Encryption:**
- TLS 1.3 for all API communication
- S3 bucket encryption (AES-256)
- RDS encryption at rest
- DynamoDB encryption at rest
- KMS for key management

**Sensitive Data Handling:**
- Password hashing with bcrypt (12 rounds)
- No plain text passwords in logs
- PII encryption in database
- Secure token storage (httpOnly cookies)
- API key rotation every 90 days

**Data Privacy:**
- GDPR compliance for EU users
- Data retention policies (7 years for transactions, 30 days for logs)
- Right to deletion implementation
- Data export functionality
- Anonymization for analytics

### 6.3 API Security

**Rate Limiting:**
- 1000 requests/hour per user (general)
- 100 requests/hour for AI services (disease detection, yield prediction)
- 500 requests/hour for chatbot
- 5 login attempts per 15 minutes per IP

**Input Validation:**
- Schema validation with Joi or Zod
- File type and size validation
- SQL injection prevention (parameterized queries)
- XSS prevention (input sanitization)
- CSRF protection

**AWS WAF Rules:**
- Block common attack patterns
- Geo-blocking for unsupported regions
- IP reputation filtering
- Rate-based rules
- SQL injection and XSS protection

## 7. Infrastructure and Deployment

### 7.1 AWS Architecture

**Compute:**
- AWS Lambda for serverless functions (Node.js 20 runtime)
- AWS Fargate for containerized services (optional for long-running processes)
- Auto-scaling based on CloudWatch metrics

**Networking:**
- VPC with public and private subnets across 3 AZs
- NAT Gateway for private subnet internet access
- Application Load Balancer for traffic distribution
- CloudFront for CDN and DDoS protection

**Storage:**
- RDS PostgreSQL Multi-AZ for high availability
- DynamoDB with on-demand capacity
- S3 with lifecycle policies (move to Glacier after 1 year)
- ElastiCache Redis cluster for caching

**AI/ML:**
- Amazon Bedrock for LLM inference
- Amazon Rekognition Custom Labels for disease detection
- SageMaker for yield prediction models
- AWS Transcribe for speech-to-text
- AWS Polly for text-to-speech

**Monitoring:**
- CloudWatch for logs and metrics
- X-Ray for distributed tracing
- CloudWatch Alarms for critical metrics
- SNS for alerting operations team

### 7.2 CI/CD Pipeline

**Pipeline Stages:**
1. **Source:** GitHub repository with branch protection
2. **Build:**
   - Install dependencies
   - Run linters (ESLint, Prettier)
   - Run unit tests (Jest)
   - Run security scans (npm audit, Snyk)
   - Build Docker images
   - Push to ECR
3. **Test:**
   - Deploy to test environment
   - Run integration tests
   - Run E2E tests (Playwright)
   - Performance testing
4. **Staging:**
   - Deploy to staging environment
   - Run smoke tests
   - Manual QA approval
5. **Production:**
   - Manual approval required
   - Blue-green deployment
   - Health checks
   - Automatic rollback on failure

**Tools:**
- AWS CodePipeline for orchestration
- AWS CodeBuild for builds
- AWS CodeDeploy for deployments
- GitHub Actions for PR checks
- Terraform for infrastructure as code

### 7.3 Deployment Strategy

**Blue-Green Deployment:**
1. Deploy new version to green environment
2. Run health checks on green
3. Switch traffic to green via ALB
4. Monitor for errors
5. Keep blue environment for quick rollback
6. Terminate blue after 24 hours

**Rollback Strategy:**
- Automatic rollback if error rate > 5%
- Automatic rollback if health checks fail
- Manual rollback capability
- Database migration rollback scripts
- Feature flags for gradual rollout

### 7.4 Monitoring and Alerting

**Key Metrics:**
- API response time (p50, p95, p99)
- Error rate by endpoint
- Lambda invocation count and duration
- Database connection pool usage
- Cache hit/miss ratio
- AI service latency
- User registration and login rates
- Disease detection success rate
- Chatbot conversation completion rate

**Alerts:**
- Critical: Error rate > 5%, API latency > 2s, service down
- Warning: Error rate > 2%, API latency > 1s, high memory usage
- Info: Deployment completed, new user registrations spike

**Dashboards:**
- System health overview
- API performance metrics
- User activity metrics
- Business metrics (registrations, detections, predictions)
- Cost monitoring

### 7.5 Disaster Recovery

**Backup Strategy:**
- RDS automated backups (daily, 7-day retention)
- RDS snapshots (weekly, 30-day retention)
- S3 versioning enabled
- DynamoDB point-in-time recovery
- Cross-region replication for critical data

**Recovery Objectives:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour
- Multi-AZ deployment for high availability
- Automated failover for RDS
- Regular disaster recovery drills (quarterly)

## 8. Testing Strategy

### 8.1 Testing Levels

**Unit Tests:**
- Jest for JavaScript/TypeScript
- Coverage target: 80%
- Test business logic and utilities
- Mock external dependencies

**Integration Tests:**
- Test API endpoints with test database
- Test service interactions
- Test AWS service integrations (LocalStack for local testing)

**E2E Tests:**
- Playwright for browser automation
- Test critical user flows:
  - User registration and login
  - Crop creation and management
  - Disease detection upload
  - Chatbot interaction
  - Vendor search and contact

**Performance Tests:**
- Load testing with Artillery or k6
- Target: 10,000 concurrent users
- Test API response times under load
- Test database query performance

**Security Tests:**
- OWASP ZAP for vulnerability scanning
- Penetration testing (quarterly)
- Dependency vulnerability scanning
- Infrastructure security audits

### 8.2 Test Data Management

**Test Environments:**
- Local: Docker Compose with LocalStack
- Dev: Shared AWS environment with test data
- Staging: Production-like environment with anonymized data
- Production: Real user data

**Test Data:**
- Seed data for common crops and diseases
- Synthetic user accounts
- Mock weather data
- Sample images for disease detection
- Anonymized production data for staging

## 9. Internationalization (i18n)

### 9.1 Translation Management

**Structure:**
```
i18n/
├── en/
│   ├── common.json
│   ├── auth.json
│   ├── crops.json
│   ├── diseases.json
│   ├── weather.json
│   ├── policies.json
│   └── chatbot.json
└── hi/
    ├── common.json
    ├── auth.json
    ├── crops.json
    ├── diseases.json
    ├── weather.json
    ├── policies.json
    └── chatbot.json
```

**Translation Keys:**
```json
{
  "auth.login.title": "Login to AgroMod",
  "auth.login.email": "Email Address",
  "auth.login.password": "Password",
  "auth.login.submit": "Login",
  "crops.wheat": "Wheat",
  "diseases.leaf_blight": "Leaf Blight"
}
```

**Hindi Translations:**
```json
{
  "auth.login.title": "AgroMod में लॉगिन करें",
  "auth.login.email": "ईमेल पता",
  "auth.login.password": "पासवर्ड",
  "auth.login.submit": "लॉगिन करें",
  "crops.wheat": "गेहूं",
  "diseases.leaf_blight": "पत्ती झुलसा"
}
```

### 9.2 Content Translation

**Static Content:**
- UI labels and messages: Pre-translated in JSON files
- Error messages: Translated with context
- Validation messages: Dynamic translation

**Dynamic Content:**
- User-generated content: Stored in original language
- AI-generated content: Translated via Bedrock
- Government policies: Stored in both languages
- Disease names and treatments: Pre-translated database

**Date and Number Formatting:**
- English: MM/DD/YYYY, 1,234.56
- Hindi: DD/MM/YYYY, 1,234.56 (same number format)
- Use Intl API for formatting

## 10. Performance Optimization

### 10.1 Caching Strategy

**ElastiCache (Redis):**
- Weather forecasts: 15-minute TTL
- Policy listings: 1-hour TTL
- Vendor search results: 5-minute TTL
- User sessions: Session duration
- Crop type metadata: 24-hour TTL

**CloudFront CDN:**
- Static assets: 1-year cache
- Images: 30-day cache
- API responses (GET only): 5-minute cache with cache invalidation

**Application-Level Caching:**
- React Query cache: 5-minute stale time
- Service worker cache: Critical assets and data
- IndexedDB: Offline data storage

### 10.2 Database Optimization

**Indexing Strategy:**
- Primary keys: All tables
- Foreign keys: All relationships
- Email: Unique index on User table
- Location: Geospatial index for vendor search
- Timestamps: Index on createdAt for sorting
- Composite indexes: (userId, status) for crop queries

**Query Optimization:**
- Use prepared statements
- Limit result sets with pagination
- Avoid N+1 queries (use joins or batch loading)
- Use database views for complex queries
- Implement read replicas for heavy read operations

**Connection Pooling:**
- RDS Proxy for connection management
- Pool size: 20 connections per service
- Connection timeout: 30 seconds
- Idle timeout: 10 minutes

### 10.3 API Optimization

**Response Compression:**
- Gzip compression for all API responses
- Minimum size: 1KB

**Pagination:**
- Default page size: 20 items
- Maximum page size: 100 items
- Cursor-based pagination for large datasets

**Batch Operations:**
- Bulk crop activity creation
- Batch notification sending
- Bulk policy updates

**Async Processing:**
- Disease detection: Async with webhook callback
- Yield prediction: Async with polling endpoint
- Image processing: Background job
- Email sending: Queue-based

## 11. Cost Optimization

### 11.1 AWS Cost Management

**Compute:**
- Lambda for variable workloads (pay per invocation)
- Reserved instances for predictable workloads
- Spot instances for non-critical batch jobs
- Auto-scaling to match demand

**Storage:**
- S3 Intelligent-Tiering for images
- Lifecycle policies to move old data to Glacier
- DynamoDB on-demand for variable traffic
- RDS instance right-sizing based on metrics

**AI Services:**
- Bedrock: Pay per token (optimize prompt length)
- Rekognition: Pay per image (cache results)
- Transcribe/Polly: Pay per character (limit audio length)
- SageMaker: Use serverless inference for low traffic

**Data Transfer:**
- CloudFront to reduce data transfer costs
- VPC endpoints to avoid NAT Gateway costs
- Compress responses to reduce bandwidth

### 11.2 Cost Monitoring

**Budgets:**
- Set monthly budget alerts
- Track costs by service
- Monitor cost anomalies
- Optimize based on usage patterns

**Cost Allocation Tags:**
- Environment (dev, staging, prod)
- Service (auth, crops, chatbot)
- Team (backend, frontend, ml)

## 12. Scalability Considerations

### 12.1 Horizontal Scaling

**Stateless Services:**
- All backend services are stateless
- Session state in DynamoDB
- No local file storage (use S3)
- Enable easy horizontal scaling

**Load Balancing:**
- Application Load Balancer for HTTP traffic
- Health checks for automatic instance removal
- Connection draining for graceful shutdown
- Cross-zone load balancing

**Database Scaling:**
- Read replicas for read-heavy operations
- Connection pooling with RDS Proxy
- Sharding strategy for future growth (by region)
- DynamoDB auto-scaling

### 12.2 Vertical Scaling

**Instance Sizing:**
- Start with t3.medium for Lambda (1GB memory)
- Monitor and adjust based on metrics
- Use CloudWatch metrics for right-sizing
- Periodic review of instance types

**Database Sizing:**
- Start with db.t3.medium for RDS
- Monitor CPU, memory, and IOPS
- Scale up during peak seasons
- Scale down during off-peak

### 12.3 Geographic Scaling

**Multi-Region Strategy (Future):**
- Primary region: Mumbai (ap-south-1)
- Secondary region: Singapore (ap-southeast-1)
- Route 53 for geo-routing
- Cross-region replication for critical data
- Regional CloudFront distributions

## 13. Compliance and Regulations

### 13.1 Data Protection

**GDPR Compliance:**
- User consent for data collection
- Right to access personal data
- Right to deletion (within 30 days)
- Data portability (export functionality)
- Privacy policy and terms of service
- Data processing agreements with vendors

**Indian Data Protection:**
- Comply with IT Act 2000
- Reasonable security practices
- Data localization (store in India)
- Breach notification procedures

### 13.2 Agricultural Regulations

**Disclaimer:**
- AI predictions are estimates, not guarantees
- Disease detection is advisory, not diagnostic
- Consult agricultural experts for critical decisions
- Treatment recommendations are suggestions

**Liability:**
- Clear terms of service
- Limitation of liability clauses
- No warranty on AI accuracy
- User responsibility for final decisions

## 14. Future Enhancements

### 14.1 Phase 2 Features

**Marketplace Transactions:**
- In-app payment processing
- Order management system
- Delivery tracking
- Invoice generation

**Community Features:**
- Farmer forums and discussions
- Knowledge sharing platform
- Expert Q&A sessions
- Success story sharing

**Advanced Analytics:**
- Farm performance dashboards
- Profit/loss tracking
- Resource optimization recommendations
- Comparative analysis with regional averages

### 14.2 Phase 3 Features

**IoT Integration:**
- Soil moisture sensors
- Weather stations
- Automated irrigation systems
- Real-time crop monitoring

**Drone Integration:**
- Aerial crop health monitoring
- Precision agriculture
- Automated disease detection from drone imagery

**Blockchain:**
- Supply chain traceability
- Organic certification verification
- Transparent pricing

**Mobile Apps:**
- Native iOS and Android apps
- Better offline support
- Push notifications
- Camera integration


### 15 Development Methodology
**Agile Methodology:**
- 2-week sprints
- Daily standups
- Sprint planning and retrospectives
- Code reviews for all PRs
- Pair programming for complex features

**Code Quality:**
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Unit test coverage > 80%
- Integration tests for critical paths
- Documentation for all APIs

**Git Workflow:**
- Feature branches from main
- PR reviews required (2 approvals)
- Automated tests on PR
- Squash and merge
- Semantic versioning for releases

## 16. Risk Management

### 16.1 Technical Risks

**Risk: AI Model Accuracy**
- Impact: High - Incorrect predictions could harm farmers
- Mitigation: 
  - Display confidence scores
  - Provide disclaimers
  - Allow expert consultation
  - Continuous model improvement
  - A/B testing for model changes

**Risk: Third-Party API Failures**
- Impact: Medium - Weather service disruption
- Mitigation:
  - Multiple weather API providers
  - Fallback mechanisms
  - Cache recent data
  - Graceful degradation

**Risk: Data Loss**
- Impact: High - Loss of farmer data
- Mitigation:
  - Automated backups
  - Multi-AZ deployment
  - Point-in-time recovery
  - Regular disaster recovery drills

**Risk: Security Breach**
- Impact: Critical - User data exposure
- Mitigation:
  - Regular security audits
  - Penetration testing
  - WAF and DDoS protection
  - Encryption at rest and in transit
  - Incident response plan

### 16.2 Business Risks

**Risk: Low User Adoption**
- Impact: High - Product failure
- Mitigation:
  - User research and feedback
  - Simple, intuitive UI
  - Hindi language support
  - Free tier for farmers
  - Marketing and outreach

**Risk: High AWS Costs**
- Impact: Medium - Budget overrun
- Mitigation:
  - Cost monitoring and alerts
  - Optimize resource usage
  - Reserved instances
  - Serverless architecture
  - Regular cost reviews

**Risk: Regulatory Changes**
- Impact: Medium - Compliance issues
- Mitigation:
  - Legal consultation
  - Flexible architecture
  - Regular compliance audits
  - Privacy-first design

## 17. Success Metrics

### 17.1 Technical Metrics

**Performance:**
- API response time < 500ms (p95)
- Disease detection < 10 seconds
- Chatbot response < 3 seconds
- 99.9% uptime

**Quality:**
- Error rate < 1%
- Test coverage > 80%
- Zero critical security vulnerabilities
- Customer satisfaction > 4.5/5

### 17.2 Business Metrics

**User Engagement:**
- Monthly active users (MAU)
- Daily active users (DAU)
- Average session duration
- Feature adoption rates
- User retention (30-day, 90-day)

**Feature Usage:**
- Disease detections per month
- Yield predictions per month
- Chatbot conversations per month
- Vendor connections per month
- Policy views per month

**Growth:**
- New user registrations per month
- User growth rate
- Geographic distribution
- Farmer vs vendor ratio

## 18. Conclusion

AgroMod is designed as a comprehensive, scalable, and secure agricultural platform that leverages modern cloud technologies and AI to empower farmers. The architecture prioritizes:

1. **User Experience:** Responsive design, multilingual support, and intuitive interfaces
2. **Reliability:** High availability, disaster recovery, and robust error handling
3. **Scalability:** Serverless architecture, auto-scaling, and efficient caching
4. **Security:** Encryption, authentication, and compliance with data protection regulations
5. **Performance:** Optimized queries, CDN, and async processing
6. **Maintainability:** Clean code, comprehensive testing, and CI/CD automation

The phased development approach allows for iterative delivery, user feedback incorporation, and risk mitigation. With a strong technical foundation and clear roadmap, AgroMod is positioned to make a significant impact on modern agriculture.
