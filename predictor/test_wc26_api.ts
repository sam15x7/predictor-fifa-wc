import axios from 'axios';
async function run() {
  try {
     const req = await axios.get('https://worldcup26.ir/get/teams');
     console.log("Success GET /get/teams:", JSON.stringify(req.data).substring(0, 1000));
  } catch(e: any) {
     console.log("Error GET /get/teams:", e.response?.status, e.response?.data, e.message);
  }
}
run();
