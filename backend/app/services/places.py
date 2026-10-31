"""Service Centre locator with Google Places API (New) and 24-hour caching."""
import time
import math
from typing import List, Dict, Any, Optional, Tuple
import httpx
from ..config import GOOGLE_PLACES_API_KEY

SCHEME_CENTER_KEYWORDS: Dict[str, List[str]] = {
    "pm-kisan": ["Common Service Centre", "MeeSeva"],
    "pm-jay": ["Common Service Centre", "Ayushman empanelled hospital"],
    "ssy": ["post office", "bank"],
    "ignoaps": ["Block Development Office", "District Social Welfare Office"],
    "pmay-g": ["Gram Panchayat office"],
    "ntr-bharosa-oap": ["Grama Sachivalayam", "Ward Sachivalayam", "MPDO office"],
    "post-matric-sc": ["Common Service Centre", "Social Welfare office"]
}

DEFAULT_KEYWORDS = ["Common Service Centre", "Grama Sachivalayam", "MeeSeva"]

# 24-hour in-memory cache: (lat, lng, query, radius) -> (timestamp, data)
_places_cache: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 86400  # 24 hours

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Calculate distance in meters between two coordinates."""
    r = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return int(r * c)

def get_nearby_service_centers(
    lat: float,
    lng: float,
    scheme_id: Optional[str] = None,
    radius_m: int = 10000
) -> Dict[str, Any]:
    """
    Query nearby government service centres.
    Uses Google Places API (New) when API key is provided.
    Never fabricates place, phone, or opening hours.
    """
    keywords = SCHEME_CENTER_KEYWORDS.get(scheme_id, DEFAULT_KEYWORDS) if scheme_id else DEFAULT_KEYWORDS
    cache_key = f"{round(lat, 3)}:{round(lng, 3)}:{scheme_id}:{radius_m}"

    now = time.time()
    if cache_key in _places_cache:
        cached_time, cached_data = _places_cache[cache_key]
        if now - cached_time < CACHE_TTL_SECONDS:
            return {
                "centers": cached_data,
                "attribution": "Google",
                "cached": True
            }

    if not GOOGLE_PLACES_API_KEY:
        # Per requirement: If API key is missing or down, return a clear error and let app show 'Could not load centres'
        return {
            "error": "Google Places API key is not configured. / గూగుల్ ప్లేసెస్ API కీ అందుబాటులో లేదు.",
            "centers": [],
            "attribution": "Google"
        }

    search_query = keywords[0]
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.currentOpeningHours,places.types"
    }
    payload = {
        "textQuery": search_query,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius_m)
            }
        }
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                return {
                    "error": f"Places API returned status {resp.status_code}",
                    "centers": [],
                    "attribution": "Google"
                }
            data = resp.json()
            raw_places = data.get("places", [])

            formatted = []
            for p in raw_places:
                loc = p.get("location", {})
                p_lat = loc.get("latitude", lat)
                p_lng = loc.get("longitude", lng)
                dist = calculate_haversine_distance(lat, lng, p_lat, p_lng)

                open_now = None
                if "currentOpeningHours" in p and "openNow" in p["currentOpeningHours"]:
                    open_now = p["currentOpeningHours"]["openNow"]

                formatted.append({
                    "name": p.get("displayName", {}).get("text", search_query),
                    "address": p.get("formattedAddress", ""),
                    "distance_m": dist,
                    "phone": p.get("nationalPhoneNumber"),
                    "lat": p_lat,
                    "lng": p_lng,
                    "place_type": p.get("types", ["government_office"])[0],
                    "open_now": open_now
                })

            formatted.sort(key=lambda x: x["distance_m"])
            _places_cache[cache_key] = (now, formatted)

            return {
                "centers": formatted,
                "attribution": "Google",
                "cached": False
            }
    except Exception as e:
        return {
            "error": f"Failed to connect to Google Places API: {str(e)}",
            "centers": [],
            "attribution": "Google"
        }

def geocode_place(query: str) -> Dict[str, Any]:
    """Geocode a place/town query using Places text search."""
    if not GOOGLE_PLACES_API_KEY:
        return {
            "error": "Google Places API key is not configured.",
            "results": []
        }
    url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.location"
    }
    payload = {"textQuery": query}
    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                places = resp.json().get("places", [])
                results = []
                for p in places:
                    loc = p.get("location", {})
                    results.append({
                        "name": p.get("displayName", {}).get("text", query),
                        "address": p.get("formattedAddress", ""),
                        "lat": loc.get("latitude"),
                        "lng": loc.get("longitude")
                    })
                return {"results": results}
    except Exception:
        pass
    return {"results": []}
