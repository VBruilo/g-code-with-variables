// callPrint.js
import axios from 'axios';

async function callPrint() {
  try {
    const res = await axios.post('http://localhost:3000/api/prints/parameterized/coin');
    console.log(res.data);
  } catch (err) {
    console.error(err.message);
  }
}

callPrint();
