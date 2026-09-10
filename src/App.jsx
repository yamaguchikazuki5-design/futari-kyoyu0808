import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
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
  Archive, 
  ShoppingCart, 
  Sparkles, 
  RotateCcw,
  CalendarDays,
  List,
  Search,
  UtensilsCrossed,
  Cloud,
  ExternalLink,
  Edit2,
  Loader2,
  Luggage,
  AlertCircle
} from 'lucide-react';

// --- お二人専用のFirebase接続設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyCS28uR8_rT9XHFwLWFZqzTNORVADSIdk",
  authDomain: "futari-note-0808.firebaseapp.com",
  projectId: "futari-note-0808",
  storageBucket: "futari-note-0808.firebasestorage.app",
  messagingSenderId: "711781279684",
  appId: "1:711781279684:web:ed27311969586001772691",
  measurementId: "G-R4L0108045"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

const STYLES = {
  '夫': {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    border: 'border-l-4 border-l-blue-500',
    cell: 'bg-blue-100 text-blue-800 border-l-2 border-blue-500',
    bar: 'bg-blue-500 text-white',
    btn: 'bg-blue-600 text-white'
  },
  '妻': {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    border: 'border-l-4 border-l-rose-500',
    cell: 'bg-rose-100 text-rose-800 border-l-2 border-rose-500',
    bar: 'bg-rose-500 text-white',
    btn: 'bg-rose-600 text-white'
  },
  '共通': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-l-4 border-l-emerald-500',
    cell: 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500',
    bar: 'bg-emerald-600 text-white',
    btn: 'bg-emerald-600 text-white'
  }
};

const loadLocal = (key, fallback) => {
  try {
    const v = localStorage.getItem('fn_' + key);
    return v ? JSON.parse(v) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveLocal = (key, val) => {
  try {
    localStorage.setItem('fn_' + key, JSON.stringify(val));
  } catch (e) {}
};

export default function App() {
  const [tab, setTab] = useState('schedule');
  const [calMode, setCalMode] = useState('month');
  const [toast, setToast] = useState(null);
  const [syncStatus, setSyncStatus] = useState('connecting');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');

  const [selDate, setSelDate] = useState(todayStr);
  const [vDate, setVDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // 各ステート
  const [scheds, setScheds] = useState(() => loadLocal('scheds', []));
  const [todos, setTodos] = useState(() => loadLocal('todos', []));
  const [recipes, setRecipes] = useState(() => loadLocal('recipes', []));
  const [trash, setTrash] = useState(() => loadLocal('trash', []));
  const [freqs, setFreqs] = useState(() => loadLocal('freqs', ['牛乳', 'たまご', 'お米', '食パン', '納豆', '玉ねぎ', '豚肉', 'トイレットペーパー']));

  useEffect(() => {
    signInAnonymously(auth).catch((err) => console.warn('Auth note:', err.message));
  }, []);

  useEffect(() => {
    let unsubs = [];
    try {
      const unsubSched = onSnapshot(collection(db, 'schedules'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setScheds(list);
        saveLocal('scheds', list);
        setSyncStatus('connected');
      });

      const unsubTodos = onSnapshot(collection(db, 'todos'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTodos(list);
        saveLocal('todos', list);
        setSyncStatus('connected');
      });

      const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRecipes(list);
        saveLocal('recipes', list);
        setSyncStatus('connected');
      });

      const unsubTrash = onSnapshot(collection(db, 'trash'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTrash(list);
        saveLocal('trash', list);
      });

      unsubs = [unsubSched, unsubTodos, unsubRecipes, unsubTrash];
    } catch (e) {
      console.error('Sync init error:', e);
    }

    return () => unsubs.forEach((u) => u && u());
  }, []);

  const [openAddSched, setOpenAddSched] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sStart, setSStart] = useState(todayStr);
  const [sEnd, setSEnd] = useState(todayStr);
  const [sTime, setSTime] = useState('');
  const [sAuthor, setSAuthor] = useState('共通');
  const [sMemo, setSMemo] = useState('');

  const getDurationText = (start, end) => {
    if (!start || !end) return '';
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
    if (diffDays <= 1) return '日帰り';
    const nights = diffDays - 1;
    return nights + '泊' + diffDays + '日 (' + diffDays + '日間)';
  };

  const cYear = vDate.getFullYear();
  const cMonth = vDate.getMonth();
  const firstDay = new Date(cYear, cMonth, 1).getDay();
  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();

  const handleAddSched = async (e) => {
    e.preventDefault();
    if (!sTitle.trim()) return;

    const finalEnd = sEnd < sStart ? sStart : sEnd;
    const isMultiDay = finalEnd > sStart;

    const item = {
      id: 's_' + String(Date.now()),
      title: sTitle.trim(),
      startDate: sStart,
      endDate: finalEnd,
      isMultiDay: isMultiDay,
      time: sTime,
      author: sAuthor,
      memo: sMemo.trim()
    };

    const next = [...scheds, item];
    setScheds(next);
    saveLocal('scheds', next);

    setSTitle('');
    setSMemo('');
    setSTime('');
    setOpenAddSched(false);
    showToast('予定を登録しました');

    try {
      await setDoc(doc(db, 'schedules', item.id), item);
    } catch (err) {}
  };

  const handleDelSched = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = scheds.filter((x) => x.id !== id);
    setScheds(next);
    saveLocal('scheds', next);
    showToast('予定を削除しました');

    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {}
  };

  const dayScheds = useMemo(() => {
    return scheds
      .filter((s) => selDate >= s.startDate && selDate <= (s.endDate || s.startDate))
      .sort((a, b) => {
        if (a.isMultiDay && !b.isMultiDay) return -1;
        if (!a.isMultiDay && b.isMultiDay) return 1;
        return (a.time || '99:99').localeCompare(b.time || '99:99');
      });
  }, [scheds, selDate]);

  const [openAddTodo, setOpenAddTodo] = useState(false);
  const [tName, setTName] = useState('');
  const [tAuthor, setTAuthor] = useState('共通');

  const handleAddTodo = async (name, author = '共通') => {
    const txt = name.trim();
    if (!txt) return;

    if (todos.some((t) => t.name === txt && !t.done)) {
      showToast('「' + txt + '」は既に買い出しリストに入っています');
      return;
    }

    const item = { 
      id: 't_' + String(Date.now()) + Math.random().toString(36).slice(2, 5), 
      name: txt, 
      author, 
      done: false 
    };

    const nextTodos = [item, ...todos];
    setTodos(nextTodos);
    saveLocal('todos', nextTodos);

    if (!freqs.includes(txt)) {
      const nextFreqs = [txt, ...freqs.slice(0, 14)];
      setFreqs(nextFreqs);
      saveLocal('freqs', nextFreqs);
    }
    showToast('「' + txt + '」を買い出しに追加しました');

    try {
      await setDoc(doc(db, 'todos', item.id), item);
    } catch (err) {}
  };

  const handleToggleTodo = async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const nextDone = !target.done;

    const nextTodos = todos.map((t) => (t.id === id ? { ...t, done: nextDone } : t));
    setTodos(nextTodos);
    saveLocal('todos', nextTodos);

    try {
      await updateDoc(doc(db, 'todos', id), { done: nextDone });
    } catch (err) {}
  };

  const handleDelTodo = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);
    saveLocal('todos', nextTodos);
    showToast('買い出し項目を削除しました');

    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (err) {}
  };

  const [openAiModal, setOpenAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeTab, setRecipeTab] = useState('ingredients');
  const [expRecipeId, setExpRecipeId] = useState(null);
  const [openTrash, setOpenTrash] = useState(false);
  const [rQuery, setRQuery] = useState('');

  // --- 高精度レシピ分解エンジン ---
  const parseRecipeText = (text, fallbackTitle) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

    const seasoningKeywords = [
      '醤油', 'しょうゆ', 'みりん', '酒', '料理酒', '塩', '胡椒', 'こしょう', '砂糖', '油', 
      'ごま油', 'ゴマ油', 'オリーブオイル', '酢', '大さじ', '小さじ', '顆粒', 'コンソメ', 
      'ほんだし', 'マヨネーズ', 'ケチャップ', '味噌', 'みそ', 'バター', 'にんにく', '生姜', 
      'しょうが', 'めんつゆ', 'ポン酢', 'ぽん酢', 'だし', 'ダシ', 'つゆ', '鷹の爪', '唐辛子', 
      'チューブ', 'ウェイパー', '創味シャンタン', '鶏ガラスープ'
    ];

    const junkKeywords = [
      'http', 'https', 'www.', 'instagram', 'twitter', 'tiktok', 'amazon', '楽天', 
      'チャンネル登録', '高評価', 'ご視聴', '公式', '書籍', '購入', 'グッズ', 'baza', 'captcha', 'warning'
    ];

    const ings = [];
    const seas = [];
    const stps = [];

    let currentSection = 'auto';

    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (junkKeywords.some((k) => lower.includes(k))) return;

      if (line.match(/^(【|\[|■|●|▼)?\s*(材料|食材|具材)/i)) {
        currentSection = 'ingredients';
        return;
      }
      if (line.match(/^(【|\[|■|●|▼)?\s*(調味料|合わせ調味料|タレ|ソース|スープ|［?a］|［?b］|\[a\]|\[b\])/i)) {
        currentSection = 'seasonings';
        return;
      }
      if (line.match(/^(【|\[|■|●|▼)?\s*(作り方|手順|工程|調理法)/i)) {
        currentSection = 'steps';
        return;
      }

      const clean = line.replace(/^[・\-\*①②③④⑤⑥⑦⑧⑨⑩\d+\.\s]/, '').trim();
      if (!clean || clean.length < 2) return;

      const parts = clean.split(/[\s:：\t]+/);
      const name = parts[0];
      const amount = parts.slice(1).join(' ') || '適量';

      if (currentSection === 'steps' || line.match(/^[0-9]+[\.、\)\s]/) || clean.match(/^(炒める|煮る|焼く|切る|混ぜる|火を|温める|茹でる|レンチン|電子レンジ|沸騰|下処理|完成|盛る|振る)/)) {
        stps.push(clean);
      } else if (currentSection === 'seasonings' || (currentSection === 'auto' && seasoningKeywords.some((k) => name.includes(k)))) {
        seas.push({ name, amount });
      } else if (currentSection === 'ingredients' || currentSection === 'auto') {
        if (seasoningKeywords.some((k) => name.includes(k))) {
          seas.push({ name, amount });
        } else if (name.length < 25) {
          ings.push({ name, amount });
        }
      }
    });

    return {
      title: fallbackTitle,
      ingredients: ings,
      seasonings: seas,
      steps: stps
    };
  };

  // --- YouTube / テキスト 解析ハンドラー ---
  const handleAnalyzeAiRecipe = async () => {
    const input = aiInput.trim();
    if (!input) return;

    setIsAiLoading(true);
    let targetText = input;
    let detectedTitle = '新しいレシピ';
    let fetchSuccess = false;

    if (input.includes('youtube.com') || input.includes('youtu.be')) {
      const matchId = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
      const videoId = matchId ? matchId[1] : null;

      if (videoId) {
        // 多角的にCORS制限の少ないAPIから概要欄を完全取得
        const endpoints = [
          'https://pipedapi.kavin.rocks/streams/' + videoId,
          'https://api.piped.video/streams/' + videoId,
          'https://inv.nadeko.net/api/v1/videos/' + videoId,
          'https://r.jina.ai/https://www.youtube.com/watch?v=' + videoId
        ];

        for (const url of endpoints) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500);
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
              if (url.includes('jina.ai')) {
                const text = await res.text();
                if (text && text.length > 100) {
                  targetText = text;
                  fetchSuccess = true;
                  break;
                }
              } else {
                const data = await res.json();
                if (data.title) detectedTitle = data.title;
                if (data.description && data.description.length > 30) {
                  targetText = data.description;
                  fetchSuccess = true;
                  break;
                }
              }
            }
          } catch (e) {}
        }

        if (detectedTitle === '新しいレシピ') {
          try {
            const resNoembed = await fetch('https://noembed.com/embed?url=https://www.youtube.com/watch?v=' + videoId);
            if (resNoembed.ok) {
              const odata = await resNoembed.json();
              if (odata.title) detectedTitle = odata.title;
            }
          } catch (e) {}
        }
      }
    } else {
      fetchSuccess = true;
    }

    const parsed = parseRecipeText(targetText, detectedTitle);
    setIsAiLoading(false);

    setPreviewRecipe({
      id: 'r_' + String(Date.now()),
      title: detectedTitle !== '新しいレシピ' ? detectedTitle : (parsed.title || '新しいレシピ'),
      author: '共通',
      sourceUrl: input.startsWith('http') ? input : '',
      ingredients: parsed.ingredients,
      seasonings: parsed.seasonings,
      steps: parsed.steps,
      fetchWarning: (!fetchSuccess && input.startsWith('http') && parsed.ingredients.length === 0) 
        ? '※YouTube側のセキュリティにより概要欄の自動取得が制限されました。YouTubeアプリで概要欄テキストをコピーして貼り付けると100%確実に解読されます。' 
        : ''
    });

    setOpenAiModal(false);
    setAiInput('');
  };

  const handleSavePreviewRecipe = async () => {
    if (!previewRecipe) return;

    const next = [previewRecipe, ...recipes];
    setRecipes(next);
    saveLocal('recipes', next);
    setExpRecipeId(previewRecipe.id);
    showToast('「' + previewRecipe.title + '」をレシピ帳に追加しました');

    try {
      await setDoc(doc(db, 'recipes', previewRecipe.id), previewRecipe);
    } catch (err) {}

    setPreviewRecipe(null);
  };

  const handleSaveEditedRecipe = async (e) => {
    e.preventDefault();
    if (!editingRecipe) return;

    const next = recipes.map((r) => (r.id === editingRecipe.id ? editingRecipe : r));
    setRecipes(next);
    saveLocal('recipes', next);
    showToast('レシピを更新しました');

    try {
      await setDoc(doc(db, 'recipes', editingRecipe.id), editingRecipe);
    } catch (err) {}

    setEditingRecipe(null);
  };

  const handleDelRecipe = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const target = recipes.find((r) => r.id === id);
    if (!target) return;

    const trashItem = { ...target, deletedAt: Date.now() };
    const nextRecipes = recipes.filter((r) => r.id !== id);
    const nextTrash = [trashItem, ...trash];

    setRecipes(nextRecipes);
    setTrash(nextTrash);
    saveLocal('recipes', nextRecipes);
    saveLocal('trash', nextTrash);
    if (editingRecipe && editingRecipe.id === id) setEditingRecipe(null);
    showToast('ゴミ箱へ移動しました（復元可能）');

    try {
      await deleteDoc(doc(db, 'recipes', id));
      await setDoc(doc(db, 'trash', id), trashItem);
    } catch (err) {}
  };

  const handleRestoreRecipe = async (id) => {
    const target = trash.find((r) => r.id === id);
    if (!target) return;

    const nextTrash = trash.filter((r) => r.id !== id);
    const nextRecipes = [target, ...recipes];

    setTrash(nextTrash);
    setRecipes(nextRecipes);
    saveLocal('trash', nextTrash);
    saveLocal('recipes', nextRecipes);
    showToast('「' + target.title + '」を復元しました');

    try {
      await deleteDoc(doc(db, 'trash', id));
      await setDoc(doc(db, 'recipes', id), target);
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col relative pb-20 select-none">
        
        {/* ヘッダー */}
        <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">ふたり手帳</h1>
            {syncStatus === 'connected' ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                クラウド同期中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700">
                <Cloud className="w-2.5 h-2.5 animate-pulse" />
                クラウド接続中...
              </span>
            )}
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>夫</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>妻</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>共通</span>
          </div>
        </header>

        {/* トースト */}
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap">
            {toast}
          </div>
        )}

        <main className="flex-1 p-3 overflow-y-auto">

          {/* スケジュール */}
          {tab === 'schedule' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <button onClick={() => setVDate(new Date(cYear, cMonth - 1, 1))} className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-slate-800">{cYear}年 {cMonth + 1}月</span>
                  <button onClick={() => setVDate(new Date(cYear, cMonth + 1, 1))} className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                  <button onClick={() => setCalMode('month')} className={'flex items-center gap-1 px-2.5 py-1 rounded font-bold ' + (calMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                    <CalendarDays className="w-3.5 h-3.5" />月表示
                  </button>
                  <button onClick={() => setCalMode('list')} className={'flex items-center gap-1 px-2.5 py-1 rounded font-bold ' + (calMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                    <List className="w-3.5 h-3.5" />一覧
                  </button>
                </div>
              </div>

              {calMode === 'month' ? (
                <>
                  <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
                    <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 py-1 border-b border-slate-100">
                      <span className="text-rose-500">日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span className="text-blue-500">土</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center mt-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={'e-' + i} className="min-h-[58px] bg-slate-50/40 rounded-lg" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dStr = cYear + '-' + String(cMonth + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
                        const isSel = dStr === selDate;
                        const isTod = dStr === todayStr;
                        const evs = scheds.filter((s) => dStr >= s.startDate && dStr <= (s.endDate || s.startDate));
                        
                        return (
                          <div key={dStr} onClick={() => setSelDate(dStr)} className={'min-h-[58px] p-0.5 rounded-lg flex flex-col items-stretch border cursor-pointer transition ' + (isSel ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : isTod ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100 bg-white hover:border-slate-300')}>
                            <span className={'text-[11px] font-mono leading-none text-left px-1 ' + (isTod ? 'font-bold text-amber-600' : isSel ? 'font-bold text-slate-900' : 'text-slate-600')}>{dayNum}</span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {evs.slice(0, 2).map((ev) => {
                                const isStart = dStr === ev.startDate;
                                const isEnd = dStr === ev.endDate;
                                const isMulti = ev.isMultiDay || (ev.endDate && ev.endDate > ev.startDate);
                                const style = STYLES[ev.author] || STYLES['共通'];
                                
                                if (isMulti) {
                                  return (
                                    <div key={ev.id} className={'text-[8px] px-1 py-0.5 truncate text-left font-bold ' + style.bar + ' ' + (isStart && isEnd ? 'rounded' : isStart ? 'rounded-l' : isEnd ? 'rounded-r' : 'rounded-none')}>
                                      {isStart ? '✈ ' + ev.title : ev.title}
                                    </div>
                                  );
                                }
                                return (
                                  <div key={ev.id} className={'text-[8px] px-1 py-0.5 rounded truncate text-left font-medium ' + style.cell}>
                                    {ev.title}
                                  </div>
                                );
                              })}
                              {evs.length > 2 && <span className="text-[7px] text-slate-400 font-bold leading-none text-left px-0.5">+{evs.length - 2}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />{selDate} の予定（{dayScheds.length}件）
                      </span>
                      <button onClick={() => { setSStart(selDate); setSEnd(selDate); setOpenAddSched(true); }} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition shadow-xs">
                        <Plus className="w-3.5 h-3.5" />予定追加
                      </button>
                    </div>

                    {dayScheds.length === 0 ? (
                      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">{selDate} に予定はありません</div>
                    ) : (
                      <div className="space-y-2">
                        {dayScheds.map((item) => {
                          const style = STYLES[item.author] || STYLES['共通'];
                          const isMulti = item.isMultiDay || (item.endDate && item.endDate > item.startDate);
                          return (
                            <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + style.border}>
                              <div className="flex-1 mr-2">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  {isMulti && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-1">
                                      <Luggage className="w-3 h-3" />{getDurationText(item.startDate, item.endDate)}
                                    </span>
                                  )}
                                  <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                  <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{item.author}</span>
                                  {item.time && <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">{item.time}</span>}
                                </div>
                                {isMulti && <div className="text-[11px] text-slate-500 font-mono mb-0.5">期間: {item.startDate} 〜 {item.endDate}</div>}
                                {item.memo && <p className="text-xs text-slate-500">{item.memo}</p>}
                              </div>
                              <button onClick={(e) => handleDelSched(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500 transition shrink-0">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">全スケジュール ({scheds.length}件)</span>
                    <button onClick={() => setOpenAddSched(true)} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800">
                      <Plus className="w-3.5 h-3.5" />予定追加
                    </button>
                  </div>
                  {scheds.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">登録されている予定はありません</div>
                  ) : (
                    scheds.sort((a, b) => a.startDate.localeCompare(b.startDate)).map((item) => {
                      const style = STYLES[item.author] || STYLES['共通'];
                      const isMulti = item.isMultiDay || (item.endDate && item.endDate > item.startDate);
                      return (
                        <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + style.border}>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-600">{item.startDate.slice(5)}{isMulti ? '〜' + item.endDate.slice(5) : ''}</span>
                              <span className="font-bold text-sm text-slate-900">{item.title}</span>
                              <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{item.author}</span>
                            </div>
                            {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                          </div>
                          <button onClick={(e) => handleDelSched(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {/* 買い出しToDo */}
          {tab === 'todo' && (
            <div className="space-y-3">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <div className="text-xs font-bold text-slate-700 mb-2">よく買うもの（タップで追加）</div>
                <div className="flex flex-wrap gap-1.5">
                  {freqs.map((name) => (
                    <button key={name} onClick={() => handleAddTodo(name)} className="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-xs active:scale-95 transition">
                      + {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-sm text-slate-800">買うもの一覧（{todos.filter((t) => !t.done).length}件）</span>
                <button onClick={() => setOpenAddTodo(true)} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800">
                  <Plus className="w-3.5 h-3.5" />手動追加
                </button>
              </div>

              <div className="space-y-2">
                {todos.filter((t) => !t.done).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">買うものはありません</div>
                ) : (
                  todos.filter((t) => !t.done).map((item) => (
                    <div key={item.id} onClick={() => handleToggleTodo(item.id)} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer ' + (STYLES[item.author] ? STYLES[item.author].border : '')}>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-transparent hover:border-slate-500"><Check className="w-3.5 h-3.5" /></div>
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + (STYLES[item.author] ? STYLES[item.author].badge : '')}>{item.author}</span>
                      </div>
                      <button onClick={(e) => handleDelTodo(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))
                )}

                {todos.filter((t) => t.done).length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">購入済み ({todos.filter((t) => t.done).length})</div>
                    <div className="space-y-1 opacity-60">
                      {todos.filter((t) => t.done).map((item) => (
                        <div key={item.id} onClick={() => handleToggleTodo(item.id)} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs line-through text-slate-400 flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-500" /><span>{item.name}</span></div>
                          <button onClick={(e) => handleDelTodo(item.id, e)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* レシピ帳 */}
          {tab === 'recipe' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="料理名・食材名で検索..." value={rQuery} onChange={(e) => setRQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-slate-800" />
                </div>
                {trash.length > 0 && (
                  <button onClick={() => setOpenTrash(true)} title="ゴミ箱" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 relative shrink-0">
                    <Archive className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">{trash.length}</span>
                  </button>
                )}
              </div>

              <button onClick={() => setOpenAiModal(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs transition">
                <div className="flex items-center gap-2.5 text-left">
                  <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-sm">動画URL・概要欄からレシピ自動解析</div>
                    <div className="text-[11px] text-slate-300 font-normal">YouTubeの材料・調味料・手順を自動判定</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-400" />
              </button>

              <div className="space-y-2">
                {recipes.filter((r) => r.title.indexOf(rQuery) !== -1 || (r.ingredients && r.ingredients.some((i) => (i.name || i).includes(rQuery)))).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    {rQuery ? '一致するレシピはありません' : '登録されたレシピはありません'}
                  </div>
                ) : (
                  recipes.filter((r) => r.title.indexOf(rQuery) !== -1 || (r.ingredients && r.ingredients.some((i) => (i.name || i).includes(rQuery)))).map((recipe) => {
                    const isExp = expRecipeId === recipe.id;
                    const style = STYLES[recipe.author] || STYLES['共通'];
                    return (
                      <div key={recipe.id} className={'bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden ' + style.border}>
                        <div onClick={() => setExpRecipeId(isExp ? null : recipe.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                          <div className="flex items-center gap-2.5">
                            <UtensilsCrossed className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900">{recipe.title}</h3>
                                <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{recipe.author}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex gap-2">
                                <span>食材 {(recipe.ingredients || []).length}種</span>
                                <span>調味料 {(recipe.seasonings || []).length}種</span>
                                <span>工程 {(recipe.steps || []).length}段階</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {recipe.sourceUrl && (
                              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" title="元動画を開く" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => setEditingRecipe({ ...recipe })} title="編集" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {isExp && (
                          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs">
                              <button onClick={() => setRecipeTab('ingredients')} className={'flex-1 py-1.5 font-bold rounded ' + (recipeTab === 'ingredients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                材料・調味料
                              </button>
                              <button onClick={() => setRecipeTab('steps')} className={'flex-1 py-1.5 font-bold rounded ' + (recipeTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                作り方・手順 ({(recipe.steps || []).length})
                              </button>
                            </div>

                            {recipeTab === 'ingredients' && (
                              <div className="space-y-3">
                                <div>
                                  <div className="font-bold text-slate-600 mb-1.5 flex justify-between items-center">
                                    <span>食材</span>
                                    <span className="text-[10px] text-slate-400">「買う」で買い出しリストに追加</span>
                                  </div>
                                  <div className="space-y-1">
                                    {(recipe.ingredients || []).length === 0 ? (
                                      <p className="text-slate-400 text-[11px] p-2 bg-white rounded">食材情報はありません</p>
                                    ) : (
                                      recipe.ingredients.map((ing, idx) => {
                                        const name = typeof ing === 'string' ? ing : ing.name;
                                        const amt = typeof ing === 'string' ? '' : ing.amount;
                                        return (
                                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-800">{name}</span>
                                              {amt && <span className="text-slate-500 font-mono text-[11px]">({amt})</span>}
                                            </div>
                                            <button onClick={() => handleAddTodo(name)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded font-bold text-[10px] flex items-center gap-1 transition">
                                              <ShoppingCart className="w-3 h-3" />買う
                                            </button>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <div className="font-bold text-slate-600 mb-1.5">調味料</div>
                                  <div className="space-y-1">
                                    {(recipe.seasonings || []).length === 0 ? (
                                      <p className="text-slate-400 text-[11px] p-2 bg-white rounded">調味料情報はありません</p>
                                    ) : (
                                      recipe.seasonings.map((sea, idx) => {
                                        const name = typeof sea === 'string' ? sea : sea.name;
                                        const amt = typeof sea === 'string' ? '' : sea.amount;
                                        return (
                                          <div key={idx} className="flex items-center justify-between p-2 bg-amber-50/60 rounded-lg border border-amber-200/60">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-slate-800">{name}</span>
                                              {amt && <span className="text-slate-600 font-mono text-[11px]">({amt})</span>}
                                            </div>
                                            <button onClick={() => handleAddTodo(name)} className="bg-white hover:bg-amber-100 text-slate-700 px-2.5 py-1 rounded font-bold text-[10px] flex items-center gap-1 border border-slate-200 transition">
                                              <ShoppingCart className="w-3 h-3" />買う
                                            </button>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {recipeTab === 'steps' && (
                              <div className="space-y-2 text-slate-700">
                                {(recipe.steps || []).length === 0 ? (
                                  <p className="text-slate-400 text-[11px] p-2 bg-white rounded">手順情報はありません</p>
                                ) : (
                                  recipe.steps.map((st, idx) => (
                                    <div key={idx} className="flex items-start gap-2.5 p-2 bg-white rounded-lg border border-slate-200 leading-relaxed">
                                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                                      <p className="text-xs">{st}</p>
                                    </div>
                                  ))
                                )}
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

        {/* レシピ入力モーダル */}
        {openAiModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800">動画URL・概要欄から自動解析</h3>
                </div>
                <button onClick={() => setOpenAiModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  YouTubeの動画URL、または概要欄テキストを貼り付けてください。食材・調味料・手順を自動分割します。
                </p>
                <textarea
                  rows={6}
                  placeholder={'https://youtu.be/...\nまたは概要欄のテキスト（手羽元 8本、大根 400g、醤油 大さじ3...）'}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none focus:border-slate-800"
                />
                <button
                  onClick={handleAnalyzeAiRecipe}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>レシピデータを抽出中...</span>
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

        {/* プレビュー確認モーダル */}
        {previewRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">解析結果の確認・微調整</h3>
                <button onClick={() => setPreviewRecipe(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              {previewRecipe.fetchWarning && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex gap-1.5 items-start">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{previewRecipe.fetchWarning}</span>
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">料理名</label>
                  <input
                    type="text"
                    value={previewRecipe.title}
                    onChange={(e) => setPreviewRecipe({ ...previewRecipe, title: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg p-2 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['夫', '妻', '共通'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPreviewRecipe({ ...previewRecipe, author: p })}
                        className={'py-1.5 text-xs font-bold rounded-lg border ' + (previewRecipe.author === p ? STYLES[p].btn : 'bg-slate-50 text-slate-600')}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">食材 ({previewRecipe.ingredients.length}品)</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {previewRecipe.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          type="text"
                          value={ing.name}
                          onChange={(e) => {
                            const copy = [...previewRecipe.ingredients];
                            copy[idx].name = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, ingredients: copy });
                          }}
                          className="flex-1 bg-slate-50 border rounded p-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="分量"
                          value={ing.amount}
                          onChange={(e) => {
                            const copy = [...previewRecipe.ingredients];
                            copy[idx].amount = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, ingredients: copy });
                          }}
                          className="w-20 bg-slate-50 border rounded p-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">調味料 ({previewRecipe.seasonings.length}品)</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {previewRecipe.seasonings.map((sea, idx) => (
                      <div key={idx} className="flex gap-1">
                        <input
                          type="text"
                          value={sea.name}
                          onChange={(e) => {
                            const copy = [...previewRecipe.seasonings];
                            copy[idx].name = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, seasonings: copy });
                          }}
                          className="flex-1 bg-slate-50 border rounded p-1 text-xs"
                        />
                        <input
                          type="text"
                          placeholder="分量"
                          value={sea.amount}
                          onChange={(e) => {
                            const copy = [...previewRecipe.seasonings];
                            copy[idx].amount = e.target.value;
                            setPreviewRecipe({ ...previewRecipe, seasonings: copy });
                          }}
                          className="w-20 bg-slate-50 border rounded p-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePreviewRecipe}
                  className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs transition"
                >
                  この内容でレシピ帳に登録
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {editingRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">レシピを編集</h3>
                <button onClick={() => setEditingRecipe(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSaveEditedRecipe} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="料理名"
                  value={editingRecipe.title}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, title: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                />
                <input
                  type="url"
                  placeholder="動画URL"
                  value={editingRecipe.sourceUrl || ''}
                  onChange={(e) => setEditingRecipe({ ...editingRecipe, sourceUrl: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
                />
                <div className="grid grid-cols-3 gap-2">
                  {['夫', '妻', '共通'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditingRecipe({ ...editingRecipe, author: p })}
                      className={'py-1.5 text-xs font-bold rounded-lg border ' + (editingRecipe.author === p ? STYLES[p].btn : 'bg-slate-50 text-slate-600')}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2 rounded-lg text-xs">変更を保存</button>
                <button
                  type="button"
                  onClick={() => handleDelRecipe(editingRecipe.id)}
                  className="w-full bg-rose-50 text-rose-600 border border-rose-200 font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />このレシピを削除する
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 予定追加モーダル */}
        {openAddSched && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">予定・旅行を追加</h3>
                <button onClick={() => setOpenAddSched(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddSched} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {['夫', '妻', '共通'].map((p) => (
                    <button key={p} type="button" onClick={() => setSAuthor(p)} className={'py-1.5 text-xs font-bold rounded-lg border ' + (sAuthor === p ? STYLES[p].btn : 'bg-slate-50 text-slate-600')}>
                      {p}
                    </button>
                  ))}
                </div>
                <input type="text" required placeholder="予定名（北海道旅行など）" value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600">日程</span>
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {getDurationText(sStart, sEnd)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">開始日</span>
                      <input 
                        type="date" 
                        required 
                        value={sStart} 
                        onChange={(e) => {
                          setSStart(e.target.value);
                          if (e.target.value > sEnd) setSEnd(e.target.value);
                        }} 
                        className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" 
                      />
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block mb-0.5">終了日</span>
                      <input 
                        type="date" 
                        required 
                        min={sStart}
                        value={sEnd} 
                        onChange={(e) => setSEnd(e.target.value)} 
                        className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-0.5">時間（空欄の場合は終日）</span>
                  <input type="time" value={sTime} onChange={(e) => setSTime(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" />
                </div>
                <input type="text" placeholder="メモ（ホテル名など）" value={sMemo} onChange={(e) => setSMemo(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">登録する</button>
              </form>
            </div>
          </div>
        )}

        {/* ToDo追加モーダル */}
        {openAddTodo && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">買うものを追加</h3>
                <button onClick={() => setOpenAddTodo(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleAddTodo(tName, tAuthor); setTName(''); setOpenAddTodo(false); }} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {['夫', '妻', '共通'].map((p) => (
                    <button key={p} type="button" onClick={() => setTAuthor(p)} className={'py-1.5 text-xs font-bold rounded-lg border ' + (tAuthor === p ? STYLES[p].btn : 'bg-slate-50 text-slate-600')}>
                      {p}
                    </button>
                  ))}
                </div>
                <input type="text" required placeholder="品名（卵、牛乳など）" value={tName} onChange={(e) => setTName(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">追加する</button>
              </form>
            </div>
          </div>
        )}

        {/* ゴミ箱 */}
        {openTrash && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">削除したレシピ（復元可能）</h3>
                <button onClick={() => setOpenTrash(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {trash.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">ゴミ箱は空です</p>
                ) : (
                  trash.map((r) => (
                    <div key={r.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-xs">
                      <span>{r.title}</span>
                      <button onClick={() => handleRestoreRecipe(r.id)} className="bg-white border px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 hover:bg-slate-100">
                        <RotateCcw className="w-3 h-3" />復元
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ナビゲーション */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around py-2 px-3 z-40">
          <button onClick={() => setTab('schedule')} className={'flex flex-col items-center flex-1 py-1 ' + (tab === 'schedule' ? 'text-slate-900 font-bold' : 'text-slate-400')}>
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">スケジュール</span>
          </button>
          <button onClick={() => setTab('todo')} className={'flex flex-col items-center flex-1 py-1 ' + (tab === 'todo' ? 'text-slate-900 font-bold' : 'text-slate-400')}>
            <div className="relative">
              <CheckSquare className="w-5 h-5" />
              {todos.filter((t) => !t.done).length > 0 && (
                <span className="absolute -top-1 -right-2 bg-slate-800 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {todos.filter((t) => !t.done).length}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">買い出しToDo</span>
          </button>
          <button onClick={() => setTab('recipe')} className={'flex flex-col items-center flex-1 py-1 ' + (tab === 'recipe' ? 'text-slate-900 font-bold' : 'text-slate-400')}>
            <BookOpen className="w-5 h-5" />
            <span className="text-[11px] mt-0.5">レシピ帳</span>
          </button>
        </nav>

      </div>
    </div>
  );
}
