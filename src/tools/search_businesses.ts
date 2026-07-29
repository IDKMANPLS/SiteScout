import type { Tool } from "@modelcontextprotocol/sdk/types.js";

// ── TypeScript interfaces for Google Places API responses ──

interface PlacesTextSearchResponse {
  results: PlacesTextSearchResult[];
  status: string;
  error_message?: string;
  next_page_token?: string;
}

interface PlacesTextSearchResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  types?: string[];
  photos?: PlacePhoto[];
  // website is NOT returned by Text Search — we need Place Details for that
}

interface PlaceDetailsResponse {
  result: PlaceDetailsResult | null;
  status: string;
  error_message?: string;
}

interface PlaceDetailsResult {
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  rating?: number;
  types?: string[];
  website?: string;
  photos?: PlacePhoto[];
}

interface PlacePhoto {
  photo_reference: string;
  width: number;
  height: number;
  html_attributions: string[];
}

// ── Output types ──

interface EnrichedBusiness {
  name: string;
  address: string;
  phone: string;
  rating: number | null;
  types: string[];
  place_id: string;
  photos: string[];
}

// ── Tool definition ──

export const searchBusinessesTool: Tool = {
  name: "search_businesses",
  description:
    "Search for businesses in a given location that do NOT have a website. " +
    "Enriches results with photos from Google Places. " +
    "Use this to find potential leads for website building services.",
  inputSchema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "Location to search (e.g., 'Austin, TX', 'Lower East Side, New York')",
      },
      radius: {
        type: "number",
        description: "Search radius in meters (default: 5000)",
      },
      maxResults: {
        type: "number",
        description: "Maximum number of results to return (default: 20)",
      },
    },
    required: ["location"],
  },
};

// ── Tool handler ──

export async function handleSearchBusinesses(args: {
  location: string;
  radius?: number;
  maxResults?: number;
}): Promise<string> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return JSON.stringify({
      error:
        "Google Places API key is not configured. Set the GOOGLE_PLACES_API_KEY " +
        "environment variable to your API key. Get one at: " +
        "https://console.cloud.google.com/apis/credentials",
    });
  }

  // Input validation
  if (!args.location || args.location.trim().length === 0) {
    return JSON.stringify({
      error: "Missing required parameter: 'location' must be a non-empty string (e.g., 'Austin, TX').",
    });
  }

  const radius = args.radius != null && args.radius > 0 ? args.radius : 5000;
  const maxResults = args.maxResults != null && args.maxResults > 0 ? args.maxResults : 20;

  // Step 1: Use Places Text Search to find businesses in the area
  const textSearchUrl = new URL("https://maps.googleapis.com/maps/api/place/textsearch/json");
  textSearchUrl.searchParams.set("query", `businesses in ${args.location}`);
  textSearchUrl.searchParams.set("radius", String(radius));
  textSearchUrl.searchParams.set("key", apiKey);

  let textSearchResponse: PlacesTextSearchResponse;
  try {
    const res = await fetch(textSearchUrl.toString());
    if (!res.ok) {
      return JSON.stringify({
        error: `Google Places API returned HTTP ${res.status}: ${res.statusText}`,
      });
    }
    textSearchResponse = (await res.json()) as PlacesTextSearchResponse;
  } catch (err) {
    return JSON.stringify({
      error: `Failed to call Google Places Text Search: ${err instanceof Error ? err.message : String(err)}`,
    });
  }

  if (textSearchResponse.status !== "OK" && textSearchResponse.status !== "ZERO_RESULTS") {
    return JSON.stringify({
      error: `Google Places API error: ${textSearchResponse.status}`,
      detail: textSearchResponse.error_message ?? null,
    });
  }

  if (textSearchResponse.status === "ZERO_RESULTS" || !textSearchResponse.results?.length) {
    return JSON.stringify({
      businesses: [],
      count: 0,
      message: `No businesses found in "${args.location}". Try a different location or increase the radius.`,
    });
  }

  // Step 2: For each result, fetch Place Details to check for website presence
  // We'll process them concurrently but limit to maxResults
  const candidates = textSearchResponse.results.slice(0, maxResults);

  const detailsResults = await Promise.allSettled(
    candidates.map((place) => fetchPlaceDetails(place.place_id, apiKey))
  );

  // Step 3: Filter to only businesses WITHOUT a website, then enrich with photo URLs
  const businesses: EnrichedBusiness[] = [];

  for (let i = 0; i < detailsResults.length; i++) {
    const result = detailsResults[i];
    if (result.status === "rejected") continue;

    const details = result.value;
    if (!details) continue;

    // Skip businesses that already have a website
    if (details.website) continue;

    const photoUrls = buildPhotoUrls(details.photos ?? []);

    businesses.push({
      name: details.name ?? candidates[i].name ?? "Unknown",
      address: details.formatted_address ?? "",
      phone: details.formatted_phone_number ?? "",
      rating: details.rating ?? null,
      types: details.types ?? [],
      place_id: candidates[i].place_id,
      photos: photoUrls,
    });
  }

  return JSON.stringify({
    businesses,
    count: businesses.length,
    searched: candidates.length,
    location: args.location,
    radius,
    photoNote: "Photo URLs require appending &key=YOUR_GOOGLE_PLACES_API_KEY to work.",
    message:
      businesses.length > 0
        ? `Found ${businesses.length} businesses without websites in "${args.location}".`
        : `No businesses without websites found in "${args.location}" — all results already have sites.`,
  });
}

// ── Helpers ──

async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetailsResult | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set(
    "fields",
    "name,formatted_address,formatted_phone_number,rating,types,website,photos"
  );
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return null;

  const data = (await res.json()) as PlaceDetailsResponse;
  if (data.status !== "OK") return null;

  return data.result;
}

function buildPhotoUrls(photos: PlacePhoto[]): string[] {
  return photos.slice(0, 5).map((photo) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}`;
  });
}
