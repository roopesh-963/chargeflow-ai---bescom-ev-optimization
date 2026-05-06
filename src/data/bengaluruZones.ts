export type ExistingStation = {
  name: string;
  lat: number;
  lon: number;
  chargers: number;
};

export type BengaluruZone = {
  name: string;
  lat: number;
  lon: number;
  ward: string;
  population: number;
  area_sqkm: number;
  ev_users: number;
  chargers: number;
  grid_capacity_kw: number;
  daily_demand_kw: number;
  avg_income: 'high' | 'medium' | 'low';
  major_poi: string[];
  existing_stations: ExistingStation[];
};

type WardFeature = {
  type: 'Feature';
  properties: {
    name: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
};

export const bengaluruZones: BengaluruZone[] = [
  {
    name: 'Whitefield',
    lat: 12.9698,
    lon: 77.7499,
    ward: 'Mahadevapura',
    population: 285000,
    area_sqkm: 22.4,
    ev_users: 4200,
    chargers: 18,
    grid_capacity_kw: 8500,
    daily_demand_kw: 6200,
    avg_income: 'high',
    major_poi: ['ITPL', 'Phoenix Marketcity', 'Whitefield Railway Station'],
    existing_stations: [
      { name: 'ITPL Charging Hub', lat: 12.9716, lon: 77.7412, chargers: 6 },
      { name: 'Phoenix Mall Station', lat: 12.9697, lon: 77.7499, chargers: 4 },
    ],
  },
  {
    name: 'Koramangala',
    lat: 12.9279,
    lon: 77.6271,
    ward: 'Koramangala',
    population: 178000,
    area_sqkm: 9.8,
    ev_users: 3100,
    chargers: 12,
    grid_capacity_kw: 6200,
    daily_demand_kw: 5100,
    avg_income: 'high',
    major_poi: ['Forum Mall', 'Sony World Signal', 'BDA Complex'],
    existing_stations: [{ name: 'Forum Mall EV Point', lat: 12.9344, lon: 77.6101, chargers: 5 }],
  },
  {
    name: 'Electronic City',
    lat: 12.8399,
    lon: 77.677,
    ward: 'Electronic City',
    population: 195000,
    area_sqkm: 18.2,
    ev_users: 3800,
    chargers: 14,
    grid_capacity_kw: 9200,
    daily_demand_kw: 7100,
    avg_income: 'medium',
    major_poi: ['Infosys Campus', 'Wipro Campus', 'EC Phase 1'],
    existing_stations: [
      { name: 'Infosys EV Hub', lat: 12.8411, lon: 77.6762, chargers: 8 },
      { name: 'EC Phase 2 Station', lat: 12.832, lon: 77.6756, chargers: 3 },
    ],
  },
  {
    name: 'Hebbal',
    lat: 13.0353,
    lon: 77.595,
    ward: 'Hebbal',
    population: 142000,
    area_sqkm: 12.1,
    ev_users: 2400,
    chargers: 8,
    grid_capacity_kw: 5800,
    daily_demand_kw: 4200,
    avg_income: 'medium',
    major_poi: ['Manyata Tech Park', 'Hebbal Flyover', 'RMZ Infinity'],
    existing_stations: [{ name: 'Manyata Tech EV', lat: 13.0456, lon: 77.621, chargers: 6 }],
  },
  {
    name: 'Sarjapur',
    lat: 12.9082,
    lon: 77.6934,
    ward: 'Sarjapur',
    population: 165000,
    area_sqkm: 15.7,
    ev_users: 2900,
    chargers: 9,
    grid_capacity_kw: 6500,
    daily_demand_kw: 5400,
    avg_income: 'medium',
    major_poi: ['Sarjapur Road', 'Wipro SEZ', 'Total Mall'],
    existing_stations: [{ name: 'Sarjapur Road Hub', lat: 12.908, lon: 77.693, chargers: 4 }],
  },
  {
    name: 'Indiranagar',
    lat: 12.9784,
    lon: 77.6408,
    ward: 'Indiranagar',
    population: 98000,
    area_sqkm: 6.3,
    ev_users: 2100,
    chargers: 10,
    grid_capacity_kw: 4800,
    daily_demand_kw: 3900,
    avg_income: 'high',
    major_poi: ['100 Feet Road', 'CMH Road', 'Indiranagar Metro'],
    existing_stations: [{ name: 'Indiranagar Metro EV', lat: 12.9782, lon: 77.6401, chargers: 4 }],
  },
  {
    name: 'Yelahanka',
    lat: 13.1007,
    lon: 77.5963,
    ward: 'Yelahanka',
    population: 210000,
    area_sqkm: 28.6,
    ev_users: 1800,
    chargers: 6,
    grid_capacity_kw: 7200,
    daily_demand_kw: 3800,
    avg_income: 'medium',
    major_poi: ['Yelahanka Air Force Station', 'IIIT Bangalore', 'Esteem Mall'],
    existing_stations: [{ name: 'Yelahanka New Town EV', lat: 13.1005, lon: 77.596, chargers: 3 }],
  },
  {
    name: 'HSR Layout',
    lat: 12.9116,
    lon: 77.6474,
    ward: 'HSR Layout',
    population: 188000,
    area_sqkm: 12.4,
    ev_users: 3350,
    chargers: 11,
    grid_capacity_kw: 6900,
    daily_demand_kw: 5600,
    avg_income: 'high',
    major_poi: ['HSR Club', '27th Main', 'Agara Lake'],
    existing_stations: [
      { name: 'HSR Sector 2 Charging Point', lat: 12.9111, lon: 77.6479, chargers: 5 },
      { name: 'Agara Junction Fast Hub', lat: 12.9163, lon: 77.6384, chargers: 4 },
    ],
  },
  {
    name: 'Marathahalli',
    lat: 12.9591,
    lon: 77.6974,
    ward: 'Marathahalli',
    population: 236000,
    area_sqkm: 14.1,
    ev_users: 3620,
    chargers: 13,
    grid_capacity_kw: 7600,
    daily_demand_kw: 6350,
    avg_income: 'medium',
    major_poi: ['Marathahalli Bridge', 'Kalamandir', 'Outer Ring Road'],
    existing_stations: [
      { name: 'Marathahalli ORR Hub', lat: 12.9588, lon: 77.7018, chargers: 5 },
      { name: 'Kalamandir EV Stop', lat: 12.9572, lon: 77.6964, chargers: 4 },
    ],
  },
  {
    name: 'Jayanagar',
    lat: 12.925,
    lon: 77.5938,
    ward: 'Jayanagar',
    population: 154000,
    area_sqkm: 10.5,
    ev_users: 2550,
    chargers: 9,
    grid_capacity_kw: 5600,
    daily_demand_kw: 4410,
    avg_income: 'high',
    major_poi: ['4th Block', 'South End Circle', 'Lalbagh East Gate'],
    existing_stations: [
      { name: 'Jayanagar 4th Block EV', lat: 12.9258, lon: 77.5932, chargers: 4 },
      { name: 'South End Circle Charger', lat: 12.9224, lon: 77.5895, chargers: 3 },
    ],
  },
  {
    name: 'Rajajinagar',
    lat: 12.9916,
    lon: 77.5548,
    ward: 'Rajajinagar',
    population: 172000,
    area_sqkm: 11.2,
    ev_users: 2480,
    chargers: 8,
    grid_capacity_kw: 6100,
    daily_demand_kw: 4520,
    avg_income: 'medium',
    major_poi: ['Orion Mall', 'Dr Rajkumar Road', 'World Trade Center'],
    existing_stations: [
      { name: 'Orion Mall EV Deck', lat: 12.9913, lon: 77.5562, chargers: 4 },
      { name: 'Rajajinagar Metro Fast Charge', lat: 12.9919, lon: 77.5518, chargers: 3 },
    ],
  },
  {
    name: 'Banashankari',
    lat: 12.9255,
    lon: 77.5468,
    ward: 'Banashankari',
    population: 198000,
    area_sqkm: 16.3,
    ev_users: 2760,
    chargers: 9,
    grid_capacity_kw: 6400,
    daily_demand_kw: 5060,
    avg_income: 'medium',
    major_poi: ['Banashankari TTMC', 'Kathriguppe', 'BDA Complex'],
    existing_stations: [
      { name: 'Banashankari TTMC EV Bay', lat: 12.9251, lon: 77.5461, chargers: 4 },
      { name: 'Kathriguppe Charger Point', lat: 12.9276, lon: 77.5494, chargers: 3 },
    ],
  },
  {
    name: 'Bellandur',
    lat: 12.9259,
    lon: 77.6762,
    ward: 'Bellandur',
    population: 214000,
    area_sqkm: 13.6,
    ev_users: 3480,
    chargers: 12,
    grid_capacity_kw: 7050,
    daily_demand_kw: 5920,
    avg_income: 'high',
    major_poi: ['Bellandur Lake', 'Eco Space', 'Outer Ring Road'],
    existing_stations: [
      { name: 'Eco Space Charging Plaza', lat: 12.9266, lon: 77.6768, chargers: 5 },
      { name: 'Bellandur ORR Fast Hub', lat: 12.9294, lon: 77.6785, chargers: 4 },
    ],
  },
  {
    name: 'Malleshwaram',
    lat: 13.0035,
    lon: 77.5686,
    ward: 'Malleshwaram',
    population: 146000,
    area_sqkm: 8.9,
    ev_users: 2290,
    chargers: 9,
    grid_capacity_kw: 5750,
    daily_demand_kw: 4280,
    avg_income: 'high',
    major_poi: ['8th Cross', 'Sankey Tank', 'Mantri Square'],
    existing_stations: [
      { name: 'Mantri Square EV Deck', lat: 13.0097, lon: 77.5713, chargers: 4 },
      { name: 'Sankey Road Charging Point', lat: 13.0083, lon: 77.5721, chargers: 3 },
    ],
  },
  {
    name: 'KR Puram',
    lat: 13.008,
    lon: 77.6955,
    ward: 'KR Puram',
    population: 223000,
    area_sqkm: 17.9,
    ev_users: 3180,
    chargers: 10,
    grid_capacity_kw: 7350,
    daily_demand_kw: 5480,
    avg_income: 'medium',
    major_poi: ['KR Puram Railway Station', 'Tin Factory', 'Old Madras Road'],
    existing_stations: [
      { name: 'KR Puram Metro EV Bay', lat: 13.0093, lon: 77.6974, chargers: 4 },
      { name: 'Tin Factory Quick Charge', lat: 13.0182, lon: 77.7031, chargers: 3 },
    ],
  },
  {
    name: 'JP Nagar',
    lat: 12.9077,
    lon: 77.5857,
    ward: 'JP Nagar',
    population: 205000,
    area_sqkm: 15.1,
    ev_users: 2870,
    chargers: 10,
    grid_capacity_kw: 6280,
    daily_demand_kw: 4970,
    avg_income: 'high',
    major_poi: ['JP Nagar 6th Phase', 'Mini Forest', 'Ragigudda'],
    existing_stations: [
      { name: 'JP Nagar Central Hub', lat: 12.9072, lon: 77.5869, chargers: 4 },
      { name: 'Ragigudda Fast Charge', lat: 12.9141, lon: 77.5934, chargers: 3 },
    ],
  },
  {
    name: 'RR Nagar',
    lat: 12.9274,
    lon: 77.5201,
    ward: 'Rajarajeshwari Nagar',
    population: 238000,
    area_sqkm: 19.5,
    ev_users: 3010,
    chargers: 9,
    grid_capacity_kw: 6880,
    daily_demand_kw: 5210,
    avg_income: 'medium',
    major_poi: ['RNSIT', 'Global Village Tech Park', 'Mysore Road'],
    existing_stations: [
      { name: 'Global Village EV Court', lat: 12.9248, lon: 77.5152, chargers: 4 },
      { name: 'RR Nagar Metro Connector', lat: 12.9317, lon: 77.5264, chargers: 3 },
    ],
  },
  {
    name: 'Nagarbhavi',
    lat: 12.9654,
    lon: 77.5068,
    ward: 'Nagarbhavi',
    population: 181000,
    area_sqkm: 14.8,
    ev_users: 2430,
    chargers: 8,
    grid_capacity_kw: 6020,
    daily_demand_kw: 4460,
    avg_income: 'medium',
    major_poi: ['Nagarbhavi Circle', 'Dr Ambedkar Institute', 'Outer Ring Road'],
    existing_stations: [
      { name: 'Nagarbhavi Ring Road EV', lat: 12.9671, lon: 77.5094, chargers: 3 },
      { name: 'BDA Complex Charging Point', lat: 12.9642, lon: 77.5028, chargers: 3 },
    ],
  },
  {
    name: 'Bommanahalli',
    lat: 12.9008,
    lon: 77.6243,
    ward: 'Bommanahalli',
    population: 229000,
    area_sqkm: 16.7,
    ev_users: 3090,
    chargers: 10,
    grid_capacity_kw: 6710,
    daily_demand_kw: 5380,
    avg_income: 'medium',
    major_poi: ['Bommanahalli Junction', 'Hosur Road', 'Silk Board'],
    existing_stations: [
      { name: 'Silk Board EV Link', lat: 12.9172, lon: 77.6224, chargers: 4 },
      { name: 'Bommanahalli Fast Bay', lat: 12.9002, lon: 77.6236, chargers: 3 },
    ],
  },
  {
    name: 'Kengeri',
    lat: 12.9141,
    lon: 77.485,
    ward: 'Kengeri',
    population: 192000,
    area_sqkm: 21.4,
    ev_users: 2460,
    chargers: 8,
    grid_capacity_kw: 6180,
    daily_demand_kw: 4630,
    avg_income: 'medium',
    major_poi: ['Kengeri Satellite Town', 'Mysore Road Metro', 'RVCE Corridor'],
    existing_stations: [
      { name: 'Kengeri Metro Charge Hub', lat: 12.9149, lon: 77.4827, chargers: 3 },
      { name: 'Satellite Town EV Point', lat: 12.9166, lon: 77.4893, chargers: 3 },
    ],
  },
  {
    name: 'Peenya',
    lat: 13.033,
    lon: 77.5147,
    ward: 'Peenya',
    population: 251000,
    area_sqkm: 19.2,
    ev_users: 3320,
    chargers: 11,
    grid_capacity_kw: 7480,
    daily_demand_kw: 5810,
    avg_income: 'medium',
    major_poi: ['Peenya Industrial Area', 'Goraguntepalya', 'Nagasandra Metro'],
    existing_stations: [
      { name: 'Peenya Industrial EV Yard', lat: 13.0288, lon: 77.5182, chargers: 4 },
      { name: 'Nagasandra Metro Quick Charge', lat: 13.0475, lon: 77.5008, chargers: 3 },
    ],
  },
  {
    name: 'Basavanagudi',
    lat: 12.9417,
    lon: 77.5713,
    ward: 'Basavanagudi',
    population: 137000,
    area_sqkm: 7.8,
    ev_users: 2160,
    chargers: 8,
    grid_capacity_kw: 5520,
    daily_demand_kw: 4170,
    avg_income: 'high',
    major_poi: ['Bull Temple Road', 'National College', 'Gandhi Bazaar'],
    existing_stations: [
      { name: 'Gandhi Bazaar EV Spot', lat: 12.9443, lon: 77.5708, chargers: 3 },
      { name: 'Bull Temple Road Charge Point', lat: 12.9424, lon: 77.5674, chargers: 3 },
    ],
  },
  {
    name: 'Vijayanagar',
    lat: 12.9719,
    lon: 77.5314,
    ward: 'Vijayanagar',
    population: 184000,
    area_sqkm: 11.6,
    ev_users: 2580,
    chargers: 9,
    grid_capacity_kw: 6080,
    daily_demand_kw: 4680,
    avg_income: 'medium',
    major_poi: ['Attiguppe Metro', 'Chandra Layout', 'RPC Layout'],
    existing_stations: [
      { name: 'Attiguppe EV Court', lat: 12.9728, lon: 77.5361, chargers: 3 },
      { name: 'RPC Layout Charger Hub', lat: 12.9695, lon: 77.5284, chargers: 3 },
    ],
  },
  {
    name: 'Thanisandra',
    lat: 13.0583,
    lon: 77.6336,
    ward: 'Thanisandra',
    population: 207000,
    area_sqkm: 13.9,
    ev_users: 2940,
    chargers: 9,
    grid_capacity_kw: 6630,
    daily_demand_kw: 5010,
    avg_income: 'high',
    major_poi: ['Thanisandra Main Road', 'Manyata Back Gate', 'Sobha City'],
    existing_stations: [
      { name: 'Thanisandra Main EV Hub', lat: 13.0571, lon: 77.6328, chargers: 4 },
      { name: 'Sobha City Charging Deck', lat: 13.0612, lon: 77.6294, chargers: 3 },
    ],
  },
];

export const zoneCoordinateMap: Record<string, { lat: number; lng: number }> = Object.fromEntries(
  bengaluruZones.map((zone) => [zone.name, { lat: zone.lat, lng: zone.lon }]),
);

export const zoneStressCoordinates: Record<string, [number, number]> = Object.fromEntries(
  bengaluruZones.map((zone) => [zone.name, [zone.lat, zone.lon]]),
);

export const zoneCanvasPositions: Record<string, { x: string; y: string }> = {
  Hebbal: { x: '20%', y: '18%' },
  Yelahanka: { x: '28%', y: '12%' },
  Rajajinagar: { x: '24%', y: '35%' },
  Indiranagar: { x: '42%', y: '39%' },
  Whitefield: { x: '74%', y: '35%' },
  Marathahalli: { x: '63%', y: '40%' },
  Koramangala: { x: '46%', y: '51%' },
  'HSR Layout': { x: '52%', y: '58%' },
  Bellandur: { x: '60%', y: '52%' },
  Jayanagar: { x: '39%', y: '60%' },
  'JP Nagar': { x: '34%', y: '69%' },
  Banashankari: { x: '27%', y: '66%' },
  'RR Nagar': { x: '16%', y: '70%' },
  Nagarbhavi: { x: '17%', y: '49%' },
  Vijayanagar: { x: '21%', y: '45%' },
  Kengeri: { x: '8%', y: '72%' },
  Peenya: { x: '15%', y: '24%' },
  Malleshwaram: { x: '28%', y: '28%' },
  Thanisandra: { x: '42%', y: '18%' },
  'KR Puram': { x: '77%', y: '29%' },
  Bommanahalli: { x: '44%', y: '63%' },
  Basavanagudi: { x: '33%', y: '56%' },
  Sarjapur: { x: '67%', y: '67%' },
  'Electronic City': { x: '58%', y: '78%' },
};

export const bbmpWardBoundaries: { type: 'FeatureCollection'; features: WardFeature[] } = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { name: 'Mahadevapura' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.709, 12.949], [77.779, 12.949], [77.789, 12.988], [77.759, 13.004], [77.713, 12.991], [77.709, 12.949]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Koramangala' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.602, 12.91], [77.646, 12.91], [77.651, 12.94], [77.628, 12.954], [77.602, 12.944], [77.602, 12.91]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Electronic City' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.649, 12.821], [77.697, 12.821], [77.713, 12.853], [77.689, 12.879], [77.652, 12.864], [77.649, 12.821]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Hebbal' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.57, 13.014], [77.624, 13.014], [77.633, 13.041], [77.603, 13.056], [77.575, 13.046], [77.57, 13.014]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Sarjapur' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.66, 12.884], [77.723, 12.884], [77.734, 12.913], [77.705, 12.932], [77.666, 12.924], [77.66, 12.884]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Indiranagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.621, 12.963], [77.654, 12.963], [77.66, 12.986], [77.638, 12.998], [77.619, 12.987], [77.621, 12.963]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Yelahanka' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.555, 13.078], [77.625, 13.078], [77.637, 13.109], [77.607, 13.128], [77.56, 13.118], [77.555, 13.078]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'HSR Layout' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.628, 12.894], [77.662, 12.894], [77.671, 12.916], [77.65, 12.928], [77.627, 12.917], [77.628, 12.894]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Marathahalli' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.681, 12.945], [77.712, 12.945], [77.721, 12.968], [77.699, 12.979], [77.679, 12.967], [77.681, 12.945]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Jayanagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.578, 12.909], [77.607, 12.909], [77.613, 12.93], [77.594, 12.941], [77.577, 12.932], [77.578, 12.909]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Rajajinagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.541, 12.979], [77.57, 12.979], [77.577, 12.999], [77.558, 13.009], [77.539, 12.999], [77.541, 12.979]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Banashankari' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.533, 12.914], [77.562, 12.914], [77.57, 12.936], [77.55, 12.949], [77.531, 12.937], [77.533, 12.914]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Bellandur' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.657, 12.912], [77.689, 12.912], [77.697, 12.933], [77.678, 12.945], [77.655, 12.937], [77.657, 12.912]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Malleshwaram' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.554, 12.993], [77.58, 12.993], [77.587, 13.012], [77.571, 13.022], [77.552, 13.013], [77.554, 12.993]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'KR Puram' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.679, 12.991], [77.714, 12.991], [77.723, 13.013], [77.703, 13.026], [77.678, 13.016], [77.679, 12.991]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'JP Nagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.57, 12.894], [77.6, 12.894], [77.608, 12.915], [77.589, 12.927], [77.568, 12.917], [77.57, 12.894]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Rajarajeshwari Nagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.501, 12.913], [77.535, 12.913], [77.543, 12.935], [77.523, 12.948], [77.499, 12.938], [77.501, 12.913]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Nagarbhavi' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.492, 12.951], [77.521, 12.951], [77.529, 12.973], [77.51, 12.986], [77.49, 12.975], [77.492, 12.951]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Bommanahalli' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.607, 12.886], [77.637, 12.886], [77.646, 12.908], [77.626, 12.921], [77.605, 12.911], [77.607, 12.886]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Kengeri' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.469, 12.9], [77.497, 12.9], [77.506, 12.923], [77.486, 12.937], [77.466, 12.927], [77.469, 12.9]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Peenya' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.495, 13.014], [77.53, 13.014], [77.538, 13.038], [77.516, 13.051], [77.493, 13.041], [77.495, 13.014]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Basavanagudi' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.559, 12.931], [77.583, 12.931], [77.589, 12.95], [77.573, 12.96], [77.557, 12.951], [77.559, 12.931]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Vijayanagar' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.517, 12.959], [77.545, 12.959], [77.553, 12.98], [77.534, 12.991], [77.515, 12.982], [77.517, 12.959]]],
      },
    },
    {
      type: 'Feature',
      properties: { name: 'Thanisandra' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[77.617, 13.044], [77.647, 13.044], [77.656, 13.067], [77.637, 13.079], [77.615, 13.07], [77.617, 13.044]]],
      },
    },
  ],
};
