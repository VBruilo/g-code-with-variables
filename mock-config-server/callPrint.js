// callPrint.js
import axios from 'axios';

async function callPrint() {
  try {
    const res = await axios.post('http://localhost:3011/api/prints/parameterized/coin', {
      machineConfigID: 'example-machine',
      configSetID: 'example-config'
    });
    console.log(res.data);
  } catch (err) {
    console.error(err.message);
  }
}

callPrint();
