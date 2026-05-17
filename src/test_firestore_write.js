import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';

function parseEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let value = parts.slice(1).join('=').trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  });
  return env;
}

async function run() {
  try {
    const env = parseEnv('./.env');
    const firebaseConfig = {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);

    const email = env.VITE_ADMIN_EMAIL || 'admin@example.com';
    let password = env.VITE_ADMIN_PASSWORD;
    if (password.startsWith('\\$')) {
      password = password.substring(1);
    }

    console.log('Logging in...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Logged in successfully! UID:', userCredential.user.uid);

    console.log('Writing test product...');
    const docRef = await addDoc(collection(db, 'products'), {
      name: 'Signature Oud Perfume',
      price: 25000,
      description: 'A luxurious premium scent with rich notes of oud and amber.',
      category: 'Perfume',
      stock: 15,
      mediaUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500',
      mediaType: 'image',
      createdAt: serverTimestamp(),
    });
    console.log('Product added successfully! Document ID:', docRef.id);
  } catch (err) {
    console.error('Write failed:', err);
  }
}

run();
