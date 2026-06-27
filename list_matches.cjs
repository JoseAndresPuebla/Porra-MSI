const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const projectId = "ai-studio-485578bd-a1ca-4f20-979a-0929db8de540";

admin.initializeApp({
  projectId: projectId
});

const db = getFirestore();

async function run() {
  const s = await db.collection('matches').get();
  s.forEach(d => console.log(d.id, d.data()));
  process.exit(0);
}
run().catch(console.error);
