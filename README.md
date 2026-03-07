# AgroMod - AI-Powered One Stop Farmer Platform

AgroMod is a full-stack, AI-first web application purpose-built for Indian farmers and agricultural vendors. It brings together advanced AI capabilities with a robust AWS cloud architecture to deliver crop disease detection, intelligent yield prediction, a voice-enabled farming assistant, weather intelligence, real-time market prices, government scheme discovery, and a farmer-vendor marketplace -- all unified in a single, accessible platform.

**Live Application:** <https://dajzj3yeawq6e.cloudfront.net>

---

## Why AI Is Essential to AgroMod

Indian agriculture supports over 150 million farming households, yet most smallholder farmers lack access to timely, expert-level guidance. Traditional advisory services are scarce, expensive, and slow. AgroMod uses AI to bridge this gap at scale:

1. **Crop Disease Detection Without Experts**
   A farmer can photograph a diseased leaf and receive an instant AI-powered diagnosis with treatment recommendations -- something that would otherwise require a trained agronomist's physical visit. The AI vision model identifies disease patterns across hundreds of crop-disease combinations, operating 24/7 with no geographic limitation. The response is structured JSON containing the identified plant, disease name, severity rating, treatment options (organic and chemical), preventive measures, and specific product recommendations available in Indian markets.

2. **Yield Prediction Informed by Live Data**
   Yield estimation traditionally depends on years of local farming experience. AgroMod's AI model combines the farmer's crop, region, and season inputs with live 7-day weather forecasts fetched from Open-Meteo for all 30+ Indian states, then cross-references historical yield records, MSP rates, and market economics to produce data-driven forecasts. The system fetches real-time temperature, precipitation, and wind data and embeds it directly into the AI prompt so the model reasons over actual current conditions -- not stale data.

3. **Intelligent Crop Suggestions with Financial Projections**
   Instead of relying on habit or word-of-mouth, farmers receive AI-generated recommendations for the most profitable crops for their specific region and season. Each suggestion includes multi-year historical yield data (quintals/hectare), MSP and market prices (INR/quintal), estimated profit per hectare after cost of cultivation, and crop rotation benefits -- turning a generic suggestion into an actionable financial plan.

4. **Kisan Mitra -- A Voice-Enabled Multimodal AI Farming Assistant**
   Many Indian farmers are more comfortable speaking than typing. Kisan Mitra is a multimodal AI chatbot that accepts text, voice (audio), and images simultaneously. It responds in the farmer's language and can read answers aloud using AI-generated text-to-speech. This removes the literacy barrier entirely, making expert agricultural advice accessible to every farmer regardless of education level. The system supports real-time voice conversations through ephemeral WebSocket tokens for direct browser-to-AI communication.

5. **Scale That Human Experts Cannot Match**
   A single agronomist can serve a few hundred farmers. AgroMod's AI layer serves unlimited concurrent users across all Indian states and crops, delivering personalized, context-aware advice in seconds. Every AI interaction is logged in the database, building a growing knowledge base of regional crop issues and trends.

---

## AWS Architecture -- Powering Seamless Scalability

AgroMod is built entirely on AWS, leveraging managed services to achieve high availability, automatic scaling, and zero-server-management operations. The architecture follows the AWS Well-Architected Framework principles across all five pillars.

```
                         ┌─────────────────────────────┐
                         │      AWS CloudFront CDN      │
                         │  (Global edge distribution)  │
                         │  HTTPS + DDoS protection     │
                         └──────────────┬──────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                                       │
          ┌─────────▼──────────┐              ┌─────────────▼──────────────┐
          │   AWS S3 Bucket    │              │  AWS API Gateway (HTTP)    │
          │  (React SPA +      │              │  Rate limiting, HTTPS,    │
          │   static assets +  │              │  request validation       │
          │   media uploads)   │              └─────────────┬──────────────┘
          └────────────────────┘                            │
                                                ┌──────────▼──────────────┐
                                                │   AWS Lambda (512 MB)   │
                                                │   Django + Mangum ASGI  │
                                                │   Auto-scales 0 → ∞    │
                                                │   Pay-per-invocation    │
                                                └─────────┬───────────────┘
                                                          │
                      ┌──────────────┬────────────────────┼────────────────┐
                      │              │                    │                │
             ┌────────▼───────┐  ┌───▼──────────┐  ┌─────▼──────┐  ┌─────▼─────┐
             │  AWS Bedrock   │  │  Amazon RDS   │  │  Amazon S3 │  │ Amazon    │
             │  / Gemini      │  │  PostgreSQL   │  │  (Media    │  │ SNS       │
             │  (AI/ML)       │  │  (Managed DB) │  │  Storage)  │  │ (OTP SMS) │
             │                │  │  Automated    │  │  11-nines  │  │ Trans-    │
             │  Text, Vision, │  │  backups,     │  │  durability│  │ actional  │
             │  Audio, TTS    │  │  patching     │  │            │  │ delivery  │
             └────────────────┘  └──────────────┘  └────────────┘  └───────────┘
```

### How Each AWS Service Benefits AgroMod

#### AWS Lambda -- Serverless Compute

The entire Django backend runs as a serverless function on AWS Lambda, connected via Mangum (an ASGI-to-Lambda adapter). This is the core compute layer for all 38+ API endpoints.

**How it benefits the application:**
- Scales automatically from zero to thousands of concurrent requests with no capacity planning. When 500 farmers submit disease photos simultaneously during a pest outbreak, Lambda handles the spike seamlessly.
- Pay-per-invocation pricing means AgroMod pays nothing during low-usage hours (nighttime, non-farming seasons). For an agricultural platform where usage peaks during daylight hours, this eliminates idle server costs entirely.
- No server provisioning, patching, or OS maintenance. The development team focuses on features, not infrastructure.
- Cold start optimization through the Mangum ASGI adapter ensures Django initializes efficiently within the Lambda execution environment.

#### Amazon API Gateway -- Managed API Layer

All `/api/*` HTTP requests from the frontend are routed through API Gateway before reaching Lambda.

**How it benefits the application:**
- Built-in HTTPS termination and TLS certificate management -- every API call between the farmer's browser and the backend is encrypted end-to-end without managing SSL certificates.
- Request throttling and rate limiting protect the backend from abuse. If a bot tries to flood the disease analysis endpoint, API Gateway rejects excessive requests before they consume Lambda compute.
- Regional endpoint deployment in `us-east-1` provides low-latency API routing for Indian users through CloudFront.
- API request/response logging flows into CloudWatch for debugging production issues without adding instrumentation code.

#### Amazon S3 -- Unified Storage Layer

S3 serves three distinct roles in AgroMod's architecture:

1. **Frontend Hosting**: The production React SPA build (`frontend/dist/`) is uploaded to S3 as a static website. No web server (Nginx, Apache) is needed.
2. **Media Storage**: Product images from the marketplace, crop disease photos uploaded by farmers, and user profile assets are stored in S3 via Django's `django-storages` backend. Every user upload goes directly to S3 with `CacheControl: max-age=86400` headers for efficient CDN caching.
3. **Static Assets**: Django's `collectstatic` output (admin CSS/JS, DRF browsable API assets) is served from S3.

**How it benefits the application:**
- 99.999999999% (11 nines) data durability means farmer-uploaded disease photos and marketplace images are essentially permanent.
- Unlimited storage capacity -- as the marketplace grows from hundreds to millions of product listings, S3 scales without intervention.
- Direct S3 upload eliminates Lambda from the media upload path for large files, reducing compute costs and avoiding Lambda's payload limits.
- Combined with CloudFront, S3-hosted assets are served from edge locations across India, not from a single origin server.

#### Amazon CloudFront -- Global CDN

CloudFront sits in front of both the S3-hosted frontend and the API Gateway backend, providing a single HTTPS domain for the entire application.

**How it benefits the application:**
- Farmers across India -- from Rajasthan to Tamil Nadu, Punjab to Assam -- experience sub-100ms page loads through CloudFront's 30+ Indian edge locations (Points of Presence).
- HTTPS everywhere: CloudFront provides free ACM (AWS Certificate Manager) SSL certificates, ensuring all farmer data (credentials, crop photos, location) is encrypted in transit.
- Built-in DDoS protection via AWS Shield Standard (included at no extra cost) protects AgroMod from volumetric attacks without additional configuration.
- Edge caching for static assets (JS bundles, CSS, fonts, images) reduces origin load by 90%+, cutting S3 request costs.
- Single domain for frontend and API eliminates CORS complexity in production -- the browser sees one origin for both the React app and API calls.

#### Amazon RDS (PostgreSQL) -- Managed Database

RDS hosts the PostgreSQL database that stores all application data: users, profiles, marketplace products, orders, disease queries, yield predictions, scheme information, weather cache, and planner data across 18 Django models.

**How it benefits the application:**
- Automated daily backups with point-in-time recovery. If a data issue occurs, AgroMod can restore to any second within the backup retention window.
- Automated engine patching keeps PostgreSQL secure against vulnerabilities without scheduled maintenance windows managed by the team.
- Vertical scaling with a single configuration change -- as the user base grows from 500 to 50,000 farmers, the instance class can be upgraded from `db.t3.micro` to a larger instance without application changes.
- Encryption at rest (AES-256) and in transit (SSL) ensures farmer data meets security compliance requirements.
- Multi-AZ deployment option available for production high availability -- automatic failover to a standby replica if the primary instance fails.

#### Amazon SNS -- OTP SMS Delivery

SNS powers the phone-based authentication system, sending transactional OTP SMS messages during registration, login verification, and password reset flows.

**How it benefits the application:**
- Phone-based authentication is critical for Indian farmers who may not have email accounts. SNS delivers SMS across all Indian telecom networks (Jio, Airtel, Vi, BSNL).
- Transactional SMS type ensures OTP messages are delivered even when the user has DND (Do Not Disturb) enabled, as mandated by TRAI regulations.
- E.164 phone number formatting is handled automatically by the `sms.py` module, normalizing 10-digit, 12-digit, and prefixed numbers.
- SNS integrates directly with boto3 in the Django accounts app, requiring no third-party SMS gateway or external API.

#### AWS Bedrock -- AI/ML Foundation

AgroMod's architecture is designed around AWS Bedrock as the AI backbone. Bedrock provides managed access to foundation models for text generation, image understanding, and multimodal reasoning.

**How it benefits the application:**
- No model hosting or GPU management. Bedrock provides on-demand inference with automatic scaling -- the AI layer scales identically to the Lambda compute layer.
- Access to multiple foundation models (Amazon Nova, Claude, Llama) through a unified API. AgroMod can switch models based on task requirements (e.g., Nova Lite for fast chat, Claude for complex analysis) without changing application code.
- IAM-based access control means AI API keys are managed through AWS's native identity system, not hardcoded credentials.
- Data processed by Bedrock is not used to train models, ensuring farmer crop data and disease photos remain private.
- VPC integration keeps AI inference within the AWS network, eliminating data egress to external AI providers.

**Current runtime note:** During development, we encountered new AWS account limitations that temporarily restricted Bedrock model access (specifically, Amazon Nova Lite quotas for new accounts require a support request and approval period). To keep the platform fully functional, we implemented a Gemini bridge layer (`gemini_client.py`) that routes AI requests to Google Gemini 2.5 Flash while maintaining identical API contracts. The application code and architecture remain Bedrock-ready -- switching back requires only changing the client implementation with zero application logic changes.

---

## What Value the AI Layer Adds to the User Experience

Without AI, AgroMod would be a static information portal. With AI, it becomes a **personalized agricultural advisor** that adapts to each farmer's context:

- **Instant Expert Access**: A farmer in a remote village gets the same quality of crop disease diagnosis that would require an expensive agronomist visit in person. The AI analyzes the leaf image, identifies the disease, rates severity, recommends treatments with specific product names available in India, and suggests prevention measures -- all in under 5 seconds.

- **Data-Driven Decision Making**: Instead of relying on tradition or guesswork, farmers receive yield predictions grounded in live weather data (7-day temperature, precipitation, wind forecasts for their specific state), historical government records, and regional agricultural economics. The AI synthesizes information from multiple sources that no single human could cross-reference as quickly.

- **Breaking the Language Barrier**: Kisan Mitra's voice input and text-to-speech output mean a farmer who cannot read or type can still interact with the platform naturally -- speak a question in Hindi, receive a spoken answer. The AI handles speech-to-text, contextual understanding, and text-to-speech in a single pipeline. This is powered by multimodal AI that processes audio, text, and images in the same request.

- **Personalized Crop Economics**: The AI doesn't just suggest crops -- it provides year-over-year yield data (2023-24, 2024-25), MSP rates in INR/quintal, estimated profit per hectare after cost of cultivation, and rotation benefits specific to the farmer's exact state and season. This turns a generic recommendation into actionable financial planning backed by real numbers.

- **Structured, Actionable Outputs**: AI responses for disease detection are returned as structured JSON with specific fields (plant, disease, severity, treatment, prevention, recommended_products), enabling the frontend to render rich, formatted cards rather than raw text walls. This is a deliberate design choice that prioritizes usability over generic chat responses.

- **Continuous Learning Dataset**: Every AI interaction (disease queries, yield predictions, crop suggestions) is logged in the PostgreSQL database with the user's region, crop, and season context. Over time, this builds a valuable dataset of Indian agricultural patterns that can inform future model fine-tuning and regional trend analysis.

---

## Industry Best Practices Implemented

### 1. Serverless-First Architecture

AgroMod follows the **serverless-first** approach recommended by AWS Well-Architected Framework. Instead of running Django on an EC2 instance or ECS container that idles 24/7, the entire backend runs on Lambda. This eliminates:
- Server provisioning and capacity planning
- OS patching and security updates
- Idle cost during off-peak hours (critical for agriculture where usage is seasonal and diurnal)

The Mangum ASGI adapter bridges Django's ASGI interface to Lambda's event model, preserving the full Django ecosystem (ORM, migrations, admin, DRF) without sacrificing serverless benefits.

### 2. Provider-Agnostic AI Abstraction Layer

The `gemini_client.py` module implements a **facade pattern** that decouples application logic from the AI provider:

```
Backend Apps                    AI Abstraction Layer              AI Provider
┌──────────────┐               ┌──────────────────┐            ┌───────────────┐
│ disease/     │──ask_with_    │                  │            │ AWS Bedrock   │
│ views.py     │  image()──────│  gemini_client   │────────────│ (or Gemini,   │
│              │               │                  │            │  or OpenAI,   │
│ yield/       │──ask_text()───│  .ask_text()     │            │  or any LLM)  │
│ views.py     │               │  .ask_with_image │            │               │
│              │               │  .ask_with_audio │            └───────────────┘
│ chatbot/     │──ask_with_    │  .text_to_speech │
│ views.py     │  audio()──────│  .create_token   │
└──────────────┘               └──────────────────┘
```

No view or business logic code knows or cares whether the underlying model is Bedrock Nova, Gemini Flash, or Claude. Switching providers requires changing one file, not refactoring the entire application. This follows the **Dependency Inversion Principle** and makes the system resilient to provider outages, pricing changes, or quota limits.

### 3. Twelve-Factor App Configuration

All configuration (database credentials, API keys, feature flags) is loaded from **environment variables**, following the [Twelve-Factor App](https://12factor.net/config) methodology:
- The `env()` helper in `settings.py` reads from `os.environ` with safe defaults for local development
- Production secrets are set as Lambda environment variables, never committed to source code
- The same codebase runs identically in local development, staging, and production by changing only environment variables
- `.env` file support for local development with automatic loading in `settings.py`

### 4. JWT-Based Stateless Authentication

AgroMod uses **SimpleJWT** for stateless authentication with short-lived access tokens and long-lived refresh tokens:
- Access tokens expire quickly, limiting the window of exposure if a token is compromised
- Refresh tokens enable seamless session continuity without re-entering credentials
- The frontend Axios interceptor automatically handles token refresh on 401 responses -- the user never sees an auth error during normal usage
- Tokens are stored in `localStorage` and attached to every API request via the Authorization header
- No server-side session storage required, which is critical for Lambda's stateless execution model

### 5. Two-Step OTP Verification (Deferred User Creation)

The registration flow implements a **deferred creation pattern** that prevents orphan accounts:
1. Step 1 (`RegisterView`): Validates input, generates OTP, sends SMS via SNS, stores pending data in Django's database cache -- but does **not** create a User record
2. Step 2 (`VerifyOTPView`): Verifies the OTP, then creates the User, profile, and issues JWT tokens

This ensures the database only contains verified users. Failed or abandoned registrations leave no database footprint, keeping the user table clean.

### 6. Structured AI Response Parsing

AI responses for disease detection are requested in strict JSON format with a defined schema (`plant`, `disease`, `severity`, `diagnosis`, `treatment`, `prevention`, `recommended_products`). The `_parse_gemini_response()` function handles:
- Markdown code fence stripping (models sometimes wrap JSON in triple backticks)
- Graceful fallback to raw text if JSON parsing fails
- Guaranteed response structure regardless of model behavior

This follows the **contract-first API design** principle -- the frontend always receives a predictable shape, even if the underlying AI model's output varies.

### 7. Modular Django App Architecture

The backend is organized as **nine independent Django apps**, each owning its own models, serializers, views, URLs, and migrations:

| App | Responsibility | Models |
|-----|---------------|--------|
| `accounts` | Auth, OTP, profiles | User, FarmerProfile, VendorProfile |
| `chatbot` | AI chatbot | ChatMessage |
| `disease` | Disease detection | DiseaseQuery |
| `marketplace` | E-commerce | Category, Product, Order, OrderItem |
| `planner` | Crop calendar | PlannerEntry |
| `prices` | Market prices | (external API, no models) |
| `schemes` | Govt schemes | Scheme, GovUpdate |
| `weather` | Forecasts | (external API, cached) |
| `yield_prediction` | Yield & suggestions | YieldQuery, CropSuggestionQuery |

Each app can be developed, tested, and deployed independently. Adding a new feature (e.g., soil testing) means adding a new Django app without touching existing code -- following the **Open/Closed Principle**.

### 8. Database-Backed Caching

OTP codes, session data, and frequently accessed data use Django's database cache backend (`django.core.cache.backends.db.DatabaseCache`). This is deliberately chosen over Redis or Memcached because:
- No additional infrastructure to manage (no ElastiCache cluster)
- Cache data is automatically backed up with RDS automated backups
- Sufficient performance for the current scale
- Reduces AWS service count and cost for an MVP

### 9. CORS and Security Headers

- `django-cors-headers` enforces a strict whitelist of allowed origins (`CORS_ALLOWED_ORIGINS`), preventing unauthorized domains from accessing the API
- Django's `SecurityMiddleware`, `CsrfViewMiddleware`, and `XFrameOptionsMiddleware` are enabled, providing clickjacking protection, CSRF defense, and security headers
- `CORS_ALLOW_CREDENTIALS = True` enables secure cookie-based auth flows while maintaining origin restrictions

### 10. Responsive Mobile-First Design

The frontend is built mobile-first using Material UI's responsive breakpoint system (`xs`, `sm`, `md`). This is critical because the majority of Indian farmers access the internet via smartphones. Key design decisions:
- Floating curved navigation bar with hamburger drawer on mobile, full link bar on desktop
- Touch-friendly tap targets (minimum 44px) for all interactive elements
- KisanMitraFab component provides a floating action button for instant chatbot access on any page
- Google Translate widget embedded in the utility bar for one-tap language switching across 9 Indian languages
- Progressive Web App (PWA) install prompt for home screen access

### 11. Automated Data Seeding via Migrations

Django migrations are used not just for schema changes but for **data seeding**:
- `0007_seed_dummy_users.py` creates the two demo accounts (farmer and vendor) idempotently
- `0003_seed_schemes.py` and `0004_seed_gov_updates.py` populate government scheme data
- `seed_categories` management command bootstraps marketplace categories

This ensures any fresh deployment has a working dataset without manual database scripts, following **Infrastructure as Code** principles.

### 12. Graceful AI Failure Handling

Every AI-powered endpoint wraps the model call in try/except with:
- Structured error responses (`HTTP 502 BAD_GATEWAY`) so the frontend can show user-friendly error messages
- Full exception logging via Python's `logging` module (routed to CloudWatch Logs)
- The request is still valid and the user can retry -- AI failures don't crash the application or corrupt data
- Fallback response parsing ensures partial AI outputs still produce usable results

---

## Demo Accounts

The SMS verification service (AWS SNS) is currently in **sandbox mode**. AWS requires a production access request for unrestricted SMS sending, which is pending approval due to new account limitations. In the meantime, use these pre-seeded accounts:

| Role | Phone | Password |
|------|-------|----------|
| **Farmer** | `9999900001` | `farmer123` |
| **Vendor** | `9999900002` | `vendor123` |

The Farmer account has access to all consumer features (disease detection, yield prediction, chatbot, marketplace, schemes, etc.). The Vendor account accesses the seller dashboard for managing products and orders.

---

## Project Structure

```
Agromod/
├── backend/                       # Django REST API (deployed on AWS Lambda)
│   ├── config/                    # Django settings, URLs, WSGI/ASGI
│   ├── apps/
│   │   ├── accounts/              # User auth, OTP via AWS SNS, profiles
│   │   ├── chatbot/               # Kisan Mitra AI chatbot (text + voice + TTS)
│   │   ├── disease/               # Crop disease detection (AI vision)
│   │   ├── marketplace/           # Product listings, orders, categories
│   │   ├── planner/               # Crop calendar / seasonal planner
│   │   ├── prices/                # Mandi price lookup
│   │   ├── schemes/               # Government schemes & updates
│   │   ├── weather/               # Weather forecasts & advisories
│   │   ├── yield_prediction/      # AI yield prediction & crop suggestions
│   │   └── gemini_client.py       # Shared AI client (Bedrock-compatible abstraction)
│   ├── lambda_handler.py          # AWS Lambda entry point (Mangum ASGI adapter)
│   ├── manage.py
│   └── requirements.txt
├── frontend/                      # React SPA (hosted on AWS S3 + CloudFront)
│   ├── src/
│   │   ├── components/            # NavBar, Footer, KisanMitraFab, etc.
│   │   ├── pages/                 # All page components
│   │   ├── services/              # API client & auth helpers
│   │   └── store/                 # AuthContext (React Context)
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Material UI 5, Chart.js, GSAP |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| AI/ML | AWS Bedrock (architecture) + Google Gemini 2.5 Flash (current runtime) |
| Database | Amazon RDS (PostgreSQL) |
| Storage | Amazon S3 (media, static assets, frontend hosting) |
| CDN | Amazon CloudFront (global edge delivery) |
| Compute | AWS Lambda + Mangum (serverless backend) |
| Auth SMS | Amazon SNS (OTP verification) |
| API Routing | Amazon API Gateway |

---

## Local Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+ (or use a managed instance)

### 1. Clone the Repository

```bash
git clone <repo-url>
cd Agromod
```

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the **project root** (Agromod/.env):

```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.postgresql
DB_NAME=agromod
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173

GEMINI_API_KEY=your-google-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash

AWS_SNS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### 4. Run Database Migrations

```bash
cd backend
python manage.py migrate
```

This will also seed the two dummy user accounts (via migration `0007_seed_dummy_users`).

### 5. Start the Backend Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`.

### 6. Frontend Setup

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the Django backend automatically.

---

## API Endpoints

All endpoints are prefixed with `/api/`.

| Module | Endpoints |
|--------|-----------|
| Auth | `POST /api/auth/login/`, `POST /api/auth/register/`, `POST /api/auth/verify-otp/`, `POST /api/auth/refresh/`, `GET /api/auth/me/` |
| Disease | `POST /api/disease/analyze/` (multipart image upload) |
| Yield | `POST /api/yield/predict/`, `GET /api/yield/suggest/` |
| Chatbot | `POST /api/chatbot/`, `POST /api/chatbot/tts/`, `GET /api/chatbot/live-token/` |
| Weather | `GET /api/weather/` |
| Prices | `GET /api/prices/` |
| Schemes | `GET /api/schemes/`, `GET /api/gov-updates/` |
| Planner | `GET/POST /api/planner/` |
| Marketplace | `GET/POST /api/marketplace/products/`, `POST /api/marketplace/orders/` |

---

## Building for Production

### Frontend

```bash
cd frontend
npm run build
```

The production build is output to `frontend/dist/` and deployed to an S3 bucket fronted by CloudFront.

### Backend

The backend runs on AWS Lambda via Mangum. The ASGI entry point is `backend/lambda_handler.py`. Deployment packages are uploaded to Lambda directly or via S3.

---

## Key Features

- **AI Crop Disease Detection** -- Upload a leaf photo and receive instant AI-powered diagnosis with disease identification, severity assessment, step-by-step treatment recommendations, and specific product names available in Indian markets -- all returned as structured data for rich UI rendering.

- **AI Yield Prediction with Live Weather** -- Get data-driven yield forecasts that combine your crop, region, and season with real-time 7-day weather data for your specific state, historical yield records, and MSP pricing -- all synthesized by the AI model into plain-language advice a farmer can act on immediately.

- **AI Crop Suggestions with Financial Analysis** -- Receive ranked crop recommendations for your region and season, each with multi-year yield data, MSP rates in INR, estimated profit per hectare after cultivation costs, and rotation benefits with your current crop.

- **Kisan Mitra -- Multimodal AI Farming Assistant** -- A voice-enabled chatbot that accepts text, spoken audio, and images simultaneously. Ask questions by speaking in Hindi or other regional languages. The AI responds with text and reads answers aloud using AI-generated speech (TTS). Supports real-time voice conversations via WebSocket. Designed to serve farmers regardless of literacy level.

- **Weather Intelligence** -- Location-based weather forecasts with agricultural impact analysis and farming advisories.

- **Real-Time Mandi Prices** -- Live market prices from government data sources to help farmers make informed selling decisions.

- **Government Schemes Discovery** -- Browse, search, and discover relevant central and state agricultural schemes, subsidies, and policy updates with video explainers.

- **Farmer-Vendor Marketplace** -- A complete e-commerce module where farmers can browse and purchase agricultural inputs, and vendors can manage their product catalog and orders through a dedicated dashboard.

- **Crop Planner** -- Seasonal crop calendar and planning tools for better farm management.

- **Multi-language Support** -- Google Translate integration supporting 9 Indian languages (Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Tamil, Telugu) for the entire UI.

- **Serverless & Scalable** -- The entire backend auto-scales from zero to thousands of concurrent users with no infrastructure management, powered by AWS Lambda. The frontend is served globally via CloudFront CDN for sub-100ms load times across India.
