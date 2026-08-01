export const stadiumsData = [
  { id: 'ny', name: 'MetLife Stadium', city: 'New York/NJ', capacity: 82500, lat: 40.8128, lng: -74.0742, timezone: 'America/New_York', image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/MetLife_Stadium_%2852267674880%29.jpg' },
  { id: 'dal', name: 'AT&T Stadium', city: 'Dallas', capacity: 80000, lat: 32.7473, lng: -97.0945, timezone: 'America/Chicago', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/AT%26T_Stadium_-_Dallas_Cowboys.jpg/1200px-AT%26T_Stadium_-_Dallas_Cowboys.jpg' },
  { id: 'kc', name: 'Arrowhead Stadium', city: 'Kansas City', capacity: 76416, lat: 39.0489, lng: -94.4839, timezone: 'America/Chicago', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Arrowhead_Stadium_in_the_Evening_%282021%29.jpg/1200px-Arrowhead_Stadium_in_the_Evening_%282021%29.jpg' },
  { id: 'hou', name: 'NRG Stadium', city: 'Houston', capacity: 72220, lat: 29.6847, lng: -95.4107, timezone: 'America/Chicago', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/NRG_Stadium.jpg/1200px-NRG_Stadium.jpg' },
  { id: 'atl', name: 'Mercedes-Benz Stadium', city: 'Atlanta', capacity: 71000, lat: 33.7554, lng: -84.4006, timezone: 'America/New_York', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mercedes-Benz_Stadium_September_2017.jpg/1200px-Mercedes-Benz_Stadium_September_2017.jpg' },
  { id: 'la', name: 'SoFi Stadium', city: 'Los Angeles', capacity: 70240, lat: 33.9534, lng: -118.3387, timezone: 'America/Los_Angeles', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/SoFi_Stadium_2021.jpg/1200px-SoFi_Stadium_2021.jpg' },
  { id: 'phi', name: 'Lincoln Financial Field', city: 'Philadelphia', capacity: 69796, lat: 39.9012, lng: -75.1675, timezone: 'America/New_York', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Lincoln_Financial_Field.jpg/1200px-Lincoln_Financial_Field.jpg' },
  { id: 'sea', name: 'Lumen Field', city: 'Seattle', capacity: 69000, lat: 47.5952, lng: -122.3316, timezone: 'America/Los_Angeles', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Lumen_Field_August_2022.jpg/1200px-Lumen_Field_August_2022.jpg' },
  { id: 'sf', name: "Levi's Stadium", city: 'San Francisco Bay Area', capacity: 68500, lat: 37.4032, lng: -121.9698, timezone: 'America/Los_Angeles', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Levi%27s_Stadium_2014.jpg/1200px-Levi%27s_Stadium_2014.jpg' },
  { id: 'bos', name: 'Gillette Stadium', city: 'Boston', capacity: 65878, lat: 42.0909, lng: -71.2643, timezone: 'America/New_York', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Gillette_Stadium_-_Foxboro_-_MA.jpg/1200px-Gillette_Stadium_-_Foxboro_-_MA.jpg' },
  { id: 'mia', name: 'Hard Rock Stadium', city: 'Miami', capacity: 64767, lat: 25.9580, lng: -80.2389, timezone: 'America/New_York', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Hard_Rock_Stadium_%282018%29.jpg/1200px-Hard_Rock_Stadium_%282018%29.jpg' },
  { id: 'mex', name: 'Estadio Azteca', city: 'Mexico City', capacity: 83264, lat: 19.3029, lng: -99.1505, timezone: 'America/Mexico_City', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Estadio_Azteca_en_el_D%C3%ADa_de_Muertos.jpg/1200px-Estadio_Azteca_en_el_D%C3%ADa_de_Muertos.jpg' },
  { id: 'mon', name: 'Estadio BBVA', city: 'Monterrey', capacity: 53500, lat: 25.6698, lng: -100.2444, timezone: 'America/Monterrey', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Estadio_BBVA_Bancomer_-_Monterrey.jpg/1200px-Estadio_BBVA_Bancomer_-_Monterrey.jpg' },
  { id: 'gua', name: 'Estadio Akron', city: 'Guadalajara', capacity: 49850, lat: 20.6817, lng: -103.4628, timezone: 'America/Mexico_City', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Estadio_Akron.jpg/1200px-Estadio_Akron.jpg' },
  { id: 'van', name: 'BC Place', city: 'Vancouver', capacity: 54500, lat: 49.2767, lng: -123.1116, timezone: 'America/Vancouver', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/BC_Place_Stadium_2015.jpg/1200px-BC_Place_Stadium_2015.jpg' },
  { id: 'tor', name: 'BMO Field', city: 'Toronto', capacity: 30000, lat: 43.6332, lng: -79.4186, timezone: 'America/Toronto', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/BMO_Field_%282016%29.jpg/1200px-BMO_Field_%282016%29.jpg' },
];

export function getStadiumByCityOrVenue(venueOrCity: string) {
  if (!venueOrCity) return null;
  const sl = venueOrCity.toLowerCase();
  return stadiumsData.find(s => 
    sl.includes(s.name.toLowerCase()) || 
    sl.includes(s.city.toLowerCase()) || 
    (s.id === 'ny' && sl.includes('new york')) ||
    (s.id === 'sf' && sl.includes('francisco'))
  ) || null;
}
