# Agromod — AWS Monthly Cost Estimation (MVP)

> **Assumptions:** MVP with ~500 registered farmers, ~100 DAU (daily active users),
> moderate usage patterns. Region: **ap-south-1 (Mumbai)**.
> AI costing uses **Amazon Bedrock — Claude 3.5 Sonnet** instead of Gemini.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Amazon CloudFront                         │
│              (CDN for React frontend + API routing)              │
└────────────────┬────────────────────────┬────────────────────────┘
                 │                        │
      ┌──────────▼──────────┐   ┌────────▼────────────┐
      │   S3 (Frontend)     │   │  API Gateway (HTTP)  │
      │   React SPA build   │   │   REST API routes    │
      └─────────────────────┘   └────────┬────────────┘
                                         │
                               ┌─────────▼─────────┐
                               │   AWS Lambda       │
                               │  Django + Mangum   │
                               │  (Python 3.11)     │
                               └──┬──────┬──────┬───┘
                                  │      │      │
                    ┌─────────────▼┐  ┌──▼───┐  ├──────────────┐
                    │ RDS Postgres  │  │  S3  │  │ Bedrock      │
                    │ (db.t3.micro) │  │Media │  │ Claude 3.5   │
                    └───────────────┘  └──────┘  │ Sonnet       │
                                                 └──────────────┘
                                   │
                            ┌──────▼──────┐
                            │  Amazon SNS  │
                            │  (OTP SMS)   │
                            └─────────────┘
```

---

## 1. Compute — AWS Lambda

| Parameter | Value |
|-----------|-------|
| Runtime | Python 3.11 (Django via Mangum) |
| Memory | 512 MB |
| Avg execution time | ~800 ms (API), ~3 s (AI calls) |
| API endpoints | ~38 |
| Estimated invocations/month | ~150,000 |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Requests (first 1M free) | 150,000 × $0.20/1M | **$0.03** |
| Duration (400K GB-s free) | 150K × 0.5 GB × 1.5s avg = 112,500 GB-s → within free tier | **$0.00** |
| **Lambda Total** | | **$0.03** |

> Lambda free tier: 1M requests + 400K GB-seconds/month. MVP usage fits within free tier.

---

## 2. API Gateway (HTTP API)

| Parameter | Value |
|-----------|-------|
| API type | HTTP API (cheaper than REST API) |
| Requests/month | ~150,000 |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| First 300M requests | 150,000 × $1.00/1M | **$0.15** |
| **API Gateway Total** | | **$0.15** |

---

## 3. Database — Amazon RDS (PostgreSQL)

| Parameter | Value |
|-----------|-------|
| Instance | db.t3.micro (1 vCPU, 1 GB RAM) |
| Storage | 20 GB gp3 |
| Multi-AZ | No (MVP) |
| Backup | 7-day automated |
| Models | 18 Django models |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Instance (db.t3.micro) | 730 hrs × $0.018/hr | **$13.14** |
| Storage (20 GB gp3) | 20 × $0.115/GB | **$2.30** |
| Backup (within free 20GB) | — | **$0.00** |
| **RDS Total** | | **$15.44** |

> *Alternative:* Use RDS Free Tier (db.t3.micro, 750 hrs/month, 20GB — free for 12 months) → **$0.00**

---

## 4. Storage — Amazon S3

| Parameter | Value |
|-----------|-------|
| Frontend build (static) | ~10 MB |
| Media (product images, disease images) | ~2 GB growing |
| Static assets (Django collectstatic) | ~50 MB |
| Requests/month | ~50,000 GET, ~5,000 PUT |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Storage (3 GB) | 3 × $0.025/GB | **$0.08** |
| PUT requests | 5,000 × $0.005/1K | **$0.03** |
| GET requests | 50,000 × $0.0004/1K | **$0.02** |
| Data transfer | Served via CloudFront | **$0.00** |
| **S3 Total** | | **$0.13** |

---

## 5. CDN — Amazon CloudFront

| Parameter | Value |
|-----------|-------|
| Distribution | Frontend SPA + API proxy |
| Data transfer/month | ~5 GB (India edge) |
| Requests/month | ~200,000 |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Data transfer (first 1TB free) | 5 GB → within free tier | **$0.00** |
| HTTP requests | 200K (first 10M free) | **$0.00** |
| **CloudFront Total** | | **$0.00** |

> CloudFront free tier: 1 TB data out + 10M requests/month. MVP fits within this.

---

## 6. AI/ML — Amazon Bedrock (Claude 3.5 Sonnet)

### Usage Breakdown by Feature

| Feature | Calls/Day | Input Tokens/Call | Output Tokens/Call | Monthly Calls |
|---------|-----------|-------------------|--------------------|---------------|
| **Chatbot** (text Q&A) | 50 | ~500 | ~300 | 1,500 |
| **Kisan Mitra** (text + image) | 30 | ~800 | ~500 | 900 |
| **Kisan Mitra** (voice→text reply) | 20 | ~600 | ~500 | 600 |
| **Disease Analysis** (image) | 15 | ~1,200 (incl. image) | ~600 | 450 |
| **Yield Prediction** | 10 | ~800 | ~500 | 300 |
| **Crop Suggestions** | 10 | ~700 | ~600 | 300 |
| **TTS** (Bedrock not applicable)* | — | — | — | — |

> *\*TTS: Bedrock Claude does not support TTS. Use Amazon Polly instead (see section 7).*

### Bedrock Claude 3.5 Sonnet Pricing (ap-south-1)

| Token Type | Price |
|------------|-------|
| Input tokens | $3.00 / 1M tokens |
| Output tokens | $15.00 / 1M tokens |
| Image input | Converted to tokens (~1,600 tokens per image) |

### Monthly Token Calculation

| Feature | Input Tokens/mo | Output Tokens/mo |
|---------|-----------------|------------------|
| Chatbot | 750,000 | 450,000 |
| Kisan Mitra (text) | 720,000 | 450,000 |
| Kisan Mitra (voice) | 360,000 | 300,000 |
| Disease Analysis | 540,000 + 720,000 (images) | 270,000 |
| Yield Prediction | 240,000 | 150,000 |
| Crop Suggestions | 210,000 | 180,000 |
| **Total** | **3,540,000** | **1,800,000** |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Input tokens | 3.54M × $3.00/1M | **$10.62** |
| Output tokens | 1.80M × $15.00/1M | **$27.00** |
| **Bedrock Claude Total** | | **$37.62** |

> *Alternative:* **Claude 3.5 Haiku** ($0.80/$4.00 per 1M tokens) → **$10.03/month**
> for lower-quality but significantly cheaper responses.

---

## 7. Text-to-Speech — Amazon Polly

> Replaces Gemini TTS for Kisan Mitra voice responses.

| Parameter | Value |
|-----------|-------|
| Characters/month | 600 calls × ~500 chars = 300,000 chars |
| Voice | Neural (Indian English/Hindi) |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| Neural TTS | 300K chars × $16.00/1M chars | **$4.80** |
| **Polly Total** | | **$4.80** |

> Polly free tier: 1M chars/month for standard, 5M chars for first 12 months (Neural).
> If within free tier period → **$0.00**

---

## 8. Messaging — Amazon SNS (OTP SMS)

| Parameter | Value |
|-----------|-------|
| OTP messages/month | ~1,000 (registrations + logins + password resets) |
| SMS type | Transactional |
| Region | India |

| Cost Component | Calculation | Monthly Cost |
|----------------|-------------|--------------|
| SMS (India) | 1,000 × $0.02/msg (approx) | **$20.00** |
| SNS publish requests | 1,000 × $0.50/1M | **$0.00** |
| **SNS SMS Total** | | **$20.00** |

> SMS costs vary. Using AWS SNS sandbox limits to 10 destinations → very low actual
> cost during testing. Production cost depends on volume and DLT registration.

---

## 9. Other AWS Services

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| **IAM** | User/role management | **Free** |
| **CloudWatch Logs** | Lambda logs (~2 GB/month) | **$1.04** |
| **CloudWatch Metrics** | Basic monitoring | **Free** |
| **Secrets Manager** (optional) | Store DB creds, API keys (4 secrets) | **$1.60** |
| **Route 53** (if custom domain) | 1 hosted zone + queries | **$0.50** |
| **ACM** (SSL certificate) | Public certificates | **Free** |
| **Other Total** | | **$3.14** |

---

## Monthly Cost Summary

| # | Service | Usage Specification | Monthly Cost (USD) |
|---|---------|---------------------|--------------------|
| 1 | AWS Lambda | 150K invocations, 512 MB, ~1.5 s avg | $0.03 |
| 2 | API Gateway (HTTP API) | 150K requests/month | $0.15 |
| 3 | RDS PostgreSQL (db.t3.micro) | 1 vCPU, 1 GB RAM, 20 GB gp3 storage | $15.44 |
| 4 | S3 (Storage + Media) | 3 GB stored, 50K GET + 5K PUT requests | $0.13 |
| 5 | CloudFront (CDN) | 5 GB transfer, 200K requests | $0.00 |
| 6 | **Bedrock — Claude 3.5 Sonnet** | **3.54M input + 1.80M output tokens** | **$37.62** |
| 7 | Amazon Polly (TTS) | 300K characters, Neural voice | $4.80 |
| 8 | SNS (OTP SMS) | 1,000 transactional SMS (India) | $20.00 |
| 9 | CloudWatch Logs | ~2 GB log ingestion/month | $1.04 |
| 10 | Secrets Manager | 4 secrets (DB creds, API keys) | $1.60 |
| 11 | Route 53 | 1 hosted zone + DNS queries | $0.50 |
| 12 | ACM (SSL) | 1 public certificate | Free |
| 13 | IAM | Roles & policies for Lambda, S3, Bedrock | Free |
| | | | |
| | **TOTAL (without free tier)** | | **$81.31** |
| | **TOTAL (with free tier, first 12 months)** | | **~$61.87** |

---

## Cost Optimization Options

| Strategy | Potential Savings |
|----------|-------------------|
| Use **Claude 3.5 Haiku** instead of Sonnet for chatbot/simple queries | -$20/mo |
| Use **RDS Free Tier** (first 12 months) | -$15/mo |
| Use **Polly Free Tier** (first 12 months) | -$5/mo |
| Reduce SMS via WhatsApp Business API or email OTP | -$10-15/mo |
| Cache frequent AI responses (crop suggestions, schemes) | -$5-10/mo |
| Use **Lambda provisioned concurrency** only if cold starts are an issue | +$5-10/mo |

### Minimum Possible Monthly Cost (with all optimizations)

| Scenario | Monthly Cost |
|----------|-------------|
| Full free tier + Haiku + SMS optimization | **~$25–35** |
| Production (post free tier, Sonnet) | **~$80–90** |
| Scale (1000 DAU, Sonnet) | **~$150–200** |

---

## Bedrock vs Gemini Cost Comparison

| Model | Input (/1M tokens) | Output (/1M tokens) | Est. Monthly (MVP) |
|-------|--------------------|--------------------|---------------------|
| Gemini 2.5 Flash | $0.15 | $0.60 | ~$1.60 |
| Claude 3.5 Haiku (Bedrock) | $0.80 | $4.00 | ~$10.03 |
| Claude 3.5 Sonnet (Bedrock) | $3.00 | $15.00 | ~$37.62 |
| Claude 3 Opus (Bedrock) | $15.00 | $75.00 | ~$188.10 |

> **Note:** Gemini Flash is significantly cheaper, but Bedrock Claude offers
> tighter AWS integration, enterprise SLA, data residency compliance, and
> no data used for model training — important for production deployments.

---

*Generated: March 2026 | Prices based on AWS ap-south-1 (Mumbai) region pricing.*
*Actual costs may vary based on usage patterns, data transfer, and AWS pricing changes.*
