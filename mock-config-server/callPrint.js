// callPrint.js
import axios from 'axios';

async function callPrint() {
  try {
    const res = await axios.post('http://localhost:3000/api/prints/parameterized/coin', {
      machineConfigID: 'a8d38e02-64c4-4ed4-a6ed-11e775881687',
      configSetID: '2a106465-669c-4faa-b15f-4c8c71c82554'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.message);
  }
}

callPrint();
