/* ==================================================================
   APP DATA — ponte entre o site e o Firebase.
   ------------------------------------------------------------------
   Este arquivo cuida de 3 coisas:
   1) Conectar no Firebase (se as chaves já estiverem configuradas)
   2) Login/logout do administrador
   3) Ler e gravar: eventos do calendário, sociedades e horários de culto

   Se o Firebase ainda não estiver configurado (veja firebase-config.js),
   o site continua funcionando normalmente com os dados de EXEMPLO
   definidos mais abaixo — só a edição fica bloqueada.
   ================================================================== */

import { firebaseConfig, FIREBASE_CONFIGURADO } from './firebase-config.js';

let app = null, db = null, auth = null;
let firebaseModules = null;

async function initFirebase() {
  if (!FIREBASE_CONFIGURADO) return false;
  if (app) return true;
  try {
    const [appMod, firestoreMod, authMod] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js')
    ]);
    firebaseModules = { ...appMod, ...firestoreMod, ...authMod };
    app = firebaseModules.initializeApp(firebaseConfig);
    db = firebaseModules.getFirestore(app);
    auth = firebaseModules.getAuth(app);
    return true;
  } catch (err) {
    console.warn('Não foi possível conectar ao Firebase — usando dados de exemplo.', err);
    return false;
  }
}

/* ==================================================================
   DADOS DE EXEMPLO — usados quando o Firebase ainda não está
   configurado, ou enquanto a página carrega os dados reais.
   ================================================================== */
const EXEMPLO_EVENTOS = [
  { id: 'ex1', data: new Date().toISOString().slice(0, 10), titulo: 'Culto da manhã', hora: '10:30', descricao: 'Pregação e Santa Ceia' },
];

const EXEMPLO_HORARIOS = [
  { id: 'h1', dia: 'Domingo', titulo: 'Escola Bíblica Dominical', descricao: 'Estudo da Palavra para todas as idades', hora: '09h00', ordem: 1 },
  { id: 'h2', dia: 'Domingo', titulo: 'Culto da manhã', descricao: 'Pregação e Santa Ceia (1º domingo do mês)', hora: '10h30', ordem: 2 },
  { id: 'h3', dia: 'Domingo', titulo: 'Culto da noite', descricao: 'Louvor e pregação', hora: '18h30', ordem: 3 },
  { id: 'h4', dia: 'Quarta', titulo: 'Reunião de oração', descricao: 'Encontro de oração e estudo', hora: '19h30', ordem: 4 },
];

const SOCIEDADES_INFO = {
  ucp: { nome: 'UCP', extenso: 'União de Crianças Presbiterianas', publico: 'Crianças', descricao: 'Ensina as crianças da igreja sobre a fé cristã de um jeito leve e divertido, com música, brincadeiras e a Palavra de Deus.', encontro: 'Domingos, durante a Escola Bíblica Dominical', lideranca: 'A definir' },
  upa: { nome: 'UPA', extenso: 'União Presbiteriana de Adolescentes', publico: 'Adolescentes', descricao: 'Acompanha os adolescentes da igreja num momento da vida cheio de perguntas, ajudando-os a crescer na fé e na amizade umas com os outros.', encontro: 'A definir', lideranca: 'A definir' },
  ump: { nome: 'UMP', extenso: 'União de Mocidade Presbiteriana', publico: 'Jovens', descricao: 'Reúne os jovens da igreja para comunhão, estudo bíblico e serviço, vivendo a fé junto nessa fase da vida.', encontro: 'A definir', lideranca: 'A definir' },
  uph: { nome: 'UPH', extenso: 'União Presbiteriana de Homens', publico: 'Homens', descricao: 'Une os homens da igreja em torno da Palavra, da oração e do companheirismo, fortalecendo sua caminhada como líderes de fé em casa e na igreja.', encontro: 'A definir', lideranca: 'A definir' },
  saf: { nome: 'SAF', extenso: 'Sociedade Auxiliadora Feminina', publico: 'Mulheres', descricao: 'Reúne as mulheres da igreja para comunhão, estudo da Palavra e ações sociais, servindo à igreja e à comunidade.', encontro: 'A definir', lideranca: 'A definir' },
};

const EXEMPLO_AGENDA_SOCIEDADE = {
  ucp: [], upa: [], ump: [], uph: [], saf: [],
};

/* ==================================================================
   LOGIN DE ADMINISTRADOR
   ================================================================== */
async function login(email, senha) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado. Configure as chaves em firebase-config.js para ativar o login.');
  const { signInWithEmailAndPassword } = firebaseModules;
  const cred = await signInWithEmailAndPassword(auth, email, senha);
  return cred.user;
}

async function logout() {
  if (!auth) return;
  const { signOut } = firebaseModules;
  await signOut(auth);
}

function onAuthChange(callback) {
  initFirebase().then(ok => {
    if (!ok) { callback(null); return; }
    const { onAuthStateChanged } = firebaseModules;
    onAuthStateChanged(auth, user => callback(user));
  });
}

/* ==================================================================
   EVENTOS DO CALENDÁRIO
   Documento em Firestore: coleção "eventos"
   Campos: data ("AAAA-MM-DD"), titulo, hora ("HH:MM"), descricao
   ================================================================== */
async function getEventos() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_EVENTOS;
  try {
    const { collection, getDocs, query, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'eventos'), orderBy('data')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Erro ao buscar eventos, usando exemplo.', err);
    return EXEMPLO_EVENTOS;
  }
}

async function salvarEvento(evento) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  if (evento.id) {
    const ref = doc(db, 'eventos', evento.id);
    const { id, ...resto } = evento;
    await setDoc(ref, resto);
    return evento.id;
  } else {
    const ref = await addDoc(collection(db, 'eventos'), evento);
    return ref.id;
  }
}

async function excluirEvento(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'eventos', id));
}

/* ==================================================================
   HORÁRIOS FIXOS DE CULTO
   Documento em Firestore: coleção "horarios"
   Campos: dia, titulo, descricao, hora, ordem
   ================================================================== */
async function getHorarios() {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_HORARIOS;
  try {
    const { collection, getDocs, query, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'horarios'), orderBy('ordem')));
    const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return lista.length ? lista : EXEMPLO_HORARIOS;
  } catch (err) {
    console.warn('Erro ao buscar horários, usando exemplo.', err);
    return EXEMPLO_HORARIOS;
  }
}

async function salvarHorario(horario) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  if (horario.id) {
    const ref = doc(db, 'horarios', horario.id);
    const { id, ...resto } = horario;
    await setDoc(ref, resto);
    return horario.id;
  } else {
    const ref = await addDoc(collection(db, 'horarios'), horario);
    return ref.id;
  }
}

async function excluirHorario(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'horarios', id));
}

/* ==================================================================
   SOCIEDADES
   Documento em Firestore: coleção "sociedades", 1 doc por sigla
   (ucp, upa, ump, uph, saf), com os campos de SOCIEDADES_INFO.
   Agenda de cada sociedade: coleção "sociedades_agenda"
   Campos: sociedade (sigla), data, titulo, descricao
   ================================================================== */
async function getSociedadeInfo(sigla) {
  const ok = await initFirebase();
  const base = SOCIEDADES_INFO[sigla];
  if (!ok) return base;
  try {
    const { doc, getDoc } = firebaseModules;
    const snap = await getDoc(doc(db, 'sociedades', sigla));
    return snap.exists() ? { ...base, ...snap.data() } : base;
  } catch (err) {
    console.warn('Erro ao buscar sociedade, usando exemplo.', err);
    return base;
  }
}

async function salvarSociedadeInfo(sigla, dados) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { doc, setDoc } = firebaseModules;
  await setDoc(doc(db, 'sociedades', sigla), dados, { merge: true });
}

async function getAgendaSociedade(sigla) {
  const ok = await initFirebase();
  if (!ok) return EXEMPLO_AGENDA_SOCIEDADE[sigla] || [];
  try {
    const { collection, getDocs, query, where, orderBy } = firebaseModules;
    const snap = await getDocs(query(collection(db, 'sociedades_agenda'), where('sociedade', '==', sigla), orderBy('data')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Erro ao buscar agenda da sociedade, usando exemplo.', err);
    return EXEMPLO_AGENDA_SOCIEDADE[sigla] || [];
  }
}

async function salvarAtividadeSociedade(sigla, atividade) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { collection, doc, setDoc, addDoc } = firebaseModules;
  const dados = { ...atividade, sociedade: sigla };
  if (atividade.id) {
    const ref = doc(db, 'sociedades_agenda', atividade.id);
    const { id, ...resto } = dados;
    await setDoc(ref, resto);
    return atividade.id;
  } else {
    const ref = await addDoc(collection(db, 'sociedades_agenda'), dados);
    return ref.id;
  }
}

async function excluirAtividadeSociedade(id) {
  const ok = await initFirebase();
  if (!ok) throw new Error('Firebase não configurado.');
  const { doc, deleteDoc } = firebaseModules;
  await deleteDoc(doc(db, 'sociedades_agenda', id));
}

export {
  FIREBASE_CONFIGURADO,
  SOCIEDADES_INFO,
  login,
  logout,
  onAuthChange,
  getEventos,
  salvarEvento,
  excluirEvento,
  getHorarios,
  salvarHorario,
  excluirHorario,
  getSociedadeInfo,
  salvarSociedadeInfo,
  getAgendaSociedade,
  salvarAtividadeSociedade,
  excluirAtividadeSociedade,
};
