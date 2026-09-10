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
  Key
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
    }, 2500);
  };

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');

  const [selDate, setSelDate] = useState(todayStr);
  const [vDate, setVDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // 各データステート
  const [scheds, setScheds] = useState(() => loadLocal('scheds', []));
  const [todos, setTodos] = useState(() => loadLocal('todos', []));
  const [recipes, setRecipes] = useState(() => loadLocal('recipes', []));
  const [trash, setTrash] = useState(() => loadLocal('trash', []));
  const [freqs, setFreqs] = useState(() => loadLocal('freqs', ['牛乳', 'たまご', 'お米', '食パン', '納豆', '玉ねぎ', '豚肉', 'トイレットペーパー']));
  const [userGeminiKey, setUserGeminiKey] = useState(() => loadLocal('g_key', ''));

  useEffect(() => {
    signInAnonymously(auth).catch((err) => {
      console.warn('Auth note:', err.message);
    });
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
      }, (err) => console.warn('Sched sync:', err));

      const unsubTodos = onSnapshot(collection(db, 'todos'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTodos(list);
        saveLocal('todos', list);
        setSyncStatus('connected');
      }, (err) => console.warn('Todos sync:', err));

      const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setRecipes(list);
        saveLocal('recipes', list);
        setSyncStatus('connected');
      }, (err) => console.warn('Recipes sync:', err));

      const unsubTrash = onSnapshot(collection(db, 'trash'), (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        setTrash(list);
        saveLocal('trash', list);
      }, (err) => console.warn('Trash sync:', err));

      unsubs = [unsubSched, unsubTodos, unsubRecipes, unsubTrash];
    } catch (e) {
      console.error('Sync init error:', e);
    }

    return () => {
      unsubs.forEach((u) => u && u());
    };
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
    showToast('予定を登録しました（' + (isMultiDay ? getDurationText(sStart, finalEnd) : '1日') + '）');

    try {
      await setDoc(doc(db, 'schedules', item.id), item);
    } catch (err) {
      console.warn('Cloud save fallback:', err);
    }
  };

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
    } catch (err) {
      console.warn('Cloud todo error:', err);
    }
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
    } catch (err) {
      console.warn('Cloud toggle error:', err);
    }
  };

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

  const [openAiModal, setOpenAiModal] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState('');
  const [previewRecipe, setPreviewRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [recipeTab, setRecipeTab] = useState('ingredients');
  const [expRecipeId, setExpRecipeId] = useState(null);
  const [openTrash, setOpenTrash] = useState(false);
  const [rQuery, setRQuery] = useState('');
  const [openApiKeyModal, setOpenApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(userGeminiKey);

  // --- 高精度レシピ解析エンジン（概要欄テキストを食材・調味料・手順に分解） ---
  const parseRecipeTextDetailed = (rawText, defaultTitle) => {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = defaultTitle || '新しいレシピ';
    const ings = [];
    const seas = [];
    const stps = [];

    const seasoningKeywords = [
      '醤油', 'しょうゆ', 'みりん', '酒', '塩', '胡椒', 'こしょう', '砂糖', '油', 'ごま油',
      'オリーブオイル', 'サラダ油', '酢', '大さじ', '小さじ', '顆粒', 'コンソメ', 'ほんだし',
      'だしの素', '鶏がら', '鶏ガラスープ', 'マヨネーズ', 'ケチャップ', '味噌', 'みそ', 'バター',
      'にんにく', '生姜', 'しょうが', '豆板醤', 'コチュジャン', 'オイスターソース', 'ウスターソース',
      'めんつゆ', '白だし', '片栗粉', '小麦粉', '薄力粉', 'すりごま', 'いりごま', 'ラー油', 'ブラックペッパー'
    ];

    let currentSection = 'unknown'; // 'ingredients', 'seasonings', 'steps'

    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];

      // タイトル候補の検出
      if (
        (l.includes('【') && l.includes('】')) ||
        l.startsWith('#') ||
        l.includes('作り方') ||
        l.includes('レシピ')
      ) {
        const cleanTitle = l.replace(/[【】#■◆★]/g, '').trim();
        if (cleanTitle.length >= 3 && cleanTitle.length <= 35 && !title.includes(cleanTitle)) {
          if (!cleanTitle.includes('材料') && !cleanTitle.includes('作り方') && !cleanTitle.includes('手順')) {
            title = cleanTitle;
          }
        }
      }

      // セクション判定
      if (l.includes('材料') || l.includes('食材')) {
        currentSection = 'ingredients';
        continue;
      } else if (l.includes('調味料') || l.includes('合わせ調味料') || l.includes('タレ') || l.includes('ソース')) {
        currentSection = 'seasonings';
        continue;
      } else if (l.includes('作り方') || l.includes('手順') || l.includes('工程') || l.includes('ステップ')) {
        currentSection = 'steps';
        continue;
      }

      const clean = l.replace(/^[・\-\*①②③④⑤⑥⑦⑧⑨⑩\d+\.、\)\s]/, '').trim();
      if (!clean || clean.startsWith('http') || clean.includes('チャンネル登録') || clean.includes('Twitter') || clean.includes('Instagram')) {
        continue;
      }

      // 手順判定
      const isStepLike =
        clean.match(/^(炒める|煮る|焼く|切る|混ぜる|火を|温める|茹でる|レンチン|電子レンジ|沸騰|フライパン|ボウル|鍋に|盛り付|粗熱|水気を|下味)/) ||
        l.match(/^[0-9]+[\.、\)\s]/) ||
        l.match(/^[①②③④⑤⑥⑦⑧⑨⑩]/) ||
        currentSection === 'steps';

      if (isStepLike && clean.length >= 6) {
        stps.push(clean);
        continue;
      }

      // 材料・調味料の分割（スペース、コロン、点など）
      const parts = clean.split(/[\s:：\t…\.\-〜]+/);
      const name = parts[0]?.trim();
      const amount = parts.slice(1).join(' ').trim() || '適量';

      if (!name || name.length > 25) continue;

      const isSeasoning = seasoningKeywords.some((k) => name.includes(k) || amount.includes(k)) || currentSection === 'seasonings';

      if (isSeasoning) {
        seas.push({ name, amount });
      } else {
        ings.push({ name, amount });
      }
    }

    return {
      title: title || '新しいレシピ',
      ingredients: ings.length > 0 ? ings : [{ name: 'メイン食材', amount: '適量' }],
      seasonings: seas,
      steps: stps.length > 0 ? stps : ['材料を切って火が通るまで加熱調理する']
    };
  };

  // --- YouTube・TikTok・Web対応の完全解析ハンドラ ---
  const handleAnalyzeAiRecipe = async () => {
    const input = aiInput.trim();
    if (!input) return;

    setIsAiLoading(true);
    setAiStatusMsg('動画・Webページの情報を取得中...');

    let videoTitle = '';
    let fetchedDescription = '';
    const isUrl = input.startsWith('http://') || input.startsWith('https://');

    if (isUrl) {
      // 1. oEmbedで基本タイトルを取得
      if (input.includes('youtube.com') || input.includes('youtu.be')) {
        try {
          const oembedUrl = 'https://noembed.com/embed?url=' + encodeURIComponent(input);
          const res = await fetch(oembedUrl);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title) {
              videoTitle = data.title.replace(/\s*by.*$/, '').replace(/【.*?】/g, (m) => m).trim();
            }
          }
        } catch (e) {
          // fallback
        }
      }

      // 2. 無料Webリーダー（r.jina.ai）で動画概要欄・全文テキストを自動抽出
      try {
        setAiStatusMsg('概要欄と材料テキストを解析中...');
        const readerUrl = 'https://r.jina.ai/' + input;
        const res = await fetch(readerUrl, {
          headers: { 'X-No-Cache': 'true' }
        });
        if (res.ok) {
          const text = await res.text();
          if (text && text.length > 50) {
            fetchedDescription = text;
          }
        }
      } catch (err) {
        console.warn('Reader proxy note:', err);
      }
    }

    const textToAnalyze = (fetchedDescription ? fetchedDescription + '\n' : '') + input;

    // 3. Gemini APIキーがある場合は高度AI生成を試みる
    let aiParsedJson = null;
    const activeKey = userGeminiKey.trim();

    if (activeKey) {
      setAiStatusMsg('AIがレシピと材料を整理中...');
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + activeKey;

      const systemPrompt = "提供されたレシピ情報から【料理名】【食材リスト（分量付き）】【調味料リスト（分量付き）】【調理工程（番号付き）】を抽出し、以下の純粋なJSONのみを出力してください。\n" +
        "{\n" +
        "  \"title\": \"料理名\",\n" +
        "  \"ingredients\": [{\"name\": \"豚バラ肉\", \"amount\": \"200g\"}],\n" +
        "  \"seasonings\": [{\"name\": \"醤油\", \"amount\": \"大さじ2\"}],\n" +
        "  \"steps\": [\"手順1\", \"手順2\"]\n" +
        "}";

      const payload = {
        contents: [{ parts: [{ text: "以下のテキストからレシピ情報を抽出してください:\n\n" + textToAnalyze.slice(0, 4000) }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { responseMimeType: "application/json" }
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          const data = await response.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.title) {
              aiParsedJson = parsed;
            }
          }
        }
      } catch (e) {
        console.warn('Gemini API note:', e);
      }
    }

    // 4. AI解析が未実行または失敗時は、高性能レシピ抽出エンジンで即座に復元
    const finalResult = aiParsedJson || parseRecipeTextDetailed(textToAnalyze, videoTitle || 'YouTubeレシピ');

    setIsAiLoading(false);
    setAiStatusMsg('');

    setPreviewRecipe({
      id: 'r_' + String(Date.now()),
      title: finalResult.title || videoTitle || '新しいレシピ',
      author: '共通',
      sourceUrl: isUrl ? input : '',
      ingredients: Array.isArray(finalResult.ingredients) ? finalResult.ingredients : [],
      seasonings: Array.isArray(finalResult.seasonings) ? finalResult.seasonings : [],
      steps: Array.isArray(finalResult.steps) ? finalResult.steps : []
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
    } catch (err) {
      console.warn('Cloud recipe save error:', err);
    }

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
    } catch (err) {
      console.warn('Cloud recipe update error:', err);
    }

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
    showToast('ゴミ箱へ移動しました（30日間復元可能）');

    try {
      await deleteDoc(doc(db, 'recipes', id));
      await setDoc(doc(db, 'trash', id), trashItem);
    } catch (err) {
      console.warn('Cloud trash error:', err);
    }
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
    } catch (err) {
      console.warn('Cloud restore error:', err);
    }
  };

  const handleSaveApiKey = () => {
    const k = tempApiKey.trim();
    setUserGeminiKey(k);
    saveLocal('g_key', k);
    setOpenApiKeyModal(false);
    showToast(k ? 'Gemini APIキーを保存しました' : 'APIキーを解除しました');
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
                        <div key={'e-' + i} className="min-h-[58px] bg-slate-50/40 rounded-lg" />
                      ))}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const dayNum = i + 1;
                        const dStr = cYear + '-' + String(cMonth + 1).padStart(2, '0') + '-' + String(dayNum).padStart(2, '0');
                        const isSel = dStr === selDate;
                        const isTod = dStr === todayStr;
                        const evs = scheds.filter((s) => dStr >= s.startDate && dStr <= (s.endDate || s.startDate));
                        
                        const cellBoxClass = 'min-h-[58px] p-0.5 rounded-lg flex flex-col items-stretch border cursor-pointer transition ' + 
                          (isSel ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : isTod ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100 bg-white hover:border-slate-300');
                        const dayNumClass = 'text-[11px] font-mono leading-none text-left px-1 ' + 
                          (isTod ? 'font-bold text-amber-600' : isSel ? 'font-bold text-slate-900' : 'text-slate-600');
                        
                        return (
                          <div key={dStr} onClick={() => setSelDate(dStr)} className={cellBoxClass}>
                            <span className={dayNumClass}>{dayNum}</span>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {evs.slice(0, 2).map((ev) => {
                                const isStart = dStr === ev.startDate;
                                const isEnd = dStr === ev.endDate;
                                const isMulti = ev.isMultiDay || (ev.endDate && ev.endDate > ev.startDate);
                                const style = STYLES[ev.author] || STYLES['共通'];
                                
                                if (isMulti) {
                                  return (
                                    <div 
                                      key={ev.id} 
                                      className={'text-[8px] px-1 py-0.5 truncate text-left font-bold ' + style.bar + ' ' + 
                                        (isStart && isEnd ? 'rounded' : isStart ? 'rounded-l' : isEnd ? 'rounded-r' : 'rounded-none')}
                                    >
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
                              {evs.length > 2 && (
                                <span className="text-[7px] text-slate-400 font-bold leading-none text-left px-0.5">+{evs.length - 2}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {selDate} の予定（{dayScheds.length}件）
                      </span>
                      <button 
                        onClick={() => { setSStart(selDate); setSEnd(selDate); setOpenAddSched(true); }} 
                        className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-slate-800 transition shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />予定追加
                      </button>
                    </div>

                    {dayScheds.length === 0 ? (
                      <div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                        {selDate} に予定はありません
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayScheds.map((item) => {
                          const style = STYLES[item.author] || STYLES['共通'];
                          const isMulti = item.isMultiDay || (item.endDate && item.endDate > item.startDate);
                          const duration = getDurationText(item.startDate, item.endDate);

                          return (
                            <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + style.border}>
                              <div className="flex-1 mr-2">
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  {isMulti && (
                                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-300 flex items-center gap-1">
                                      <Luggage className="w-3 h-3" />
                                      {duration}
                                    </span>
                                  )}
                                  <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                  <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{item.author}</span>
                                  {item.time && <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded font-mono">{item.time}</span>}
                                </div>
                                {isMulti && (
                                  <div className="text-[11px] text-slate-500 font-mono mb-0.5">
                                    期間: {item.startDate} 〜 {item.endDate}
                                  </div>
                                )}
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
                    <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                      登録されている予定はありません
                    </div>
                  ) : (
                    scheds
                      .sort((a, b) => a.startDate.localeCompare(b.startDate))
                      .map((item) => {
                        const style = STYLES[item.author] || STYLES['共通'];
                        const isMulti = item.isMultiDay || (item.endDate && item.endDate > item.startDate);
                        return (
                          <div key={item.id} className={'p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ' + style.border}>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-slate-600">
                                  {item.startDate.slice(5)}
                                  {isMulti ? '〜' + item.endDate.slice(5) : ''}
                                </span>
                                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                                {isMulti && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 font-bold">{getDurationText(item.startDate, item.endDate)}</span>}
                                <span className={'text-[10px] px-1.5 py-0.2 rounded font-semibold border ' + style.badge}>{item.author}</span>
                              </div>
                              {item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
                            </div>
                            <button onClick={(e) => handleDelSched(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500">
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

          {/* タブ3: レシピ帳 */}
          {tab === 'recipe' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="料理名・食材名（豚肉、玉ねぎなど）で検索..." value={rQuery} onChange={(e) => setRQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-slate-800" />
                </div>
                {trash.length > 0 && (
                  <button onClick={() => setOpenTrash(true)} title="ゴミ箱" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 relative shrink-0">
                    <Archive className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">{trash.length}</span>
                  </button>
                )}
                <button onClick={() => { setTempApiKey(userGeminiKey); setOpenApiKeyModal(true); }} title="AI設定" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 shrink-0">
                  <Key className="w-4 h-4" />
                </button>
              </div>

              {/* AIレシピ自動抽出ボタン */}
              <button onClick={() => setOpenAiModal(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3.5 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs transition">
                <div className="flex items-center gap-2.5 text-left">
                  <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
                  <div>
                    <div className="text-sm">動画URL・概要欄からレシピ自動解析</div>
                    <div className="text-[11px] text-slate-300 font-normal">YouTube/TikTokの材料・調味料・手順を完全自動整理</div>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-slate-400" />
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
                              <button onClick={() => setRecipeTab('ingredients')} className={'flex-1 py-1.5 font-bold rounded ' + (recipeTab === 'ingredients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                材料・調味料
                              </button>
                              <button onClick={() => setRecipeTab('steps')} className={'flex-1 py-1.5 font-bold rounded ' + (recipeTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500')}>
                                作り方・手順 ({(recipe.steps || []).length})
                              </button>
                            </div>

                            {recipeTab === 'ingredients' && (
                              <div className="space-y-3">
                                {/* 食材 */}
                                <div>
                                  <div className="font-bold text-slate-600 mb-1.5 flex justify-between items-center">
                                    <span>食材</span>
                                    <span className="text-[10px] text-slate-400">「買う」で買い出しToDoに追加</span>
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

                                {/* 調味料 */}
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
                                      <span className="w-4 h-4 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                        {idx + 1}
                                      </span>
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

        {/* モーダル: AIレシピ抽出 */}
        {openAiModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800">動画URL・概要欄からレシピ自動解析</h3>
                </div>
                <button onClick={() => setOpenAiModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  YouTubeのURL（または概要欄のテキスト）を貼り付けるだけで、概要欄の食材・調味料・手順を自動で取得・分解します。
                </p>
                <textarea
                  rows={6}
                  placeholder={'https://youtu.be/...\nまたは概要欄のテキストを貼り付け'}
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
                      <span>{aiStatusMsg || 'レシピを解析中...'}</span>
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

        {/* モーダル: プレビュー＆手動修正 */}
        {previewRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">解析結果の確認・微調整</h3>
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

        {/* モーダル: レシピ編集 */}
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

        {/* モーダル: 予定追加 */}
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
                <input type="text" required placeholder="予定名（北海道旅行、帰省、お迎えなど）" value={sTitle} onChange={(e) => setSTitle(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600">日程（連日・宿泊に対応）</span>
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
                <input type="text" placeholder="メモ（ホテル名、夕飯不要など）" value={sMemo} onChange={(e) => setSMemo(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">登録する</button>
              </form>
            </div>
          </div>
        )}

        {/* モーダル: 買うもの追加 */}
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
                <input type="text" required placeholder="品名（卵、牛乳、洗剤など）" value={tName} onChange={(e) => setTName(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">追加する</button>
              </form>
            </div>
          </div>
        )}

        {/* モーダル: ゴミ箱 */}
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

        {/* モーダル: AIキー任意設定 */}
        {openApiKeyModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  <h3 className="font-bold text-sm">Gemini APIキー設定（任意）</h3>
                </div>
                <button onClick={() => setOpenApiKeyModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Google AI Studioの無料APIキーを入力すると、より高度なAI要約が有効になります。空欄のままでも概要欄の自動抽出エンジンが動作します。
              </p>
              <input
                type="password"
                placeholder="AIzaSy...（未入力でも動作します）"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none"
              />
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setTempApiKey(''); }} className="px-3 py-2 border rounded-lg text-xs text-slate-500">クリア</button>
                <button onClick={handleSaveApiKey} className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-lg text-xs">設定を保存</button>
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
