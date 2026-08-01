import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ projectId: 'loyal-spot-3hnbb' });
const app = getApps()[0];
const db = getFirestore(app, 'ai-studio-predictor-87d6ef66-b316-40cb-a45d-66b8548ed60f');
db.collection('config').doc('settings').get().then((doc) => {
  console.log(doc.exists);
}).catch(console.error);
