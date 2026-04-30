const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Patient = require('./models/Patient');

mongoose.connect('mongodb://localhost:27017/blockchain-ehr').then(async () => {
  const patient = await Patient.findOne();
  if (!patient) {
    console.log('No patient found');
    process.exit();
  }
  
  if (!patient.grantedDoctors || patient.grantedDoctors.length === 0) {
    console.log('No doctors granted for this patient:', patient._id);
    process.exit();
  }

  const doctorId = patient.grantedDoctors[0];
  const token = jwt.sign({ id: doctorId, role: 'doctor' }, 'mysupersecretkey123', { expiresIn: '1h' });
  
  try {
    const res = await axios.get('http://localhost:5001/api/records/download/' + patient._id, {
      headers: { Authorization: 'Bearer ' + token },
      responseType: 'arraybuffer'
    });
    console.log('API SUCCESS. Status:', res.status, 'Content-Length:', res.data.byteLength);
  } catch(e) {
    if (e.response) {
      console.error('API ERROR:', e.response.status, e.response.data.toString());
    } else {
      console.error('NETWORK ERROR:', e.message);
    }
  }
  process.exit();
});
