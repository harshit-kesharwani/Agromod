"""
Yield prediction and crop suggestion using Google Gemini.

Fetches live weather data for the region and instructs Gemini to
factor in current conditions and historical yield/profit numbers.
"""
import logging
import requests as http_requests

from apps.gemini_client import ask_text

logger = logging.getLogger(__name__)

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

STATE_COORDS = {
    "Andhra Pradesh": (15.9, 79.7), "Arunachal Pradesh": (27.1, 93.6),
    "Assam": (26.2, 92.9), "Bihar": (25.1, 85.3), "Chhattisgarh": (21.3, 81.6),
    "Goa": (15.3, 74.0), "Gujarat": (22.3, 71.2), "Haryana": (29.1, 76.1),
    "Himachal Pradesh": (31.1, 77.2), "Jharkhand": (23.6, 85.3),
    "Karnataka": (15.3, 75.7), "Kerala": (10.9, 76.3), "Madhya Pradesh": (23.5, 78.6),
    "Maharashtra": (19.7, 75.7), "Manipur": (24.7, 93.9), "Meghalaya": (25.5, 91.4),
    "Mizoram": (23.2, 92.9), "Nagaland": (26.2, 94.6), "Odisha": (20.9, 84.0),
    "Punjab": (31.1, 75.3), "Rajasthan": (27.0, 74.2), "Sikkim": (27.5, 88.5),
    "Tamil Nadu": (11.1, 78.7), "Telangana": (18.1, 79.0), "Tripura": (23.9, 91.9),
    "Uttar Pradesh": (26.8, 80.9), "Uttarakhand": (30.1, 79.0),
    "West Bengal": (22.6, 87.8), "Delhi": (28.7, 77.1),
    "Jammu and Kashmir": (33.3, 75.0), "Ladakh": (34.2, 77.6),
    "Chandigarh": (30.7, 76.8), "Puducherry": (11.9, 79.8),
    "Andaman and Nicobar Islands": (11.7, 92.7), "Lakshadweep": (10.6, 72.6),
    "Dadra and Nagar Haveli and Daman and Diu": (20.4, 73.0),
}


def _fetch_weather(state: str, latitude: float = None, longitude: float = None) -> str:
    """Fetch current weather from Open-Meteo. Uses exact lat/lon when provided, else falls back to state centre."""
    if latitude is not None and longitude is not None:
        lat, lon = latitude, longitude
    else:
        coords = STATE_COORDS.get(state)
        if not coords:
            return "Weather data not available for this region."
        lat, lon = coords
    try:
        resp = http_requests.get(WEATHER_URL, params={
            "latitude": lat,
            "longitude": lon,
            "current_weather": "true",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
            "forecast_days": 7,
            "timezone": "Asia/Kolkata",
        }, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        cw = data.get("current_weather", {})
        daily = data.get("daily", {})
        dates = daily.get("time", [])
        maxes = daily.get("temperature_2m_max", [])
        mins = daily.get("temperature_2m_min", [])
        rain = daily.get("precipitation_sum", [])

        lines = [
            f"Current temperature: {cw.get('temperature')} C, "
            f"wind speed: {cw.get('windspeed')} km/h."
        ]
        if dates:
            lines.append("7-day forecast:")
            for i, d in enumerate(dates):
                lines.append(
                    f"  {d}: {mins[i]}-{maxes[i]} C, rain {rain[i]} mm"
                )
        return "\n".join(lines)
    except Exception:
        logger.exception("Failed to fetch weather for yield prediction")
        return "Weather data temporarily unavailable."


YIELD_SYSTEM_PROMPT = (
    "You are an expert Indian agricultural advisor with deep knowledge of "
    "Indian crop yields, MSP rates, and farming economics.\n\n"
    "Given a crop, state/region, season, land area, and LIVE WEATHER DATA, "
    "provide a yield prediction. You MUST include ALL of the following:\n\n"
    "1. Expected yield range (in quintals/hectare) for THIS season, "
    "considering the current weather conditions provided.\n"
    "2. Previous year data: State the approximate yield for the same crop "
    "in the same region last year (or the most recent available year). "
    "Include the year, yield in quintals/hectare, and MSP or market price "
    "per quintal in INR.\n"
    "3. How the current weather forecast (provided below) will impact "
    "the yield positively or negatively.\n"
    "4. Key factors affecting yield and 3-4 actionable tips to maximise it.\n\n"
    "STRICT FORMATTING RULES:\n"
    "- Use simple language a farmer can understand.\n"
    "- Do NOT use markdown. No asterisks, no hashes, no bullet symbols.\n"
    "- Use plain numbered lists (1. 2. 3.) and sub-points (a. b. c.) only.\n"
    "- STRICTLY limit response to 350-450 words.\n"
    "- Always finish with a complete sentence."
)

SUGGESTION_SYSTEM_PROMPT = (
    "You are an expert Indian agricultural advisor with deep knowledge of "
    "Indian crop yields, MSP rates, market prices, and farming economics.\n\n"
    "Given a state/region, season, and optionally the current/previous crop, "
    "suggest the top 3-5 most profitable crops. For EACH crop you MUST include "
    "ALL of the following with REAL NUMBERS:\n\n"
    "1. Average yield in the region (quintals/hectare).\n"
    "2. Historical data for the last 2-3 years: For each year, state the "
    "approximate yield (quintals/hectare), MSP or average market price "
    "(INR/quintal), and estimated profit per hectare (INR) after typical "
    "cost of cultivation.\n"
    "3. Why this crop suits the region and season.\n"
    "4. Market demand outlook and any MSP advantages.\n"
    "5. Rotation benefits with the previous crop (if provided).\n\n"
    "Example format for each crop:\n"
    "1. Crop Name\n"
    "   Avg yield: 25 quintals/hectare\n"
    "   2023-24: Yield 24 q/ha, MSP Rs 2275/q, Profit approx Rs 28,000/ha\n"
    "   2024-25: Yield 26 q/ha, MSP Rs 2550/q, Profit approx Rs 35,000/ha\n"
    "   Suits because: ...\n"
    "   Market outlook: ...\n\n"
    "STRICT FORMATTING RULES:\n"
    "- Prioritise crops with good MSP or strong market linkages.\n"
    "- Use real/approximate Indian government data and MSP rates.\n"
    "- Do NOT use markdown. No asterisks, no hashes, no bullet symbols.\n"
    "- Use plain numbered lists and sub-points only.\n"
    "- STRICTLY limit response to 400-500 words.\n"
    "- Always finish with a complete sentence."
)


def predict_yield(
    crop: str, region: str, season: str, area: str = "",
    latitude: float = None, longitude: float = None,
    location_name: str = "",
) -> str:
    weather_info = _fetch_weather(region, latitude, longitude)
    area_info = f", on approximately {area}" if area else ""

    location_desc = location_name or region
    if location_name and region and region.lower() not in location_name.lower():
        location_desc = f"{location_name}, {region}"

    user_msg = (
        f"Predict the yield for {crop} grown in {location_desc} during the "
        f"{season} season{area_info}.\n\n"
        f"CURRENT WEATHER DATA FOR {location_desc.upper()}:\n{weather_info}\n\n"
        f"Use this weather data to assess how current conditions will affect "
        f"the crop. Also include last year's yield and price data for {crop} "
        f"in {region}."
    )
    try:
        return ask_text(YIELD_SYSTEM_PROMPT, user_msg)
    except Exception:
        logger.exception("Gemini yield prediction failed")
        raise


def suggest_crops(
    region: str, season: str, current_crop: str = "",
    latitude: float = None, longitude: float = None,
    location_name: str = "",
) -> str:
    crop_info = (
        f" The farmer's current/previous crop is {current_crop}."
        if current_crop
        else ""
    )

    location_desc = location_name or region
    if location_name and region and region.lower() not in location_name.lower():
        location_desc = f"{location_name}, {region}"

    user_msg = (
        f"Suggest the most profitable crops for {location_desc} in the "
        f"{season} season.{crop_info}\n\n"
        f"For each suggested crop, include yield and profit data for "
        f"the last 2-3 years with actual numbers (yield in quintals/hectare, "
        f"MSP or market price in INR/quintal, and estimated profit in INR/hectare)."
    )
    try:
        return ask_text(SUGGESTION_SYSTEM_PROMPT, user_msg)
    except Exception:
        logger.exception("Gemini crop suggestion failed")
        raise
