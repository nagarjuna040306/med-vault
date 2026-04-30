const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Patient = require('./models/Patient');
const { fetchFromIPFS } = require('./utils/ipfs');
const { decryptFile } = require('./utils/encryption');

mongoose.connect('mongodb://localhost:27017/blockchain-ehr').then(async () => {
  const patients = await Patient.find({});
  for (const p of patients) {
    if (!p.ipfsCID) continue;
    console.log(`\nPatient: ${p._id} | File: ${p.fileName} | CID: ${p.ipfsCID}`);
    
    // Check if file exists on disk
    try {
      const buffer = await fetchFromIPFS(p.ipfsCID);
      console.log(`- IPFS Fetch: Success (${buffer.length} bytes)`);
      if (buffer.toString() === 'MISSING_MOCK_CONTENT') {
         console.log('- IPFS Status: File MISSING on disk (Legacy Mock)');
      } else {
         try {
           const dec = decryptFile(buffer, p.iv);
           console.log(`- Decryption: Success (${dec.length} bytes)`);
         } catch(e) {
           console.log(`- Decryption FAILED: ${e.message}`);
         }
      }
    } catch(e) {
      console.log(`- IPFS Error: ${e.message}`);
    }

    // Try API Request
    if (p.grantedDoctors && p.grantedDoctors.length > 0) {
      const token = jwt.sign({ id: p.grantedDoctors[0], role: 'doctor' }, 'mysupersecretkey123', { expiresIn: '1h' });
      try {
        const res = await axios.get('http://localhost:5001/api/records/download/' + p._id, {
          headers: { Authorization: 'Bearer ' + token },
          responseType: 'arraybuffer'
        });
        console.log(`- API Request: SUCCESS (Status ${res.status})`);
      } catch(e) {
        if (e.response) {
          console.error(`- API Request: FAILED (${e.response.status}) ${e.response.data.toString()}`);
        } else {
          console.error(`- API Request: NETWORK ERROR ${e.message}`);
        }
      }
    }
  }
  process.exit();
});
