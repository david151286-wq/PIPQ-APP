/* ==================================================================
   CONFIGURAÇÃO DO FIREBASE
   ------------------------------------------------------------------
   Cole aqui as chaves que o Firebase te dá quando você cria o
   projeto (Configurações do projeto → Geral → "Seus apps" → ícone
   </> → Configuração do SDK).

   Enquanto os campos abaixo continuarem com "SUA_..." (valores de
   exemplo), o site funciona normalmente, mas:
   - o calendário e as sociedades mostram só o conteúdo de exemplo
   - a edição (login de admin) fica desativada

   Depois de colar as chaves reais e publicar o site de novo, tudo
   passa a ler e gravar direto no seu banco de dados na nuvem.
   ================================================================== */

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Detecta automaticamente se as chaves ainda são as de exemplo
const FIREBASE_CONFIGURADO = !Object.values(firebaseConfig).some(v => String(v).startsWith('SUA_') || String(v).startsWith('SEU_'));

export { firebaseConfig, FIREBASE_CONFIGURADO };
