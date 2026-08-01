import axios from 'axios';
async function run() {
  const req = await axios.get('https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/controllers/getController.js');
  console.log(req.data.substring(0, 1000));
}
run();
