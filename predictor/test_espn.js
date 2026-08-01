import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
    console.log(JSON.stringify(res.data).substring(0, 500));
  } catch (e) {
    console.error(e.message);
  }
}
test();
