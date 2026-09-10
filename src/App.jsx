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
  Loader2
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

// 色分けスタイル定義
const STYLES = {
  '夫': {
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    border: 'border-l-4 border-l-blue-500',
    cell: 'bg-blue-100 text-blue-800 border-l-2 border-blue-500',
    btn: 'bg-blue-600 text-white'
  },
  '妻': {
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    border: 'border-l-4 border-l-rose-500',
    cell: 'bg-rose-100 text-rose-800 border-l-2 border-rose-500',
    btn: 'bg-rose-600 text-white'
  },
  '共通': {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    border: 'border-l-4 border-l-emerald-500',
    cell: 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500',
    btn: 'bg-emerald-600 text-white'
  }
};

// ローカルキャッシュ関数（オフライン保護）
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
  } catch (e) {
    // ignore
  }
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
    }, 2200);
  };

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');

  const [selDate, setSelDate] = useState(todayStr);
  const [vDate, setVDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // 各データステート（端末保存から即時復元）
  const [scheds, setScheds] = useState(() => loadLocal('scheds', []));
  const [todos, setTodos] = useState(() => loadLocal('todos', []));
  const [recipes, setRecipes] = useState(() => loadLocal('recipes', []));
  const [trash, setTrash] = useState(() => loadLocal('trash', []));
  const [freqs, setFreqs] = useState(() => loadLocal('freqs', ['牛乳', 'たまご', 'お米', '食パン', '納豆', '玉ねぎ', '豚肉', 'トイレットペーパー']));

  // 1. Firebase 匿名認証
  useEffect(() => {
    signInAnonymously(auth).catch((err) => {
      console.warn('Auth note:', err.message);
    });
  }, []);

  // 2. クラウド（Firestore）とのリアルタイム同期
  useEffect(() => {
    let unsubs = [];
    try {
      const unsubSched = onSnapshot(collection(db, 'schedules'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setScheds(list);
        saveLocal('scheds', list);
        setSyncStatus('connected');
      }, (err) => {
        console.warn('Sched error:', err);
      });

      const unsubTodos = onSnapshot(collection(db, 'todos'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTodos(list);
        saveLocal('todos', list);
        setSyncStatus('connected');
      }, (err) => {
        console.warn('Todos error:', err);
      });

      const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRecipes(list);
        saveLocal('recipes', list);
        setSyncStatus('connected');
      }, (err) => {
        console.warn('Recipes error:', err);
      });

      const unsubTrash = onSnapshot(collection(db, 'trash'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTrash(list);
        saveLocal('trash', list);
      }, (err) => {
        console.warn('Trash error:', err);
      });

      unsubs = [unsubSched, unsubTodos, unsubRecipes, unsubTrash];
    } catch (e) {
      console.error('Sync init error:', e);
    }

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, []);

  // 予定用ステート
  const [openAddSched, setOpenAddSched] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sStart, setSStart] = useState(todayStr);
  const [sEnd, setSEnd] = useState(todayStr);
  const [sTime, setSTime] = useState('');
  const [sAuthor, setSAuthor] = useState('夫');
  const [sMemo, setSMemo] = useState('');

  // ToDo用ステート
  const [openAddTodo, setOpenAddTodo] = useState(false);
  const [tName, setTName] = useState('');
  const [tAuthor, setTAuthor] = useState('妻');

  // レシピ用ステート
  const [openAiModal, setOpenAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeTab, setRecipeTab] = useState('ingredients');
  const [expRecipeId, setExpRecipeId] = useState(null);
  const [openTrash, setOpenTrash] = useState(false);
  const [rQuery, setRQuery] = useState('');

  const cYear = vDate.getFullYear();
  const cMonth = vDate.getMonth();
  const firstDay = new Date(cYear, cMonth, 1).getDay();
  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();

  // スケジュール登録
  const handleAddSched = async (e) => {
    e.preventDefault();
    if (!sTitle.trim()) return;

    const item = {
      id: 's_' + String(Date.now()),
      title: sTitle.trim(),
      startDate: sStart,
      endDate: sEnd < sStart ? sStart : sEnd,
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
    } catch (err) {
      console.warn('Cloud save fallback:', err);
    }
  };

  // スケジュール削除
  const handleDelSched = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const next = scheds.filter((x) => x.id !== id);
    setScheds(next);
    saveLocal('scheds', next);
    showToast('予定を削除しました');

    try {
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.warn('Cloud del fallback:', err);
    }
  };

  const dayScheds = useMemo(() => {
    return scheds
      .filter((s) => selDate >= s.startDate && selDate <= (s.endDate || s.startDate))
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }, [scheds, selDate]);

  // ToDo追加
  const handleAddTodo = async (name, author = '共通') => {
    const txt = name.trim();
    if (!txt) return;

    if (todos.some((t) => t.name === txt && !t.done)) {
      showToast('既に買い出しリストに入っています');
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
    } catch (err) {
      console.warn('Cloud todo error:', err);
    }
  };

  // ToDo完了トグル
  const handleToggleTodo = async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const nextDone = !target.done;

    const nextTodos = todos.map((t) => (t.id === id ? { ...t, done: nextDone } : t));
    setTodos(nextTodos);
    saveLocal('todos', nextTodos);

    try {
      await updateDoc(doc(db, 'todos', id), { done: nextDone });
    } catch (err) {
      console.warn('Cloud toggle error:', err);
    }
  };

  // ToDo削除
  const handleDelTodo = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);
    saveLocal('todos', nextTodos);
    showToast('買い出し項目を削除しました');

    try {
      await deleteDoc(doc(db, 'todos', id));
    } catch (err) {
      console.warn('Cloud todo del error:', err);
    }
  };

  // AIレシピ自動抽出（YouTube・TikTok・テキスト対応）
  const handleAnalyzeAiRecipe = async () => {
    const input = aiInput.trim();
    if (!input) return;

    setIsAiLoading(true);
    let videoTitleHint = '';

    // YouTube動画の場合、oEmbedからタイトルとチャンネル名を取得
    if (input.includes('youtube.com') || input.includes('youtu.be')) {
      try {
        const oembedUrl = 'https://noembed.com/embed?url=' + encodeURIComponent(input);
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            videoTitleHint = data.title + (data.author_name ? ' (' + data.author_name + ')' : '');
          }
        }
      } catch (e) {
        // oembed fallback
      }
    }

    const apiKey = "";
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=' + apiKey;

    const systemPrompt = "あなたは家庭向け料理レシピの専門家です。提供された動画URL、タイトル、説明文、またはテキストから料理名、食材（分量付き）、調味料（分量付き）、作り方工程を正確に抽出し、指定のJSON形式で出力してください。食材と調味料は明確に分類してください。";

    const userPrompt = "以下の情報からレシピを抽出してください:\n" +
      "【入力】: " + input + "\n" +
      (videoTitleHint ? "【動画情報】: " + videoTitleHint + "\n" : "") +
      "もしURLだけの場合は、Web検索を活用してその動画やレシピの内容を調べて展開してください。";

    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            title: { type: "STRING" },
            ingredients: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  amount: { type: "STRING" }
                },
                required: ["name", "amount"]
              }
            },
            seasonings: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  amount: { type: "STRING" }
                },
                required: ["name", "amount"]
              }
            },
            steps: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["title", "ingredients", "seasonings", "steps"]
        }
      }
    };

    let resultJson = null;
    const delays = [1000, 2000, 4000];

    for (let i = 0; i <= delays.length; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          const resData = await response.json();
          const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            resultJson = JSON.parse(text);
            break;
          }
        }
      } catch (err) {
        // retry on error
      }
      if (i < delays.length) {
        await new Promise((r) => setTimeout(r, delays[i]));
      }
    }

    // フォールバック: AI抽出が失敗した場合でも、テキストから簡易分解して救出
    if (!resultJson || !resultJson.title) {
      const lines = input.split('\n').map((l) => l.trim()).filter(Boolean);
      let detectedTitle = videoTitleHint || '新しいレシピ';
      const ings = [];
      const seas = [];
      const stps = [];

      lines.forEach((l) => {
        if (l.indexOf('【') !== -1 && l.indexOf('】') !== -1) {
          detectedTitle = l.replace(/【|】/g, '');
        } else if (l.includes('醤油') || l.includes('みりん') || l.includes('酒') || l.includes('塩') || l.includes('砂糖') || l.includes('油') || l.includes('大さじ') || l.includes('小さじ')) {
          seas.push({ name: l.replace(/^[・\-\*]\s*/, ''), amount: '' });
        } else if (l.match(/^[0-9]/) || l.includes('炒める') || l.includes('煮る') || l.includes('焼く') || l.includes('切る')) {
          stps.push(l.replace(/^[0-9]+[\.、\)\s]/, ''));
        } else if (!l.startsWith('http')) {
          ings.push({ name: l.replace(/^[・\-\*]\s*/, ''), amount: '' });
        }
      });

      resultJson = {
        title: detectedTitle,
        ingredients: ings.length > 0 ? ings : [{ name: '主な食材', amount: '適量' }],
        seasonings: seas,
        steps: stps.length > 0 ? stps : ['材料を切って調理する']
      };
    }

    setIsAiLoading(false);

    setPreviewRecipe({
      id: 'r_' + String(Date.now()),
      title: resultJson.title || '新しいレシピ',
      author: '共通',
      sourceUrl: input.startsWith('http') ? input : '',
      ingredients: resultJson.ingredients || [],
      seasonings: resultJson.seasonings || [],
      steps: resultJson.steps || []
    });

    setOpenAiModal(false);
    setAiInput('');
  };

  // プレビュー確定保存
  const handleSavePreviewRecipe = async () => {
    if (!previewRecipe) return;

    const next = [previewRecipe, ...recipes];
    setRecipes(next);
    saveLocal('recipes', next);
    setExpRecipeId(previewRecipe.id);
    showToast('「' + previewRecipe.title + '」をレシピ帳に追加しました');

    try {
      await setDoc(doc(db, 'recipes', previewRecipe.id), previewRecipe);
    } catch (err) {
      console.warn('Cloud recipe save error:', err);
    }

    setPreviewRecipe(null);
  };

  // レシピ編集保存
  const handleSaveEditedRecipe = async (e) => {
    e.preventDefault();
    if (!editingRecipe) return;

    const next = recipes.map((r) => (r.id === editingRecipe.id ? editingRecipe : r));
    setRecipes(next);
    saveLocal('recipes', next);
    showToast('レシピを更新しました');

    try {
      await setDoc(doc(db, 'recipes', editingRecipe.id), editingRecipe);
    } catch (err) {
      console.warn('Cloud recipe update error:', err);
    }

    setEditingRecipe(null);
  };

  // レシピ削除（ゴミ箱へ移動）
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
    showToast('ゴミ箱へ移動しました（30日間復元可能）');

    try {
      await deleteDoc(doc(db, 'recipes', id));
      await setDoc(doc(db, 'trash', id), trashItem);
    } catch (err) {
      console.warn('Cloud trash error:', err);
    }
  };

  // レシピ復元
  const handleRestoreRecipe = async (id) => {
    const target = trash.find((r) => r.id === id);
    if (!target) return;

    const nextTrash = trash.filter((r) => r.id !== id);
    const nextRecipes = [target, ...recipes];

    setTrash(nextTrash);
    setRecipes(nextRecipes);
    saveLocal('trash', nextTrash);
    saveLocal('recipes', nextRecipes);
    showToast('「' + target.title + '」をレシピ帳に復元しました');

    try {
      await deleteDoc(doc(db, 'trash', id));
      await setDoc(doc(db, 'recipes', id), target);
    } catch (err) {
      console.warn('Cloud restore error:', err);
    }
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

        {/* トースト通知 */}
        {toast && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg border border-slate-700 whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* メインコンテンツ */}
        <main className="flex-1 p-3 overflow-y-auto">

          {/* タブ1: スケジュール */}
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
                        <div key={'e-' + i} className="min-h-[52px] bg-slate-50/40 rounded-lg" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dStr = cYear + '-' + String(cMonth + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
                        const isSel = dStr === selDate;
                        const isTod = dStr === todayStr;
                        const evs = scheds.filter((s) => dStr >= s.startDate && dStr <= (s.endDate || s.startDate));
                        const cellBoxClass = 'min-h-[52px] p-0.5 rounded-lg flex flex-col items-stretch border cursor-pointer ' + 
                          (isSel ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : isTod ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100 bg-white');
                        const dayNumClass = 'text-[11px] font-mono leading-none text-left px-1 ' + 
                          (isTod ? 'font-bold text-amber-600' : isSel ? 'font-bold text-slate-900' : 'text-slate-600');
                        return (
                          <div key={dStr} onClick={() => setSelDate(dStr)} className={cellBoxClass}>
                            <span className={dayNumClass}>{dayNum}</span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {evs.slice(0, 2).map((ev) => (
                                <div key={ev.id} className={'text-[8px] px-1 py-0.5 rounded truncate text-left font-medium ' + (STYLES[ev.author] ? STYLES[ev.author].cell : 'bg-slate-100')}>
                                  {ev.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {selDate} の予定（{dayScheds.length}件）
                      </span>
                      <button onClick={() => { setSStart(selDate); setSEnd(selDate); setOpenAddSched(true); }} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800">
                        <Plus className="w-3.5 h-3.5" />予定追加
                      </button>
                    </div>
                    {dayScheds.length === 0 ? (
                      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                        予定はありません
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayScheds.map((item) => (
                          <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + (STYLES[item.author] ? STYLES[item.author].border : '')}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + (STYLES[item.author] ? STYLES[item.author].badge : '')}>{item.author}</span>
                                {item.time && <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">{item.time}</span>}
                              </div>
                              {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                            </div>
                            <button onClick={(e) => handleDelSched(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">全予定 ({scheds.length}件)</span>
                    <button onClick={() => setOpenAddSched(true)} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800">
                      <Plus className="w-3.5 h-3.5" />予定追加
                    </button>
                  </div>
                  {scheds.length === 0 ? (
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      登録されている予定はありません
                    </div>
                  ) : (
                    scheds.map((item) => (
                      <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + (STYLES[item.author] ? STYLES[item.author].border : '')}>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500">{item.startDate.slice(5)}</span>
                            <span className="font-bold text-sm text-slate-900">{item.title}</span>
                            <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + (STYLES[item.author] ? STYLES[item.author].badge : '')}>{item.author}</span>
                          </div>
                          {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                        </div>
                        <button onClick={(e) => handleDelSched(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* タブ2: 買い出しToDo */}
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
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    買うものはありません
                  </div>
                ) : (
                  todos.filter((t) => !t.done).map((item) => (
                    <div key={item.id} onClick={() => handleToggleTodo(item.id)} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer ' + (STYLES[item.author] ? STYLES[item.author].border : '')}>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-transparent hover:border-slate-500">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + (STYLES[item.author] ? STYLES[item.author].badge : '')}>{item.author}</span>
                      </div>
                      <button onClick={(e) => handleDelTodo(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}

                {todos.filter((t) => t.done).length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-bold text-slate-400 mb-1">購入済み ({todos.filter((t) => t.done).length})</div>
                    <div className="space-y-1 opacity-60">
                      {todos.filter((t) => t.done).map((item) => (
                        <div key={item.id} onClick={() => handleToggleTodo(item.id)} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs line-through text-slate-400 flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-slate-500" />
                            <span>{item.name}</span>
                          </div>
                          <button onClick={(e) => handleDelTodo(item.id, e)} className="p-1 text-slate-300 hover:text-rose-500">
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

          {/* タブ3: レシピ帳（AI自動抽出・食材買い出し連携完備） */}
          {tab === 'recipe' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="料理名や食材で検索..." value={rQuery} onChange={(e) => setRQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-slate-800" />
                </div>
                {trash.length > 0 && (
                  <button onClick={() => setOpenTrash(true)} title="ゴミ箱" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 relative shrink-0">
                    <Archive className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">{trash.length}</span>
                  </button>
                )}
              </div>

              {/* AIレシピ自動抽出ボタン */}
              <button onClick={() => setOpenAiModal(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs transition">
                <div className="flex items-center gap-2 text-left">
                  <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <div>動画URL・テキストからAIレシピ自動抽出</div>
                    <div className="text-[10px] text-slate-300 font-normal">YouTube/TikTokの動画URLや概要欄から材料・手順を整理</div>
                  </div>
                </div>
                <Plus className="w-4 h-4" />
              </button>

              {/* レシピ一覧 */}
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
                          <div className="flex items-center gap-2">
                            <UtensilsCrossed className="w-4 h-4 text-slate-400 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-slate-900">{recipe.title}</h3>
                                <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{recipe.author}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                食材 {(recipe.ingredients || []).length}個 / 調味料 {(recipe.seasonings || []).length}個
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {recipe.sourceUrl && (
                              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" title="元動画・Webサイトを開く" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button onClick={() => setEditingRecipe({ ...recipe })} title="レシピを編集" className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* アコーディオン詳細表示 */}
                        {isExp && (
                          <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs">
                              <button onClick={() => setRecipeTab('ingredients')} className={'flex-1 py-1 font-bold rounded ' + (recipeTab === 'ingredients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                食材・調味料
                              </button>
                              <button onClick={() => setRecipeTab('steps')} className={'flex-1 py-1 font-bold rounded ' + (recipeTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                作り方・工程 ({(recipe.steps || []).length})
                              </button>
                            </div>

                            {recipeTab === 'ingredients' && (
                              <div className="space-y-3">
                                {/* 食材 */}
                                <div>
                                  <div className="font-bold text-slate-500 mb-1 flex justify-between items-center">
                                    <span>食材</span>
                                    <span className="text-[10px] text-slate-400">「買う」で買い出しToDoに追加</span>
                                  </div>
                                  <div className="space-y-1">
                                    {(recipe.ingredients || []).map((ing, idx) => {
                                      const name = typeof ing === 'string' ? ing : ing.name;
                                      const amt = typeof ing === 'string' ? '' : ing.amount;
                                      return (
                                        <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-semibold text-slate-800">{name}</span>
                                            {amt && <span className="text-slate-500 font-mono text-[11px]">({amt})</span>}
                                          </div>
                                          <button onClick={() => handleAddTodo(name)} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 hover:bg-slate-200">
                                            <ShoppingCart className="w-3 h-3" />買う
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* 調味料 */}
                                {(recipe.seasonings && recipe.seasonings.length > 0) && (
                                  <div>
                                    <div className="font-bold text-slate-500 mb-1">調味料</div>
                                    <div className="space-y-1">
                                      {recipe.seasonings.map((sea, idx) => {
                                        const name = typeof sea === 'string' ? sea : sea.name;
                                        const amt = typeof sea === 'string' ? '' : sea.amount;
                                        return (
                                          <div key={idx} className="flex items-center justify-between p-1.5 bg-amber-50/60 rounded border border-amber-200/60 text-xs">
                                            <div className="flex items-center gap-1.5">
                                              <span className="font-semibold text-slate-800">{name}</span>
                                              {amt && <span className="text-slate-600 font-mono text-[11px]">({amt})</span>}
                                            </div>
                                            <button onClick={() => handleAddTodo(name)} className="bg-white text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 border border-slate-200 hover:bg-slate-50">
                                              <ShoppingCart className="w-3 h-3" />買う
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {recipeTab === 'steps' && (
                              <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                                {(recipe.steps || []).map((st, idx) => (
                                  <li key={idx} className="p-1.5 bg-white rounded border border-slate-200 leading-relaxed">{st}</li>
                                ))}
                              </ol>
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

        {/* モーダル: AIレシピ自動抽出 */}
        {openAiModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800">動画URL・テキストから抽出</h3>
                </div>
                <button onClick={() => setOpenAiModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  YouTube / TikTok の動画URL、または概要欄テキストを貼り付けてください。AIが自動で料理名・食材・調味料・手順に分解します。
                </p>
                <textarea
                  rows={5}
                  placeholder={'例: https://youtu.be/...\nまたは概要欄のテキスト（豚バラ 200g、醤油 大さじ2...）'}
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none focus:border-slate-800"
                />
                <button
                  onClick={handleAnalyzeAiRecipe}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="w-full bg-slate-900 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
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

        {/* モーダル: 抽出結果のプレビュー＆微調整 */}
        {previewRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">抽出結果の確認・微調整</h3>
                <button onClick={() => setPreviewRecipe(null)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

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
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">記入者（色分け）</label>
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
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">食材 ({previewRecipe.ingredients.length}個)</label>
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

                <button
                  onClick={handleSavePreviewRecipe}
                  className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs"
                >
                  この内容でレシピ帳に登録
                </button>
              </div>
            </div>
          </div>
        )}

        {/* レシピ編集モーダル */}
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
                  placeholder="動画・Web URL"
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
                <h3 className="font-bold text-sm">予定を追加</h3>
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
                <input type="text" required placeholder="予定名（旅行、お迎えなど）" value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" required value={sStart} onChange={(e) => setSStart(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" />
                  <input type="time" value={sTime} onChange={(e) => setSTime(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" />
                </div>
                <input type="text" placeholder="メモ（夕飯不要など）" value={sMemo} onChange={(e) => setSMemo(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
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
                <input type="text" required placeholder="品名（卵、洗剤など）" value={tName} onChange={(e) => setTName(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">追加する</button>
              </form>
            </div>
          </div>
        )}

        {/* ゴミ箱モーダル（30日間復元） */}
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

        {/* 下部固定タブナビゲーション */}
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
