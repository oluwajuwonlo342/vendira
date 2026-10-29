export const buildAddressText = (location = {}) =>
  [location.address, location.city, location.state, location.country].filter(Boolean).join(', ');

export const mapsDirectionsUrl = (query) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`;

export const mapsSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

// Keyless embed address. It is not part of Google's documented API, so the card
// also offers plain links that keep working if this ever changes.
export const mapsEmbedUrl = (query) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
