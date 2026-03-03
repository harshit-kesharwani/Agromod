"""
AWS Bedrock integration for yield prediction and crop suggestion.

Uses the Bedrock Runtime converse API with Claude (or any supported model).
Requires: boto3, and AWS credentials configured via env vars or IAM role.
"""
import json
import logging

import boto3
from django.conf import settings

logger = logging.getLogger(__name__)

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_BEDROCK_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
    return _client


def _invoke(system_prompt: str, user_message: str) -> str:
    """Send a prompt to Bedrock and return the text response."""
    client = _get_client()
    model_id = settings.AWS_BEDROCK_MODEL_ID

    response = client.converse(
        modelId=model_id,
        system=[{"text": system_prompt}],
        messages=[
            {
                "role": "user",
                "content": [{"text": user_message}],
            }
        ],
        inferenceConfig={
            "maxTokens": 1024,
            "temperature": 0.4,
        },
    )

    output_message = response["output"]["message"]
    text_parts = [
        block["text"]
        for block in output_message["content"]
        if "text" in block
    ]
    return "\n".join(text_parts)


YIELD_SYSTEM_PROMPT = (
    "You are an expert Indian agricultural advisor. "
    "Given a crop, state/region, season, and optionally the land area, "
    "provide a concise yield prediction. Include:\n"
    "1. Expected yield range (in quintals/hectare or tonnes/acre)\n"
    "2. Key factors affecting yield in that region/season\n"
    "3. Tips to maximise yield\n"
    "4. Best practices for the specific crop-season combination\n"
    "Keep the response practical and actionable for a farmer. "
    "Use simple language. Respond in 150-250 words."
)

SUGGESTION_SYSTEM_PROMPT = (
    "You are an expert Indian agricultural advisor. "
    "Given a state/region, season, and optionally the current/previous crop, "
    "suggest the top 3-5 most profitable crops to grow. For each crop include:\n"
    "1. Expected profit potential (relative)\n"
    "2. Why it suits this region and season\n"
    "3. Market demand outlook\n"
    "4. Any rotation benefits with the previous crop (if provided)\n"
    "Prioritise crops with good MSP or strong market linkages. "
    "Keep the response practical. Respond in 150-250 words."
)


def predict_yield(crop: str, region: str, season: str, area: str = "") -> str:
    area_info = f", on approximately {area}" if area else ""
    user_msg = (
        f"Predict the yield for {crop} grown in {region} during the {season} season{area_info}."
    )
    try:
        return _invoke(YIELD_SYSTEM_PROMPT, user_msg)
    except Exception:
        logger.exception("Bedrock yield prediction failed")
        raise


def suggest_crops(region: str, season: str, current_crop: str = "") -> str:
    crop_info = (
        f" The farmer's current/previous crop is {current_crop}."
        if current_crop
        else ""
    )
    user_msg = (
        f"Suggest the most profitable crops for {region} in the {season} season.{crop_info}"
    )
    try:
        return _invoke(SUGGESTION_SYSTEM_PROMPT, user_msg)
    except Exception:
        logger.exception("Bedrock crop suggestion failed")
        raise
