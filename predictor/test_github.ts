import axios from 'axios';
async function fetchRepo() {
  const readme = await axios.get('https://raw.githubusercontent.com/rezarahiminia/worldcup2026/main/README.md');
  console.log("README:", readme.data);
}
fetchRepo();
