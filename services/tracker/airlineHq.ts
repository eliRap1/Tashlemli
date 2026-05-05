export const AIRLINE_HQ: Record<string, { iata: string; city: string; lat: number; lon: number; mailHost?: string }> = {
  LY: { iata: "TLV", city: "Tel Aviv",      lat: 32.0114, lon: 34.8866, mailHost: "elal-corp.com" },
  LH: { iata: "FRA", city: "Frankfurt",     lat: 50.1109, lon: 8.6821,  mailHost: "lufthansa.com" },
  AF: { iata: "CDG", city: "Paris",         lat: 49.0097, lon: 2.5479,  mailHost: "airfrance.fr" },
  KL: { iata: "AMS", city: "Amsterdam",     lat: 52.3105, lon: 4.7683,  mailHost: "klm.com" },
  BA: { iata: "LHR", city: "London",        lat: 51.5074, lon: -0.1278, mailHost: "ba.com" },
  TK: { iata: "IST", city: "Istanbul",      lat: 41.0082, lon: 28.9784, mailHost: "thy.com" },
  U2: { iata: "LTN", city: "Luton",         lat: 51.8747, lon: -0.3683, mailHost: "easyjet.com" },
  OS: { iata: "VIE", city: "Vienna",        lat: 48.2082, lon: 16.3738, mailHost: "austrian.com" },
};

export const TLV = { iata: "TLV", city: "Tel Aviv", lat: 32.0114, lon: 34.8866 };
