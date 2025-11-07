import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // <--- ¡NUEVO! Importa Storage

//
// REEMPLAZA ESTO CON LA CONFIGURACIÓN DE TU PROYECTO
//
const firebaseConfig = {
  apiKey: "AIzaSyBsOXM5QgzxdZ5oGnH73Mz5zJGbCKkBQkQ",
  authDomain: "duolove-a9025.firebaseapp.com",
  projectId: "duolove-a9025",
  storageBucket: "duolove-a9025.firebasestorage.app",
  messagingSenderId: "869262905209",
  appId: "1:869262905209:web:58afdc79566ce52cd8a9a8",
  measurementId: "G-FQF4V0R664"
};

// --- (El resto es el código que ya teníamos) ---

let app;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; 
}

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

const db = getFirestore(app); 
const storage = getStorage(app); // <--- ¡NUEVO! Inicializa Storage

// 5. Exporta auth, db, y storage
export { auth, db, storage }; // <--- ¡NUEVO! Añade 'storage'
