import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  collection, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, 
  CheckSquare, 
  BookOpen, 
  Plus, 
  Trash2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Clock, 
  Search, 
  ExternalLink, 
  Edit2, 
  Sparkles, 
  RotateCcw, 
  Archive, 
  ShoppingCart, 
  List, 
  CalendarDays, 
  UtensilsCrossed, 
  Loader2,
  Cloud,
  ChevronDown,
  ChevronUp,
  Flame
} from 'lucide-react';

// --- Firebase初期化（クラウド共有設定） ---
const firebaseConfig = {
  apiKey: "AIzaSyCS20uR8_rT9XHFnwiWfZqzTNORVaOSIdk",
  authDomain: "futari-note-0808.firebaseapp.com",
  projectId: "futari-note-0808",
  storageBucket: "futari-note-0808.firebasestorage.app",
  messagingSenderId: "711781279684",
  appId: "1:711781279684:web:ed2731196958b001772691",
  measurementId: "G-R4LXN0BQ4S"
};

const appId = 'futari-note-app';
let app = null;
let auth = null;
let db = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

// --- 食材・消耗品のベクターイラスト（多種多様な生活用品を自動判別） ---
function ItemIllustration({ name = '', category = '', className = "w-6 h-6" }) {
  const t = name.toLowerCase();

  if (t.includes('米') || t.includes('ごはん') || t.includes('ライス')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3h12l2 6v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9l2-6z" fill="#FEF3C7" stroke="#D97706" />
        <ellipse cx="12" cy="14" rx="3" ry="4" fill="#FFFFFF" stroke="#D97706" />
      </svg>
    );
  }
  if (t.includes('パスタ') || t.includes('スパゲ') || t.includes('うどん') || t.includes('そば') || t.includes('ラーメン') || t.includes('麺')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11c0 6 4 10 9 10s9-4 9-10H3z" fill="#FFEDD5" stroke="#EA580C" />
        <path d="M8 5v6m4-4v6m4-3v7" stroke="#EA580C" />
      </svg>
    );
  }
  if (t.includes('牛乳') || t.includes('ミルク') || t.includes('豆乳') || t.includes('ヨーグルト')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8l2 3v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l2-3z" fill="#E0F2FE" stroke="#0284C7" />
        <rect x="9" y="11" width="6" height="5" rx="1" fill="#38BDF8" stroke="#0284C7" />
      </svg>
    );
  }
  if (t.includes('卵') || t.includes('たまご') || t.includes('エッグ')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21c-3.5 0-6-3.5-6-8 0-4.5 3-10 6-10s6 5.5 6 10c0 4.5-2.5 8-6 8z" fill="#FEF3C7" stroke="#D97706" />
        <path d="M16 21c-2.5 0-4.5-2.5-4.5-6 0-3 2-7.5 4.5-7.5s4.5 4.5 4.5 7.5c0 3.5-2 6-4.5 6z" fill="#FFFBEB" stroke="#B45309" />
      </svg>
    );
  }
  if (t.includes('パン') || t.includes('トースト') || t.includes('ベーグル')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 9c0-3 2.5-5 5.5-5 1.5 0 3 .8 3.5.8s2-.8 3.5-.8C20.5 4 23 6 23 9c0 2-.8 3.5-1.5 4.2V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5.8C5.2 12.5 5 11 5 9z" fill="#FDE68A" stroke="#B45309" />
      </svg>
    );
  }
  if (t.includes('肉') || t.includes('牛') || t.includes('豚') || t.includes('鶏') || t.includes('ステーキ') || t.includes('ハム') || t.includes('ソーセージ')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 4c-4-1.5-9 1-11 3-3 3-2 8 0 11 2.5 3 8 4 12 1.5 4-2.5 4.5-7 3-11-.8-2.2-2-3.8-4-4.5z" fill="#FECDD3" stroke="#E11D48" />
        <circle cx="15.5" cy="9.5" r="2" fill="#FFFFFF" stroke="#BE123C" />
      </svg>
    );
  }
  if (t.includes('魚') || t.includes('鮭') || t.includes('サケ') || t.includes('マグロ') || t.includes('ツナ') || t.includes('エビ')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12c5-5 14-5 18 0-4 5-13 5-18 0z" fill="#BAE6FD" stroke="#0284C7" />
        <circle cx="6.5" cy="11.5" r="1" fill="#0369A1" />
      </svg>
    );
  }
  if (t.includes('野菜') || t.includes('トマト') || t.includes('玉ねぎ') || t.includes('たまねぎ') || t.includes('人参') || t.includes('キャベツ') || t.includes('大根') || t.includes('りんご')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="14" r="7" fill="#FECDD3" stroke="#E11D48" />
        <path d="M12 7V3m-3 3c1-2 2-2 3-2s2 0 3 2" stroke="#16A34A" strokeWidth="2" />
      </svg>
    );
  }
  if (t.includes('缶') || t.includes('ツナ缶') || t.includes('トマト缶')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="7" rx="7" ry="3" fill="#E2E8F0" stroke="#475569" />
        <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" fill="#F1F5F9" stroke="#475569" />
        <rect x="5" y="10" width="14" height="5" fill="#CBD5E1" stroke="#475569" />
      </svg>
    );
  }
  if (t.includes('コーヒー') || t.includes('珈琲') || t.includes('茶') || t.includes('カフェ')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="12" rx="6" ry="8" transform="rotate(30 12 12)" fill="#D7CCC8" stroke="#5D4037" />
        <path d="M10 7c2 2 3 5 2 9" stroke="#5D4037" strokeWidth="1.5" />
      </svg>
    );
  }
  if (t.includes('コンタクト') || t.includes('保存液') || t.includes('洗浄液') || t.includes('目薬')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2h2v4h-2V2zm-3 4h8l1 3v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V9l1-3z" fill="#E0F2FE" stroke="#0284C7" />
        <circle cx="12" cy="14" r="2.5" fill="#38BDF8" stroke="#0284C7" />
      </svg>
    );
  }
  if (t.includes('歯ブラシ') || t.includes('歯磨き') || t.includes('ハミガキ')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 2l4 4-2 2-4-4 2-2z" fill="#A7F3D0" stroke="#059669" />
        <path d="M14 6l-9 9a2 2 0 0 0 0 3l1 1a2 2 0 0 0 3 0l9-9-4-4z" fill="#E2E8F0" stroke="#475569" />
      </svg>
    );
  }
  if (t.includes('薬') || t.includes('サプリ') || t.includes('ビタミン') || t.includes('絆創膏')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="8" width="14" height="8" rx="4" transform="rotate(-45 12 12)" fill="#FEE2E2" stroke="#DC2626" />
        <path d="M9.5 9.5l5 5" stroke="#DC2626" strokeWidth="2" />
      </svg>
    );
  }
  if (t.includes('オムツ') || t.includes('おむつ') || t.includes('おしりふき')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16v6c0 5-3.5 9-8 9s-8-4-8-9V6z" fill="#FEF3C7" stroke="#D97706" />
      </svg>
    );
  }
  if (t.includes('ペーパー') || t.includes('ティッシュ') || t.includes('紙')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="11" cy="7" rx="6" ry="3" fill="#F1F5F9" stroke="#475569" />
        <path d="M5 7v10c0 1.7 2.7 3 6 3s6-1.3 6-3V7" fill="#F8FAFC" stroke="#475569" />
      </svg>
    );
  }
  if (t.includes('洗剤') || t.includes('シャンプー') || t.includes('ソープ') || t.includes('石鹸')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 2h4v3h-4V2zm-2 5h8l1 3v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V10l1-3z" fill="#CCFBF1" stroke="#0F766E" />
      </svg>
    );
  }
  if (t.includes('油') || t.includes('醤油') || t.includes('しょうゆ') || t.includes('塩') || t.includes('砂糖') || t.includes('マヨ') || t.includes('ソース')) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="2" width="4" height="3" rx="0.5" fill="#EF4444" stroke="#B91C1C" />
        <path d="M10 5h4l2 4v11a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V9l2-4z" fill="#FEF3C7" stroke="#D97706" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" fill="#F8FAFC" stroke="#64748B" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="#64748B" />
    </svg>
  );
}

// 記入者別の配色
const AUTHOR_STYLES = {
  '夫': {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    border: 'border-l-4 border-l-blue-500',
    cellBar: 'bg-blue-100 text-blue-800 border-l-2 border-blue-500',
    dot: 'bg-blue-500',
  },
  '妻': {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    border: 'border-l-4 border-l-rose-500',
    cellBar: 'bg-rose-100 text-rose-800 border-l-2 border-rose-500',
    dot: 'bg-rose-500',
  },
  '共通': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-l-4 border-l-emerald-500',
    cellBar: 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500',
    dot: 'bg-emerald-500',
  },
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('schedule');
  const [calendarViewMode, setCalendarViewMode] = useState('month');
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2200);
  };

  // 1. Firebase 認証 (RULE 3)
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth initialization failed:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setCurrentUser);
    return () => unsubscribe();
  }, []);

  // --- スケジュールステート ---
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const twoDaysLaterStr = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [schedules, setSchedules] = useState([
    { 
      id: 'sch-1', 
      startDate: todayStr, 
      endDate: todayStr, 
      startTime: '19:00', 
      endTime: '22:00', 
      title: '飲み会（夕飯不要）', 
      author: '夫', 
      memo: '22時頃帰宅' 
    },
    { 
      id: 'sch-2', 
      startDate: todayStr, 
      endDate: todayStr, 
      startTime: '18:30', 
      endTime: '19:00', 
      title: '保育園お迎え', 
      author: '妻', 
      memo: '荷物多め' 
    },
    { 
      id: 'sch-3', 
      startDate: tomorrowStr, 
      endDate: twoDaysLaterStr, 
      startTime: '09:00', 
      endTime: '18:00', 
      title: '温泉旅行', 
      author: '共通', 
      memo: '車で移動・1泊2日' 
    },
  ]);

  const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const [newScheduleStartDate, setNewScheduleStartDate] = useState(todayStr);
  const [newScheduleEndDate, setNewScheduleEndDate] = useState(todayStr);
  const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
  const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
  const [newScheduleAuthor, setNewScheduleAuthor] = useState('夫');
  const [newScheduleMemo, setNewScheduleMemo] = useState('');

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));

  // --- 買い出しToDoステート ---
  const [todos, setTodos] = useState([
    { id: 'td-1', name: '牛乳', category: '冷蔵庫', author: '妻', done: false },
    { id: 'td-2', name: 'トイレットペーパー', category: '日用品', author: '夫', done: false },
    { id: 'td-3', name: 'たまご', category: '冷蔵庫', author: '共通', done: true },
    { id: 'td-4', name: 'お米', category: '食材', author: '妻', done: false },
  ]);

  const [itemCounts, setItemCounts] = useState({
    '牛乳': { count: 4, category: '冷蔵庫', author: '共通' },
    'たまご': { count: 3, category: '冷蔵庫', author: '共通' },
    'お米': { count: 2, category: '食材', author: '妻' },
    'トイレットペーパー': { count: 2, category: '日用品', author: '夫' },
  });

  const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
  const [newTodoName, setNewTodoName] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState('冷蔵庫');
  const [newTodoAuthor, setNewTodoAuthor] = useState('妻');

  // --- レシピ帳ステート ---
  const [recipes, setRecipes] = useState([
    {
      id: 'rc-1',
      title: '手羽大根',
      author: '夫',
      sourceUrl: 'https://youtu.be/ZK9lvoxTulI',
      ingredients: [
        { name: '手羽元', amount: '8本' },
        { name: '大根', amount: '400g' },
      ],
      seasonings: [
        { name: 'だし汁', amount: '400ml' },
        { name: 'しょうゆ', amount: '大さじ3' },
        { name: 'みりん', amount: '大さじ3' },
        { name: '砂糖', amount: '大さじ2' },
      ],
      steps: [
        '大根は皮をむき乱切りにし、下茹でする。',
        '手羽元はフォークで穴を開け、フライパンで焼き色をつける。',
        '鍋に手羽元、大根、だし汁、調味料を入れ落とし蓋をして弱火で20分煮込む。'
      ]
    },
    {
      id: 'rc-2',
      title: '豚バラ白菜の重ね鍋',
      author: '妻',
      sourceUrl: '',
      ingredients: [
        { name: '豚バラ薄切り肉', amount: '300g' },
        { name: '白菜', amount: '1/4株' },
      ],
      seasonings: [
        { name: '水', amount: '600ml' },
        { name: '和風だしの素', amount: '小さじ2' },
        { name: '酒', amount: '大さじ2' },
        { name: '塩', amount: '小さじ1/2' },
      ],
      steps: [
        '白菜と豚肉を交互に重ね、5cm幅に切る。',
        '鍋の縁に沿って敷き詰める。',
        '調味料と水を注ぎ、中火で10分煮る。'
      ]
    }
  ]);

  const [deletedRecipes, setDeletedRecipes] = useState([]);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState('rc-1');
  const [recipeDetailTab, setRecipeDetailTab] = useState('ingredients');
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);

  // 2. クラウドデータのリアルタイム同期リスナー (RULE 1, 2, 3)
  useEffect(() => {
    if (!currentUser || !db) return;

    const schedCol = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
    const unsubSched = onSnapshot(schedCol, (snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setSchedules(list);
      }
    }, (err) => console.error("Sched sync error:", err));

    const todosCol = collection(db, 'artifacts', appId, 'public', 'data', 'todos');
    const unsubTodos = onSnapshot(todosCol, (snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTodos(list);
      }
    }, (err) => console.error("Todos sync error:", err));

    const recipesCol = collection(db, 'artifacts', appId, 'public', 'data', 'recipes');
    const unsubRecipes = onSnapshot(recipesCol, (snapshot) => {
      if (!snapshot.empty) {
        const list = [];
        snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRecipes(list);
      }
    }, (err) => console.error("Recipes sync error:", err));

    const trashCol = collection(db, 'artifacts', appId, 'public', 'data', 'trash');
    const unsubTrash = onSnapshot(trashCol, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setDeletedRecipes(list);
    }, (err) => console.error("Trash sync error:", err));

    const settingsCol = collection(db, 'artifacts', appId, 'public', 'data', 'settings');
    const unsubSettings = onSnapshot(settingsCol, (snapshot) => {
      snapshot.forEach((d) => {
        if (d.id === 'frequentItems' && d.data()?.itemCounts) {
          setItemCounts(d.data().itemCounts);
        }
      });
    }, (err) => console.error("Settings sync error:", err));

    return () => {
      unsubSched();
      unsubTodos();
      unsubRecipes();
      unsubTrash();
      unsubSettings();
    };
  }, [currentUser]);

  // スケジュールハンドラ
  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!newScheduleTitle.trim()) return;

    const validEndDate = newScheduleEndDate < newScheduleStartDate ? newScheduleStartDate : newScheduleEndDate;
    const item = {
      id: 'sch-' + Date.now(),
      startDate: newScheduleStartDate,
      endDate: validEndDate,
      startTime: newScheduleStartTime || '',
      endTime: newScheduleEndTime || '',
      title: newScheduleTitle.trim(),
      author: newScheduleAuthor,
      memo: newScheduleMemo.trim()
    };

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', item.id), item);
      } catch (err) {
        console.error(err);
      }
    } else {
      setSchedules(prev => [...prev, item]);
    }

    setNewScheduleTitle('');
    setNewScheduleMemo('');
    setNewScheduleStartTime('');
    setNewScheduleEndTime('');
    setIsAddScheduleOpen(false);
    showToast('予定を登録しました');
  };

  const handleDeleteSchedule = async (id) => {
    if (db && currentUser) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'schedules', id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setSchedules(prev => prev.filter(s => s.id !== id));
    }
    showToast('予定を削除しました');
  };

  const selectedDaySchedules = useMemo(() => {
    return schedules
      .filter((s) => {
        const start = s.startDate;
        const end = s.endDate || s.startDate;
        return selectedDate >= start && selectedDate <= end;
      })
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }, [schedules, selectedDate]);

  const monthAllSchedules = useMemo(() => {
    const monthStartStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const monthEndStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    return schedules
      .filter((s) => {
        const start = s.startDate;
        const end = s.endDate || s.startDate;
        return start <= monthEndStr && end >= monthStartStr;
      })
      .sort((a, b) => {
        if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
        return (a.startTime || '').localeCompare(b.startTime || '');
      });
  }, [schedules, currentYear, currentMonth, daysInMonth]);

  // 買い出しToDoハンドラ
  const recordItemFrequency = async (name, category, author) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = itemCounts[trimmed] || { count: 0, category, author };
    const updated = {
      ...itemCounts,
      [trimmed]: {
        count: current.count + 1,
        category,
        author: author || current.author
      }
    };
    setItemCounts(updated);

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'frequentItems'), {
          itemCounts: updated
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const frequentItems = useMemo(() => {
    return Object.entries(itemCounts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [itemCounts]);

  const handleToggleTodo = async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const newDone = !target.done;

    if (db && currentUser) {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', id), { done: newDone });
      } catch (err) {
        console.error(err);
      }
    } else {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: newDone } : t)));
    }
  };

  const handleDeleteTodo = async (id, e) => {
    e?.stopPropagation();
    if (db && currentUser) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', id));
      } catch (err) {
        console.error(err);
      }
    } else {
      setTodos((prev) => prev.filter((t) => t.id !== id));
    }
    showToast('項目を削除しました');
  };

  const handleQuickAdd = async (presetItem) => {
    const existing = todos.find((t) => t.name === presetItem.name && !t.done);
    if (existing) {
      showToast(`「${presetItem.name}」は既にリストにあります`);
      return;
    }
    const item = {
      id: 'td-' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: presetItem.name,
      category: presetItem.category,
      author: '共通',
      done: false,
    };
    recordItemFrequency(presetItem.name, presetItem.category, '共通');

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', item.id), item);
      } catch (err) {
        console.error(err);
      }
    } else {
      setTodos((prev) => [item, ...prev]);
    }
    showToast(`「${presetItem.name}」を追加しました`);
  };

  const handleCreateTodo = async (e) => {
    e.preventDefault();
    if (!newTodoName.trim()) return;

    const trimmedName = newTodoName.trim();
    const item = {
      id: 'td-' + Date.now(),
      name: trimmedName,
      category: newTodoCategory,
      author: newTodoAuthor,
      done: false
    };

    recordItemFrequency(trimmedName, newTodoCategory, newTodoAuthor);

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', item.id), item);
      } catch (err) {
        console.error(err);
      }
    } else {
      setTodos((prev) => [item, ...prev]);
    }

    setNewTodoName('');
    setIsAddTodoOpen(false);
    showToast(`「${item.name}」を追加しました`);
  };

  const remainingTodos = useMemo(() => todos.filter((t) => !t.done), [todos]);
  const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);

  // レシピ帳ハンドラ
  const filteredRecipes = useMemo(() => {
    const q = recipeSearchQuery.trim().toLowerCase();
    if (!q) return recipes;
    return recipes.filter((r) => {
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchIng = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      const matchSeasoning = r.seasonings.some((s) => s.name.toLowerCase().includes(q));
      return matchTitle || matchIng || matchSeasoning;
    });
  }, [recipes, recipeSearchQuery]);

  const handleAddIngredientToTodo = async (ingName) => {
    const exists = todos.find((t) => t.name === ingName && !t.done);
    if (exists) {
      showToast(`「${ingName}」は既に買い出しリストにあります`);
      return;
    }
    const item = {
      id: 'td-' + Date.now() + Math.random().toString(36).substring(2, 6),
      name: ingName,
      category: '食材',
      author: '共通',
      done: false
    };
    recordItemFrequency(ingName, '食材', '共通');

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'todos', item.id), item);
      } catch (err) {
        console.error(err);
      }
    } else {
      setTodos((prev) => [item, ...prev]);
    }
    showToast(`「${ingName}」を買い出しに追加しました`);
  };

  const handleExecuteDeleteRecipe = async (recipeId) => {
    const target = recipes.find((r) => r.id === recipeId);
    if (!target) return;
    const trashItem = {
      ...target,
      deletedAt: Date.now(),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    if (db && currentUser) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', recipeId));
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trash', recipeId), trashItem);
      } catch (err) {
        console.error(err);
      }
    } else {
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setDeletedRecipes((prev) => [trashItem, ...prev]);
    }
    setEditingRecipe(null);
    showToast(`「${target.title}」をゴミ箱へ移動しました（30日間復元可能）`);
  };

  const handleRestoreRecipe = async (recipeId) => {
    const target = deletedRecipes.find((r) => r.id === recipeId);
    if (!target) return;
    const { deletedAt, expiresAt, ...restored } = target;

    if (db && currentUser) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'trash', recipeId));
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', recipeId), restored);
      } catch (err) {
        console.error(err);
      }
    } else {
      setDeletedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setRecipes((prev) => [restored, ...prev]);
    }
    showToast(`「${restored.title}」をレシピ帳に復元しました`);
  };

  const handleAnalyzeRecipeWithAi = async () => {
    if (!aiInputText.trim()) return;
    setIsAiLoading(true);
    let videoTitleHint = '';
    const rawInput = aiInputText.trim();

    if (rawInput.includes('youtube.com') || rawInput.includes('youtu.be')) {
      try {
        const oembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(rawInput)}`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data?.title) videoTitleHint = data.title;
        }
      } catch (e) {
        // ignore
      }
    }

    const apiKey = "";
    const systemPrompt = `家庭向け料理レシピの専門家として、提供された動画URL、タイトル、説明文から料理名、食材一覧、調味料一覧、調理工程を抽出し、厳密に指定のJSON形式で出力してください。
JSONフォーマット:
{
  "title": "料理名",
  "ingredients": [{"name": "食材名", "amount": "分量"}],
  "seasonings": [{"name": "調味料名", "amount": "分量"}],
  "steps": ["手順1", "手順2"]
}`;

    const userPrompt = `以下の情報を解析してレシピ情報をJSONで抽出してください:
【入力】: ${rawInput}
${videoTitleHint ? `【動画タイトル参考】: ${videoTitleHint}` : ''}`;

    const delays = [1000, 2000, 4000, 8000, 16000];
    let success = false;
    let resultJson = null;

    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userPrompt }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const parsed = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
          if (parsed && parsed.title) {
            resultJson = parsed;
            success = true;
            break;
          }
        }
      } catch (err) {
        // retry
      }
      if (i < delays.length) await new Promise((r) => setTimeout(r, delays[i]));
    }

    setIsAiLoading(false);

    if (success && resultJson) {
      setPreviewRecipe({
        id: 'rc-' + Date.now(),
        title: resultJson.title || '新しいレシピ',
        author: '共通',
        sourceUrl: rawInput.startsWith('http') ? rawInput : '',
        ingredients: resultJson.ingredients || [],
        seasonings: resultJson.seasonings || [],
        steps: resultJson.steps || []
      });
      setIsAiModalOpen(false);
      setAiInputText('');
    } else {
      showToast('レシピ解析に失敗しました。概要欄テキストを直接貼り付けてお試しください。');
    }
  };

  const handleSavePreviewRecipe = async () => {
    if (!previewRecipe) return;

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', previewRecipe.id), previewRecipe);
      } catch (err) {
        console.error(err);
      }
    } else {
      setRecipes((prev) => [previewRecipe, ...prev]);
    }

    setExpandedRecipeId(previewRecipe.id);
    setPreviewRecipe(null);
    showToast(`「${previewRecipe.title}」をレシピ帳に追加しました`);
  };

  const handleSaveEditedRecipe = async (e) => {
    e.preventDefault();
    if (!editingRecipe) return;

    if (db && currentUser) {
      try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'recipes', editingRecipe.id), editingRecipe);
      } catch (err) {
        console.error(err);
      }
    } else {
      setRecipes((prev) => prev.map((r) => (r.id === editingRecipe.id ? editingRecipe : r)));
    }

    setEditingRecipe(null);
    showToast('レシピを更新しました');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-800 antialiased font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col relative pb-20 select-none">

        {/* --- ヘッダー --- */}
        <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight">ふたり手帳</h1>
            {currentUser && db ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                クラウド同期中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                <Cloud className="w-2.5 h-2.5" />
                ローカル動作中
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>夫
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>妻
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>共通
            </span>
          </div>
        </header>

        {/* --- トースト通知 --- */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-md border border-slate-700">
            {toastMessage}
          </div>
        )}

        {/* --- メインコンテンツ --- */}
        <main className="flex-1 p-3 overflow-y-auto">

          {/* ========================================================
              タブ1: スケジュール
             ======================================================== */}
          {currentTab === 'schedule' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <button onClick={handlePrevMonth} className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-slate-800">{currentYear}年 {currentMonth + 1}月</span>
                  <button onClick={handleNextMonth} className="p-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    onClick={() => setCalendarViewMode('month')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${
                      calendarViewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    月表示
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('list')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${
                      calendarViewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    月間一覧
                  </button>
                </div>
              </div>

              {calendarViewMode === 'month' && (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
                    <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 py-1 border-b border-slate-100">
                      <span className="text-rose-500">日</span>
                      <span>月</span>
                      <span>火</span>
                      <span>水</span>
                      <span>木</span>
                      <span>金</span>
                      <span className="text-blue-500">土</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mt-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="min-h-[56px] bg-slate-50/40 rounded-lg" />
                      ))}

                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === todayStr;
                        const dayEvents = schedules.filter((s) => {
                          const start = s.startDate;
                          const end = s.endDate || s.startDate;
                          return dateStr >= start && dateStr <= end;
                        });

                        return (
                          <div
                            key={dateStr}
                            onClick={() => setSelectedDate(dateStr)}
                            className={`min-h-[56px] p-0.5 rounded-lg flex flex-col justify-start items-stretch border transition cursor-pointer overflow-hidden ${
                              isSelected
                                ? 'border-slate-900 bg-slate-50/80 ring-1 ring-slate-900'
                                : isToday
                                  ? 'border-amber-300 bg-amber-50/30'
                                  : 'border-slate-100 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex justify-between items-center px-1">
                              <span className={`text-[11px] font-mono leading-none ${
                                isToday ? 'font-extrabold text-amber-600' : isSelected ? 'font-bold text-slate-900' : 'text-slate-600'
                              }`}>
                                {dayNum}
                              </span>
                              {dayEvents.length > 2 && (
                                <span className="text-[8px] font-bold text-slate-400">+{dayEvents.length - 2}</span>
                              )}
                            </div>

                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {dayEvents.slice(0, 2).map((ev) => {
                                const style = AUTHOR_STYLES[ev.author] || AUTHOR_STYLES['共通'];
                                return (
                                  <div
                                    key={ev.id}
                                    title={`${ev.author}: ${ev.title}`}
                                    className={`text-[9px] px-1 py-0.5 rounded leading-tight truncate text-left font-medium ${style.cellBar}`}
                                  >
                                    {ev.title}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{selectedDate} の予定（{selectedDaySchedules.length}件）</span>
                      </div>
                      <button
                        onClick={() => {
                          setNewScheduleStartDate(selectedDate);
                          setNewScheduleEndDate(selectedDate);
                          setIsAddScheduleOpen(true);
                        }}
                        className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        予定追加
                      </button>
                    </div>

                    {selectedDaySchedules.length === 0 ? (
                      <div className="py-5 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                        {selectedDate} に予定はありません
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDaySchedules.map((item) => {
                          const style = AUTHOR_STYLES[item.author] || AUTHOR_STYLES['共通'];
                          const isMultiDay = item.endDate && item.endDate !== item.startDate;
                          const timeDisplay = item.startTime 
                            ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}`
                            : '終日';

                          return (
                            <div
                              key={item.id}
                              className={`p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${style.border}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    {timeDisplay}
                                  </span>
                                  {isMultiDay && (
                                    <span className="text-[9px] text-slate-400 mt-1 font-mono">
                                      {item.startDate.slice(5)}〜{item.endDate.slice(5)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}`}>
                                      {item.author}
                                    </span>
                                  </div>
                                  {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                                </div>
                              </div>

                              <button onClick={() => handleDeleteSchedule(item.id)} className="p-1.5 text-slate-300 hover:text-slate-600">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}

              {calendarViewMode === 'list' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-600">
                      {currentYear}年{currentMonth + 1}月の全スケジュール（{monthAllSchedules.length}件）
                    </div>
                    <button
                      onClick={() => {
                        setNewScheduleStartDate(selectedDate);
                        setNewScheduleEndDate(selectedDate);
                        setIsAddScheduleOpen(true);
                      }}
                      className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      予定追加
                    </button>
                  </div>

                  {monthAllSchedules.length === 0 ? (
                    <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      今月の予定はまだ登録されていません
                    </div>
                  ) : (
                    monthAllSchedules.map((item) => {
                      const style = AUTHOR_STYLES[item.author] || AUTHOR_STYLES['共通'];
                      const isMultiDay = item.endDate && item.endDate !== item.startDate;
                      const timeDisplay = item.startTime 
                            ? `${item.startTime}${item.endTime ? ` - ${item.endTime}` : ''}`
                            : '終日';

                      return (
                        <div
                          key={item.id}
                          className={`p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${style.border}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-[55px] flex flex-col items-center border-r border-slate-100 pr-2.5">
                              <span className="text-xs font-bold font-mono text-slate-800">
                                {item.startDate.slice(5).replace('-', '/')}
                              </span>
                              <span className="text-[9px] font-mono text-slate-400 mt-0.5">{timeDisplay}</span>
                              {isMultiDay && (
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded mt-0.5">
                                  〜{item.endDate.slice(5).replace('-', '/')}
                                </span>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}`}>
                                  {item.author}
                                </span>
                              </div>
                              {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                            </div>
                          </div>

                          <button onClick={() => handleDeleteSchedule(item.id)} className="p-1.5 text-slate-300 hover:text-slate-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              タブ2: 買い出しToDo
             ======================================================== */}
          {currentTab === 'todo' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">よく買うもの</span>
                  <span className="text-[10px] text-slate-400">タップで追加</span>
                </div>

                {frequentItems.length === 0 ? (
                  <div className="py-2 text-center text-xs text-slate-400">
                    手動追加された品物が自動でここに並びます
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {frequentItems.map((item) => {
                      const isAdded = todos.some((t) => t.name === item.name && !t.done);
                      return (
                        <button
                          key={item.name}
                          onClick={() => handleQuickAdd(item)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition active:scale-95 ${
                            isAdded
                              ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-default'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-xs'
                          }`}
                        >
                          <ItemIllustration name={item.name} category={item.category} className="w-4 h-4" />
                          <span>+ {item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm text-slate-800">買うもの一覧</h2>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">
                    {remainingTodos.length}件
                  </span>
                </div>
                <button
                  onClick={() => setIsAddTodoOpen(true)}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  手動追加
                </button>
              </div>

              <div className="space-y-2">
                {remainingTodos.length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    買うものはありません
                  </div>
                ) : (
                  remainingTodos.map((item) => {
                    const style = AUTHOR_STYLES[item.author] || AUTHOR_STYLES['共通'];
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleTodo(item.id)}
                        className={`p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer active:bg-slate-50 transition ${style.border}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-transparent hover:border-slate-500">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
                            <ItemIllustration name={item.name} category={item.category} className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{item.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                                {item.category}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}`}>
                                {item.author}記入
                              </span>
                            </div>
                          </div>
                        </div>

                        <button onClick={(e) => handleDeleteTodo(item.id, e)} className="p-1.5 text-slate-300 hover:text-slate-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}

                {completedTodos.length > 0 && (
                  <div className="pt-3">
                    <div className="text-[11px] font-bold text-slate-400 mb-1.5">
                      購入済み ({completedTodos.length})
                    </div>
                    <div className="space-y-1.5 opacity-60">
                      {completedTodos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleTodo(item.id)}
                          className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs line-through text-slate-400 flex items-center justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-slate-500" />
                            <ItemIllustration name={item.name} category={item.category} className="w-4 h-4 opacity-75" />
                            <span>{item.name}</span>
                            <span className="text-[10px]">({item.author})</span>
                          </div>
                          <button onClick={(e) => handleDeleteTodo(item.id, e)} className="p-1 text-slate-300 hover:text-slate-600">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              タブ3: レシピ帳
             ======================================================== */}
          {currentTab === 'recipe' && (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="料理名や余り食材（豚肉、大根など）..."
                      value={recipeSearchQuery}
                      onChange={(e) => setRecipeSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-slate-800"
                    />
                    {recipeSearchQuery && (
                      <button onClick={() => setRecipeSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {deletedRecipes.length > 0 && (
                    <button
                      onClick={() => setIsTrashOpen(true)}
                      title="削除したレシピ（30日間保存）"
                      className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 relative transition shrink-0"
                    >
                      <Archive className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">
                        {deletedRecipes.length}
                      </span>
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between shadow-xs transition"
                >
                  <div className="flex items-center gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">動画URL・概要欄からレシピ自動抽出</div>
                      <div className="text-[10px] text-slate-300">YouTubeやTikTokから材料・手順をAIが整理</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              </div>

              <div className="space-y-2">
                {filteredRecipes.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    {recipeSearchQuery ? `「${recipeSearchQuery}」に一致するレシピはありません` : 'レシピはまだ登録されていません'}
                  </div>
                ) : (
                  filteredRecipes.map((recipe) => {
                    const isExpanded = expandedRecipeId === recipe.id;
                    const style = AUTHOR_STYLES[recipe.author] || AUTHOR_STYLES['共通'];

                    return (
                      <div
                        key={recipe.id}
                        className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition ${style.border}`}
                      >
                        <div
                          onClick={() => setExpandedRecipeId(isExpanded ? null : recipe.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
                        >
                          <div className="flex items-center gap-2.5">
                            <UtensilsCrossed className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900">{recipe.title}</h3>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}`}>
                                  {recipe.author}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>食材 {recipe.ingredients.length}種</span>
                                <span>調味料 {recipe.seasonings.length}種</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {recipe.sourceUrl && (
                              <a
                                href={recipe.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="元動画・サイトを開く"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => setEditingRecipe({ ...recipe })}
                              title="レシピを編集"
                              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3">
                            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                              <button
                                onClick={() => setRecipeDetailTab('ingredients')}
                                className={`flex-1 py-1.5 font-bold rounded-md transition ${
                                  recipeDetailTab === 'ingredients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                }`}
                              >
                                食材・調味料
                              </button>
                              <button
                                onClick={() => setRecipeDetailTab('steps')}
                                className={`flex-1 py-1.5 font-bold rounded-md transition ${
                                  recipeDetailTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                                }`}
                              >
                                作り方・工程 ({recipe.steps.length})
                              </button>
                            </div>

                            {recipeDetailTab === 'ingredients' && (
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center justify-between">
                                    <span>食材</span>
                                    <span className="text-[10px] text-slate-400">「買う」でToDoに追加</span>
                                  </div>
                                  <div className="space-y-1">
                                    {recipe.ingredients.map((ing, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                                        <div className="flex items-center gap-2">
                                          <ItemIllustration name={ing.name} category="食材" className="w-4 h-4" />
                                          <span className="font-semibold text-slate-800">{ing.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-slate-600">{ing.amount}</span>
                                          <button
                                            onClick={() => handleAddIngredientToTodo(ing.name)}
                                            className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 active:scale-95"
                                          >
                                            <ShoppingCart className="w-3 h-3 text-slate-500" />
                                            買う
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[11px] font-bold text-slate-500 mb-1.5">調味料</div>
                                  <div className="space-y-1">
                                    {recipe.seasonings.map((s, idx) => (
                                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60 text-xs">
                                        <div className="flex items-center gap-2">
                                          <ItemIllustration name={s.name} category="食材" className="w-4 h-4" />
                                          <span className="font-semibold text-slate-800">{s.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-slate-700">{s.amount}</span>
                                          <button
                                            onClick={() => handleAddIngredientToTodo(s.name)}
                                            className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 active:scale-95"
                                          >
                                            <ShoppingCart className="w-3 h-3 text-slate-500" />
                                            買う
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {recipeDetailTab === 'steps' && (
                              <div className="space-y-2">
                                {recipe.steps.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 text-xs">
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                                      {idx + 1}
                                    </span>
                                    <p className="text-slate-800 leading-relaxed">{step}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </main>

        {/* --- モーダル: AIレシピ自動抽出 --- */}
        {isAiModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800">動画・テキストからレシピ自動抽出</h3>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mt-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  YouTube/TikTokの動画URL、または概要欄・コメント欄の材料テキストを貼り付けてください。
                </p>

                <textarea
                  rows={6}
                  placeholder="例: https://youtu.be/ZK9lvoxTulI
または概要欄テキスト（手羽元 8本、大根 400g、醤油 大さじ3...）"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-800"
                />

                <button
                  onClick={handleAnalyzeRecipeWithAi}
                  disabled={isAiLoading || !aiInputText.trim()}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AIがレシピを解析中...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>レシピを自動解析する</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- モーダル: AI抽出結果のプレビュー修正 --- */}
        {previewRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">抽出結果の確認・微調整</h3>
                  <p className="text-[10px] text-slate-400">分量や品名に誤りがないか確認し、手直しできます</p>
                </div>
                <button onClick={() => setPreviewRecipe(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 mt-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">料理名</label>
                  <input
                    type="text"
                    value={previewRecipe.title}
                    onChange={(e) => setPreviewRecipe({ ...previewRecipe, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者（色分け）</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['夫', '妻', '共通'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPreviewRecipe({ ...previewRecipe, author: p })}
                        className={`py-1.5 text-xs font-bold rounded-lg border ${
                          previewRecipe.author === p
                            ? p === '夫' ? 'bg-blue-500 text-white' : p === '妻' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">食材</label>
                  <div className="space-y-1.5">
                    {previewRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-1.5">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => {
                            const copy = [...previewRecipe.ingredients];
                            copy[idx].name = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, ingredients: copy });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={ing.amount}
                          onChange={(e) => {
                            const copy = [...previewRecipe.ingredients];
                            copy[idx].amount = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, ingredients: copy });
                          }}
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => {
                            const copy = previewRecipe.ingredients.filter((_, i) => i !== idx);
                            setPreviewRecipe({ ...previewRecipe, ingredients: copy });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">調味料</label>
                  <div className="space-y-1.5">
                    {previewRecipe.seasonings.map((s, idx) => (
                      <div key={idx} className="flex gap-1.5">
                        <input
                          type="text"
                          value={s.name}
                          onChange={(e) => {
                            const copy = [...previewRecipe.seasonings];
                            copy[idx].name = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, seasonings: copy });
                          }}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <input
                          type="text"
                          value={s.amount}
                          onChange={(e) => {
                            const copy = [...previewRecipe.seasonings];
                            copy[idx].amount = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, seasonings: copy });
                          }}
                          className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs"
                        />
                        <button
                          onClick={() => {
                            const copy = previewRecipe.seasonings.filter((_, i) => i !== idx);
                            setPreviewRecipe({ ...previewRecipe, seasonings: copy });
                          }}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePreviewRecipe}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs mt-2 transition"
                >
                  この内容でレシピ帳に登録
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- モーダル: レシピ編集（削除もここからのみ可能） --- */}
        {editingRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800">レシピを編集</h3>
                <button onClick={() => setEditingRecipe(null)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedRecipe} className="space-y-3 mt-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">料理名</label>
                  <input
                    type="text"
                    required
                    value={editingRecipe.title}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">参照元URL</label>
                  <input
                    type="url"
                    placeholder="https://youtu.be/..."
                    value={editingRecipe.sourceUrl || ''}
                    onChange={(e) => setEditingRecipe({ ...editingRecipe, sourceUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者（色分け）</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['夫', '妻', '共通'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setEditingRecipe({ ...editingRecipe, author: p })}
                        className={`py-1.5 text-xs font-bold rounded-lg border ${
                          editingRecipe.author === p
                            ? p === '夫' ? 'bg-blue-500 text-white' : p === '妻' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                            : 'bg-slate-50 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs transition"
                  >
                    変更を保存する
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleExecuteDeleteRecipe(editingRecipe.id)}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    このレシピを削除する（30日間復元可能）
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- モーダル: 30日間ゴミ箱＆復元 --- */}
        {isTrashOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Archive className="w-4 h-4 text-slate-600" />
                  <h3 className="font-bold text-sm text-slate-800">削除したレシピ（30日間保存）</h3>
                </div>
                <button onClick={() => setIsTrashOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 mt-3">
                {deletedRecipes.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">ゴミ箱は空です</p>
                ) : (
                  deletedRecipes.map((recipe) => {
                    const daysLeft = Math.max(1, Math.ceil((recipe.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));
                    return (
                      <div key={recipe.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-800">{recipe.title}</h4>
                          <span className="text-[10px] text-slate-400">残り {daysLeft} 日で完全削除</span>
                        </div>
                        <button
                          onClick={() => handleRestoreRecipe(recipe.id)}
                          className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-2xs"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          復元
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- モーダル: 予定追加 --- */}
        {isAddScheduleOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800">予定を追加</h3>
                <button onClick={() => setIsAddScheduleOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSchedule} className="space-y-3 mt-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者（色分け）</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['夫', '妻', '共通'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewScheduleAuthor(p)}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${
                          newScheduleAuthor === p
                            ? p === '夫' ? 'bg-blue-500 text-white' : p === '妻' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">予定名</label>
                  <input
                    type="text"
                    required
                    placeholder="例: 旅行、帰省、出張、お迎え"
                    value={newScheduleTitle}
                    onChange={(e) => setNewScheduleTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">日程（連日対応）</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">開始日</span>
                      <input
                        type="date"
                        required
                        value={newScheduleStartDate}
                        onChange={(e) => {
                          setNewScheduleStartDate(e.target.value);
                          if (e.target.value > newScheduleEndDate) setNewScheduleEndDate(e.target.value);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">終了日</span>
                      <input
                        type="date"
                        required
                        min={newScheduleStartDate}
                        value={newScheduleEndDate}
                        onChange={(e) => setNewScheduleEndDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">時間（空欄の場合は終日）</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={newScheduleStartTime}
                      onChange={(e) => setNewScheduleStartTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    />
                    <input
                      type="time"
                      value={newScheduleEndTime}
                      onChange={(e) => setNewScheduleEndTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">メモ</label>
                  <input
                    type="text"
                    placeholder="例: 夕飯いらない、宿チェックイン15時"
                    value={newScheduleMemo}
                    onChange={(e) => setNewScheduleMemo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs mt-1 transition"
                >
                  予定を登録
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- モーダル: 買い出しToDo手動追加 --- */}
        {isAddTodoOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800">買うものを追加</h3>
                <button onClick={() => setIsAddTodoOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTodo} className="space-y-3 mt-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者（色分け）</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['夫', '妻', '共通'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewTodoAuthor(p)}
                        className={`py-2 text-xs font-bold rounded-lg border transition ${
                          newTodoAuthor === p
                            ? p === '夫' ? 'bg-blue-500 text-white' : p === '妻' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">品名</label>
                  <input
                    type="text"
                    required
                    placeholder="例: オリーブオイル、お米、コンタクト保存液"
                    value={newTodoName}
                    onChange={(e) => setNewTodoName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">カテゴリ</label>
                  <select
                    value={newTodoCategory}
                    onChange={(e) => setNewTodoCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="冷蔵庫">冷蔵庫</option>
                    <option value="食材">食材・調味料</option>
                    <option value="日用品">日用品・消耗品</option>
                    <option value="その他">その他</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs mt-1 transition"
                >
                  リストに追加
                </button>
              </form>
            </div>
          </div>
        )}

        {/* --- 下部固定タブナビゲーション（3画面） --- */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around py-2 px-3 z-40">
          <button
            onClick={() => setCurrentTab('schedule')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              currentTab === 'schedule' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">スケジュール</span>
          </button>

          <button
            onClick={() => setCurrentTab('todo')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              currentTab === 'todo' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5" />
              {remainingTodos.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-slate-800 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {remainingTodos.length}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">買い出しToDo</span>
          </button>

          <button
            onClick={() => setCurrentTab('recipe')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
              currentTab === 'recipe' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">レシピ帳</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
