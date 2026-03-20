const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://localhost:5000/api/questions/create', {
      subject: 'Math',
      text: 'Test MAQ',
      type: 'MAQ',
      options: ['A', 'B', 'C'],
      answer: ['A', 'C'],
      difficulty: 0,
      level: 1
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("ERROR:", err.response ? err.response.data : err.message);
  }
}
test();
