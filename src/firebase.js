// src/firebase.js
// ──────────────────────────────────────────────────────────────────
// CONFIGURE SUAS CREDENCIAIS AQUI
// 1. Acesse https://console.firebase.google.com
// 2. Crie um projeto (ou use um existente)
// 3. Vá em "Project settings" → "Your apps" → clique no ícone Web (</>)
// 4. Copie o objeto firebaseConfig e cole aqui abaixo
// ──────────────────────────────────────────────────────────────────

import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDxaaugNea_RzReOSiY_xQ0ZJVmhM_g6aA",
  authDomain: "despesas-familiar-584c3.firebaseapp.com",
  projectId: "despesas-familiar-584c3",
  storageBucket: "despesas-familiar-584c3.firebasestorage.app",
  messagingSenderId: "656609504923",
  appId: "1:656609504923:web:00d3e8a2ec32026cdaa03e",
  measurementId: "G-96V2XCKL1S"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
