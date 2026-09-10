import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
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
  CheckCircle2
} from 'lucide-react';

// --- お二人のFirebase設定 ---
const firebaseConfig = {
  apiKey: "AIzaSyCS28uR8_rT9XHFwLWFZqzTNDRVAD5Idk",
  authDomain: "futari-note-0808.firebaseapp.com",
  projectId: "futari-note-0808",
  storageBucket: "futari-note-0808.firebasestorage.app",
  messagingSenderId: "711781279684",
  appId: "1:711781279684:web:ed27311969586001772691",
  measurementId: "G-R4L0108045"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState('schedule');
  const [calMode, setCalMode] = useState('month');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 2000);
  };

  // 匿名自動ログイン（パスワード不要）
  useEffect(() => {
    signInAnonymously(auth).catch((err) => {
      console.error('Auth error:', err);
    });
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const today = new Date();
  const todayStr = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');

  const [selDate, setSelDate] = useState(todayStr);
  const [vDate, setVDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  // データ保存ステート（クラウドと即時同期）
  const [scheds, setScheds] = useState([]);
  const [todos, setTodos] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [freqs, setFreqs] = useState(['牛乳', 'たまご', 'お米', '食パン', '納豆', '玉ねぎ', '豚肉']);

  // Firestoreリアルタイム監視
  useEffect(() => {
    if (!currentUser) return;

    const unsubSched = onSnapshot(collection(db, 'schedules'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setScheds(list);
    });

    const unsubTodos = onSnapshot(collection(db, 'todos'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTodos(list);
    });

    const unsubRecipes = onSnapshot(collection(db, 'recipes'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setRecipes(list);
    });

    const unsubTrash = onSnapshot(collection(db, 'trash'), (snap) => {
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setTrash(list);
    });

    return () => {
      unsubSched();
      unsubTodos();
      unsubRecipes();
      unsubTrash();
    };
  }, [currentUser]);

  // 予定モーダル
  const [openAddSched, setOpenAddSched] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sStart, setSStart] = useState(todayStr);
  const [sEnd, setSEnd] = useState(todayStr);
  const [sTime, setSTime] = useState('');
  const [sAuthor, setSAuthor] = useState('夫');
  const [sMemo, setSMemo] = useState('');

  // ToDoモーダル
  const [openAddTodo, setOpenAddTodo] = useState(false);
  const [tName, setTName] = useState('');
  const [tAuthor, setTAuthor] = useState('妻');

  // レシピ帳ステート
  const [openAddRecipe, setOpenAddRecipe] = useState(false);
  const [rText, setRText] = useState('');
  const [openTrash, setOpenTrash] = useState(false);
  const [expRecipeId, setExpRecipeId] = useState(null);
  const [rQuery, setRQuery] = useState('');

  const cYear = vDate.getFullYear();
  const cMonth = vDate.getMonth();
  const firstDay = new Date(cYear, cMonth, 1).getDay();
  const daysInMonth = new Date(cYear, cMonth + 1, 0).getDate();

  // 予定の追加
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

    setScheds((prev) => [...prev, item]);
    setSTitle('');
    setSMemo('');
    setSTime('');
    setOpenAddSched(false);
    showToast('予定を登録しました');

    if (currentUser) {
      await setDoc(doc(db, 'schedules', item.id), item).catch(console.error);
    }
  };

  // 予定の削除
  const handleDelSched = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setScheds((prev) => prev.filter((x) => x.id !== id));
    showToast('予定を削除しました');

    if (currentUser) {
      await deleteDoc(doc(db, 'schedules', id)).catch(console.error);
    }
  };

  const dayScheds = useMemo(() => {
    return scheds
      .filter((s) => selDate >= s.startDate && selDate <= (s.endDate || s.startDate))
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }, [scheds, selDate]);

  // ToDoの追加
  const handleAddTodo = async (name, author = '共通') => {
    const txt = name.trim();
    if (!txt) return;

    if (todos.some((t) => t.name === txt && !t.done)) {
      showToast('既に買い物リストに入っています');
      return;
    }

    const item = { 
      id: 't_' + String(Date.now()) + Math.random().toString(36).slice(2, 5), 
      name: txt, 
      author, 
      done: false 
    };

    setTodos((prev) => [item, ...prev]);
    if (!freqs.includes(txt)) {
      setFreqs((prev) => [txt, ...prev.slice(0, 14)]);
    }
    showToast('「' + txt + '」を追加しました');

    if (currentUser) {
      await setDoc(doc(db, 'todos', item.id), item).catch(console.error);
    }
  };

  // ToDoチェック
  const handleToggleTodo = async (id) => {
    const target = todos.find((t) => t.id === id);
    if (!target) return;
    const nextDone = !target.done;

    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: nextDone } : t)));

    if (currentUser) {
      await updateDoc(doc(db, 'todos', id), { done: nextDone }).catch(console.error);
    }
  };

  // ToDo削除
  const handleDelTodo = async (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setTodos((prev) => prev.filter((t) => t.id !== id));
    showToast('項目を削除しました');

    if (currentUser) {
      await deleteDoc(doc(db, 'todos', id)).catch(console.error);
    }
  };

  // レシピ追加
  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!rText.trim()) return;

    const lines = rText.split('\n').map((l) => l.trim()).filter(Boolean);
    let title = 'おすすめ料理';
    const ings = [];
    const steps = [];

    lines.forEach((l) => {
      if (l.indexOf('【') !== -1 && l.indexOf('】') !== -1) {
        title = l.replace(/【|】/g, '');
      } else if (l.match(/^[0-9]/) || l.indexOf('する') !== -1 || l.indexOf('炒める') !== -1 || l.indexOf('煮る') !== -1 || l.indexOf('焼く') !== -1) {
        steps.push(l.replace(/^[0-9]+[\.、\)\s]/, ''));
      } else {
        ings.push(l.replace(/[・-]/g, ''));
      }
    });

    const item = {
      id: 'r_' + String(Date.now()),
      title: title,
      author: '共通',
      ingredients: ings.length > 0 ? ings : ['材料を準備'],
      steps: steps.length > 0 ? steps : ['材料を切って加熱調理する']
    };

    setRecipes((prev) => [item, ...prev]);
    setExpRecipeId(item.id);
    setRText('');
    setOpenAddRecipe(false);
    showToast('「' + title + '」を登録しました');

    if (currentUser) {
      await setDoc(doc(db, 'recipes', item.id), item).catch(console.error);
    }
  };

  // レシピ削除
  const handleDelRecipe = async (id) => {
    const item = recipes.find((r) => r.id === id);
    if (!item) return;
    const trashItem = { ...item, deletedAt: Date.now() };

    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setTrash((prev) => [trashItem, ...prev]);
    showToast('ゴミ箱へ移動しました');

    if (currentUser) {
      await deleteDoc(doc(db, 'recipes', id)).catch(console.error);
      await setDoc(doc(db, 'trash', id), trashItem).catch(console.error);
    }
  };

  // レシピ復元
  const handleRestoreRecipe = async (id) => {
    const item = trash.find((r) => r.id === id);
    if (!item) return;

    setTrash((prev) => prev.filter((r) => r.id !== id));
    setRecipes((prev) => [item, ...prev]);
    showToast('レシピを復元しました');

    if (currentUser) {
      await deleteDoc(doc(db, 'trash', id)).catch(console.error);
      await setDoc(doc(db, 'recipes', id), item).catch(console.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-800 font-sans">
      <div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col relative pb-20 select-none">
        
        {/* ヘッダー */}
        <header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold">ふたり手帳</h1>
            {currentUser ? (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                クラウド同期中
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                <Cloud className="w-2.5 h-2.5" />
                接続準備中...
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
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg border border-slate-700">
            {toast}
          </div>
        )}

        {/* メインビュー */}
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

          {/* タブ3: レシピ帳 */}
          {tab === 'recipe' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="レシピ名で検索..." value={rQuery} onChange={(e) => setRQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-slate-800" />
                </div>
                {trash.length > 0 && (
                  <button onClick={() => setOpenTrash(true)} title="ゴミ箱" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 relative shrink-0">
                    <Archive className="w-4 h-4" />
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">{trash.length}</span>
                  </button>
                )}
              </div>

              <button onClick={() => setOpenAddRecipe(true)} className="w-full bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  レシピテキストから自動登録
                </span>
                <Plus className="w-4 h-4" />
              </button>

              <div className="space-y-2">
                {recipes.filter((r) => r.title.indexOf(rQuery) !== -1).length === 0 ? (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    {rQuery ? '一致するレシピはありません' : '登録されたレシピはありません'}
                  </div>
                ) : (
                  recipes.filter((r) => r.title.indexOf(rQuery) !== -1).map((recipe) => (
                    <div key={recipe.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                      <div onClick={() => setExpRecipeId(expRecipeId === recipe.id ? null : recipe.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50">
                        <div className="flex items-center gap-2">
                          <UtensilsCrossed className="w-4 h-4 text-slate-400" />
                          <div>
                            <h3 className="font-bold text-sm text-slate-900">{recipe.title}</h3>
                            <span className="text-[11px] text-slate-400">材料 {recipe.ingredients.length}個</span>
                          </div>
                        </div>
                        <button onClick={(e) => { if (e && e.stopPropagation) e.stopPropagation(); handleDelRecipe(recipe.id); }} className="p-1.5 text-slate-300 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {expRecipeId === recipe.id && (
                        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                          <div>
                            <div className="font-bold text-slate-500 mb-1">材料（「買う」でToDoに追加）</div>
                            <div className="space-y-1">
                              {recipe.ingredients.map((ing, idx) => (
                                <div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
                                  <span>{ing}</span>
                                  <button onClick={() => handleAddTodo(ing)} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 hover:bg-slate-200">
                                    <ShoppingCart className="w-3 h-3" />買う
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-slate-500 mb-1">作り方</div>
                            <ol className="list-decimal list-inside space-y-1 text-slate-700">
                              {recipe.steps.map((st, idx) => <li key={idx}>{st}</li>)}
                            </ol>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>

        {/* 予定モーダル */}
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

        {/* ToDoモーダル */}
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

        {/* レシピ追加モーダル */}
        {openAddRecipe && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">レシピを追加</h3>
                <button onClick={() => setOpenAddRecipe(false)}><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddRecipe} className="space-y-3">
                <textarea rows={5} placeholder={'【料理名】\n豚肉 200g\n大根 半分\n1. 炒めて煮る'} value={rText} onChange={(e) => setRText(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
                <button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">登録する</button>
              </form>
            </div>
          </div>
        )}

        {/* ゴミ箱モーダル */}
        {openTrash && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">削除したレシピ</h3>
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

        {/* ナビゲーションバー */}
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
