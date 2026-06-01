/** Foursquare Places API — Service Key auth (Bearer + version header) */
export function getFoursquareAuthHeaders(): Record<string, string> {
  const apiKey = process.env.FOURSQUARE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('FOURSQUARE_API_KEY is not set');
  }

  const authorization = apiKey.startsWith('Bearer ') ? apiKey : `Bearer ${apiKey}`;

  return {
    Authorization: authorization,
    Accept: 'application/json',
    'X-Places-Api-Version': process.env.FOURSQUARE_API_VERSION ?? '2025-06-17',
  };
}
