const admin = require('firebase-admin');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://applicationquiz-7183e-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database(); 
const data = require('./Model/questionData.json');

async function uploadData() {
    const ref = db.ref('system-questions');

  for (const doc of data) {
    // Tạo một key tự động cho mỗi document
    const newDocRef = ref.push();
    await newDocRef.set(doc)
      .then(() => {
        console.log(`Document ${newDocRef.key} saved successfully!`);
      })
      .catch((error) => {
        console.error(`Error saving document ${newDocRef.key}:`, error);
      });
  }
}

uploadData();