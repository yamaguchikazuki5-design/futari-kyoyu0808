import React, { useState, useEffect, useMemo } from 'react';
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
Sparkles,
RotateCcw,
Archive,
ShoppingCart,
List,
CalendarDays,
UtensilsCrossed,
CheckCircle2
} from 'lucide-react';
// 配色スタイル
const AUTHOR_STYLES = {
'夫': { badge: 'bg-blue-100 text-blue-800 border-blue-300', border: 'border-l-4 border-l-blue-500', cell: 'bg-blue-100 text-blue-800', btn: 'bg-blue-600 text-white' },
'妻': { badge: 'bg-rose-100 text-rose-800 border-rose-300', border: 'border-l-4 border-l-rose-500', cell: 'bg-rose-100 text-rose-800', btn: 'bg-rose-600 text-white' },
'共通': { badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', border: 'border-l-4 border-l-emerald-500', cell: 'bg-emerald-100 text-emerald-800', btn: 'bg-emerald-600 text-white' },
};
export default function App() {
const [currentTab, setCurrentTab] = useState('schedule');
const [calendarViewMode, setCalendarViewMode] = useState('month');
const [toastMessage, setToastMessage] = useState(null);
const showToast = (msg) => {
setToastMessage(msg);
setTimeout(() => setToastMessage(null), 2000);
};
// --- ローカルストレージ自動復元・保存 ---
const loadLocal = (key, fallback) => {
try {
const saved = localStorage.getItem(⁠futari_${key}⁠);
return saved ? JSON.parse(saved) : fallback;
} catch {
return fallback;
}
};
const saveLocal = (key, val) => {
try {
localStorage.setItem(⁠futari_${key}⁠, JSON.stringify(val));
} catch (e) {
console.warn(e);
}
};
// 日付
const today = new Date();
const todayStr = ⁠${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}⁠;
const [selectedDate, setSelectedDate] = useState(todayStr);
const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
// データステート
const [schedules, setSchedules] = useState(() => loadLocal('schedules', []));
const [todos, setTodos] = useState(() => loadLocal('todos', []));
const [recipes, setRecipes] = useState(() => loadLocal('recipes', []));
const [trash, setTrash] = useState(() => loadLocal('trash', []));
const [frequentItems, setFrequentItems] = useState(() => loadLocal('frequent', ['牛乳', 'たまご', 'お米', '食パン', '納豆', '玉ねぎ', '豚肉']));
useEffect(() => saveLocal('schedules', schedules), [schedules]);
useEffect(() => saveLocal('todos', todos), [todos]);
useEffect(() => saveLocal('recipes', recipes), [recipes]);
useEffect(() => saveLocal('trash', trash), [trash]);
useEffect(() => saveLocal('frequent', frequentItems), [frequentItems]);
// モーダル
const [isAddSched, setIsAddSched] = useState(false);
const [schTitle, setSchTitle] = useState('');
const [schStart, setSchStart] = useState(todayStr);
const [schEnd, setSchEnd] = useState(todayStr);
const [schTime, setSchTime] = useState('');
const [schAuthor, setSchAuthor] = useState('夫');
const [schMemo, setSchMemo] = useState('');
const [isAddTodo, setIsAddTodo] = useState(false);
const [todoName, setTodoName] = useState('');
const [todoAuthor, setTodoAuthor] = useState('妻');
const [isAddRecipe, setIsAddRecipe] = useState(false);
const [recipeText, setRecipeText] = useState('');
const [isTrashOpen, setIsTrashOpen] = useState(false);
const [expandedRecipeId, setExpandedRecipeId] = useState(null);
const [recipeSearch, setRecipeSearch] = useState('');
// カレンダー計算
const currentYear = viewDate.getFullYear();
const currentMonth = viewDate.getMonth();
const firstDay = new Date(currentYear, currentMonth, 1).getDay();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
// --- スケジュール操作 ---
const handleAddSchedule = (e) => {
e.preventDefault();
if (!schTitle.trim()) return;
const item = {
id: 's_' + Date.now(),
title: schTitle.trim(),
startDate: schStart,
endDate: schEnd < schStart ? schStart : schEnd,
time: schTime,
author: schAuthor,
memo: schMemo.trim()
};
setSchedules(prev => [...prev, item]);
setSchTitle('');
setSchMemo('');
setSchTime('');
setIsAddSched(false);
showToast('予定を登録しました');
};
const handleDeleteSchedule = (id, e) => {
e?.stopPropagation();
setSchedules(prev => prev.filter(s => s.id !== id));
showToast('予定を削除しました');
};
const selectedSchedules = useMemo(() => {
return schedules
.filter(s => selectedDate >= s.startDate && selectedDate <= (s.endDate || s.startDate))
.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
}, [schedules, selectedDate]);
// --- ToDo操作 ---
const handleAddTodoItem = (name, author = '共通') => {
const trimmed = name.trim();
if (!trimmed) return;
if (todos.some(t => t.name === trimmed && !t.done)) {
showToast(⁠「${trimmed}」は既に入っています⁠);
return;
}
const item = { id: 't_' + Date.now() + Math.random().toString(36).slice(2, 5), name: trimmed, author, done: false };
setTodos(prev => [item, ...prev]);
if (!frequentItems.includes(trimmed)) {
setFrequentItems(prev => [trimmed, ...prev.slice(0, 15)]);
}
showToast(⁠「${trimmed}」を追加しました⁠);
};
const handleToggleTodo = (id) => {
setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
};
const handleDeleteTodo = (id, e) => {
e?.stopPropagation();
setTodos(prev => prev.filter(t => t.id !== id));
showToast('項目を削除しました');
};
// --- レシピ操作 ---
const handleParseRecipe = (e) => {
e.preventDefault();
if (!recipeText.trim()) return;
const lines = recipeText.split('\n').map(l => l.trim()).filter(Boolean);
let title = 'おすすめ料理';
const ings = [];
const steps = [];
lines.forEach(l => {
if (l.includes('【') && l.includes('】')) title = l.replace(/【|】/g, '');
else if (l.match(/^[0-9]/) || l.includes('する') || l.includes('炒める') || l.includes('煮る')) steps.push(l.replace(/^[0-9]+[.、)\s]/, ''));
else ings.push(l.replace(/[・-]/g, ''));
});
const newRecipe = {
id: 'r_' + Date.now(),
title,
author: '共通',
ingredients: ings.length > 0 ? ings : ['材料を準備'],
steps: steps.length > 0 ? steps : ['材料を切って加熱調理する。']
};
setRecipes(prev => [newRecipe, ...prev]);
setExpandedRecipeId(newRecipe.id);
setRecipeText('');
setIsAddRecipe(false);
showToast(⁠「${title}」を登録しました⁠);
};
const handleDeleteRecipe = (id) => {
const target = recipes.find(r => r.id === id);
if (!target) return;
setRecipes(prev => prev.filter(r => r.id !== id));
setTrash(prev => [{ ...target, deletedAt: Date.now() }, ...prev]);
showToast(⁠「${target.title}」をゴミ箱へ移動しました⁠);
};
const handleRestoreRecipe = (id) => {
const target = trash.find(r => r.id === id);
if (!target) return;
setTrash(prev => prev.filter(r => r.id !== id));
setRecipes(prev => [target, ...prev]);
showToast(⁠「${target.title}」を復元しました⁠);
};
return (
<div className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-800 font-sans antialiased">
<div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col relative pb-20 select-none">
{/* ヘッダー */}
<header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between">
<div className="flex items-center gap-2">
<h1 className="text-base font-bold">ふたり手帳</h1>
<span className="flex items-center gap-1 text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700">
<CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
端末保存中
</span>
</div>
<div className="flex gap-2 text-[11px]">
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>夫</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span>妻</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>共通</span>
</div>
</header>
{toastMessage && (
<div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg border border-slate-700">
{toastMessage}
</div>
)}
{/* メイン画面 /}
<main className="flex-1 p-3 overflow-y-auto">
{/ 1. スケジュール */}
{currentTab === 'schedule' && (
<div className="space-y-3">
<div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs">
<div className="flex items-center gap-2">
<button onClick={() => setViewDate(new Date(currentYear, currentMonth - 1, 1))} className="p-1 rounded-lg border border-slate-200 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
<span className="font-bold text-sm text-slate-800">{currentYear}年 {currentMonth + 1}月</span>
<button onClick={() => setViewDate(new Date(currentYear, currentMonth + 1, 1))} className="p-1 rounded-lg border border-slate-200 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
</div>
<div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
<button onClick={() => setCalendarViewMode('month')} className={⁠px-2.5 py-1 rounded font-bold ${calendarViewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}⁠}>月表示</button>
<button onClick={() => setCalendarViewMode('list')} className={⁠px-2.5 py-1 rounded font-bold ${calendarViewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'}⁠}>一覧</button>
</div>
</div>
{calendarViewMode === 'month' ? (
<>
<div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
<div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 py-1 border-b border-slate-100">
<span className="text-rose-500">日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span className="text-blue-500">土</span>
</div>
<div className="grid grid-cols-7 gap-1 text-center mt-1">
{Array.from({ length: firstDay }).map((, i) => <div key={⁠e-${i}⁠} className="min-h-[52px] bg-slate-50/40 rounded-lg" />}
{Array.from({ length: daysInMonth }).map((, i) => {
const dayNum = i + 1;
const dateStr = ⁠${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}⁠;
const isSelected = dateStr === selectedDate;
const isToday = dateStr === todayStr;
const dayEvs = schedules.filter(s => dateStr >= s.startDate && dateStr <= (s.endDate || s.startDate));
return (
<div key={dateStr} onClick={() => setSelectedDate(dateStr)} className={⁠min-h-[52px] p-0.5 rounded-lg flex flex-col items-stretch border cursor-pointer ${isSelected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : isToday ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100 bg-white'}⁠}>
<span className={⁠text-[11px] font-mono leading-none text-left px-1 ${isToday ? 'font-bold text-amber-600' : isSelected ? 'font-bold text-slate-900' : 'text-slate-600'}⁠}>{dayNum}</span>
<div className="flex flex-col gap-0.5 mt-0.5">
{dayEvs.slice(0, 2).map(ev => (
<div key={ev.id} className={⁠text-[8px] px-1 py-0.5 rounded truncate text-left font-medium ${AUTHOR_STYLES[ev.author]?.cell || 'bg-slate-100'}⁠}>{ev.title}</div>
))}
</div>
</div>
);
})}
</div>
</div>
<div>
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-bold text-slate-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedDate} の予定（{selectedSchedules.length}件）</span>
<button onClick={() => { setSchStart(selectedDate); setSchEnd(selectedDate); setIsAddSched(true); }} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"><Plus className="w-3.5 h-3.5" />予定追加</button>
</div>
{selectedSchedules.length === 0 ? (
<div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">予定はありません</div>
) : (
<div className="space-y-2">
{selectedSchedules.map(item => (
<div key={item.id} className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${AUTHOR_STYLES[item.author]?.border}⁠}>
<div>
<div className="flex items-center gap-2">
<span className="font-bold text-sm text-slate-900">{item.title}</span>
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${AUTHOR_STYLES[item.author]?.badge}⁠}>{item.author}</span>
{item.time && <span className="text-[10px] bg-slate-100 text-slate-600 px-1 rounded">{item.time}</span>}
</div>
{item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
</div>
<button onClick={(e) => handleDeleteSchedule(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
</div>
))}
</div>
)}
</div>
</>
) : (
<div className="space-y-2">
<div className="flex items-center justify-between">
<span className="text-xs font-bold text-slate-600">全予定 ({schedules.length}件)</span>
<button onClick={() => setIsAddSched(true)} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"><Plus className="w-3.5 h-3.5" />予定追加</button>
</div>
{schedules.map(item => (
<div key={item.id} className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${AUTHOR_STYLES[item.author]?.border}⁠}>
<div>
<div className="flex items-center gap-2">
<span className="text-xs font-mono font-bold text-slate-500">{item.startDate.slice(5)}</span>
<span className="font-bold text-sm text-slate-900">{item.title}</span>
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${AUTHOR_STYLES[item.author]?.badge}⁠}>{item.author}</span>
</div>
{item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
</div>
<button onClick={(e) => handleDeleteSchedule(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
</div>
))}
</div>
)}
</div>
)}
{/* 2. 買い出しToDo */}
{currentTab === 'todo' && (
<div className="space-y-3">
<div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
<div className="text-xs font-bold text-slate-700 mb-2">よく買うもの（タップで追加）</div>
<div className="flex flex-wrap gap-1.5">
{frequentItems.map(name => (
<button key={name} onClick={() => handleAddTodoItem(name)} className="text-xs px-2.5 py-1.5 rounded-lg border bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-xs active:scale-95 transition">+ {name}</button>
))}
</div>
</div>
<div className="flex items-center justify-between pt-1">
<span className="font-bold text-sm text-slate-800">買うもの一覧（{todos.filter(t => !t.done).length}件）</span>
<button onClick={() => setIsAddTodo(true)} className="flex items-center gap-1 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg"><Plus className="w-3.5 h-3.5" />手動追加</button>
</div>
<div className="space-y-2">
{todos.filter(t => !t.done).length === 0 ? (
<div className="py-8 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">買うものはありません</div>
) : (
todos.filter(t => !t.done).map(item => (
<div key={item.id} onClick={() => handleToggleTodo(item.id)} className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer ${AUTHOR_STYLES[item.author]?.border}⁠}>
<div className="flex items-center gap-3">
<div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-transparent hover:border-slate-500"><Check className="w-3.5 h-3.5" /></div>
<span className="font-bold text-sm text-slate-900">{item.name}</span>
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${AUTHOR_STYLES[item.author]?.badge}⁠}>{item.author}</span>
</div>
<button onClick={(e) => handleDeleteTodo(item.id, e)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
</div>
))
)}
{todos.filter(t => t.done).length > 0 && (
<div className="pt-2">
<div className="text-[11px] font-bold text-slate-400 mb-1">購入済み ({todos.filter(t => t.done).length})</div>
<div className="space-y-1 opacity-60">
{todos.filter(t => t.done).map(item => (
<div key={item.id} onClick={() => handleToggleTodo(item.id)} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs line-through text-slate-400 flex items-center justify-between cursor-pointer">
<div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-slate-500" /><span>{item.name}</span></div>
<button onClick={(e) => handleDeleteTodo(item.id, e)} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
</div>
))}
</div>
</div>
)}
</div>
</div>
)}
{/* 3. レシピ帳 */}
{currentTab === 'recipe' && (
<div className="space-y-3">
<div className="flex gap-2">
<input type="text" placeholder="レシピや食材で検索..." value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none" />
{trash.length > 0 && (
<button onClick={() => setIsTrashOpen(true)} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 relative shrink-0">
<Archive className="w-4 h-4" /><span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full font-bold flex items-center justify-center">{trash.length}</span>
</button>
)}
</div>
<button onClick={() => setIsAddRecipe(true)} className="w-full bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between text-xs font-bold shadow-xs">
<span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-300" />レシピテキストから自動登録</span><Plus className="w-4 h-4" />
</button>
<div className="space-y-2">
{recipes.filter(r => r.title.includes(recipeSearch)).map(recipe => (
<div key={recipe.id} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
<div onClick={() => setExpandedRecipeId(expandedRecipeId === recipe.id ? null : recipe.id)} className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50">
<div>
<h3 className="font-bold text-sm text-slate-900">{recipe.title}</h3>
<span className="text-[11px] text-slate-400">材料 {recipe.ingredients.length}個</span>
</div>
<button onClick={(e) => { e.stopPropagation(); handleDeleteRecipe(recipe.id); }} className="p-1.5 text-slate-300 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
</div>
{expandedRecipeId === recipe.id && (
<div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
<div>
<div className="font-bold text-slate-500 mb-1">材料（「買う」でToDoに追加）</div>
<div className="space-y-1">
{recipe.ingredients.map((ing, idx) => (
<div key={idx} className="flex items-center justify-between p-1.5 bg-white rounded border border-slate-200">
<span>{ing}</span>
<button onClick={() => handleAddTodoItem(ing)} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1"><ShoppingCart className="w-3 h-3" />買う</button>
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
))}
</div>
</div>
)}
</main>
{/* 予定追加モーダル */}
{isAddSched && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
<div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
<div className="flex justify-between items-center pb-2 border-b"><h3 className="font-bold text-sm">予定を追加</h3><button onClick={() => setIsAddSched(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
<form onSubmit={handleAddSchedule} className="space-y-3">
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map(p => (
<button key={p} type="button" onClick={() => setSchAuthor(p)} className={⁠py-1.5 text-xs font-bold rounded-lg border ${schAuthor === p ? AUTHOR_STYLES[p].btn : 'bg-slate-50 text-slate-600'}⁠}>{p}</button>
))}
</div>
<input type="text" required placeholder="予定名（旅行、お迎えなど）" value={schTitle} onChange={e => setSchTitle(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
<div className="grid grid-cols-2 gap-2">
<input type="date" required value={schStart} onChange={e => setSchStart(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" />
<input type="time" value={schTime} onChange={e => setSchTime(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-1.5 text-xs" />
</div>
<input type="text" placeholder="メモ（夕飯不要など）" value={schMemo} onChange={e => setSchMemo(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
<button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">登録する</button>
</form>
</div>
</div>
)}
{/* ToDo追加モーダル */}
{isAddTodo && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
<div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
<div className="flex justify-between items-center pb-2 border-b"><h3 className="font-bold text-sm">買うものを追加</h3><button onClick={() => setIsAddTodo(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
<form onSubmit={(e) => { e.preventDefault(); handleAddTodoItem(todoName, todoAuthor); setTodoName(''); setIsAddTodo(false); }} className="space-y-3">
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map(p => (
<button key={p} type="button" onClick={() => setTodoAuthor(p)} className={⁠py-1.5 text-xs font-bold rounded-lg border ${todoAuthor === p ? AUTHOR_STYLES[p].btn : 'bg-slate-50 text-slate-600'}⁠}>{p}</button>
))}
</div>
<input type="text" required placeholder="品名（卵、洗剤など）" value={todoName} onChange={e => setTodoName(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
<button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">追加する</button>
</form>
</div>
</div>
)}
{/* レシピ追加モーダル */}
{isAddRecipe && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
<div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
<div className="flex justify-between items-center pb-2 border-b"><h3 className="font-bold text-sm">レシピを追加</h3><button onClick={() => setIsAddRecipe(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
<form onSubmit={handleParseRecipe} className="space-y-3">
<textarea rows={5} placeholder="【料理名】
豚肉 200g
大根 半分
1. 炒めて煮る" value={recipeText} onChange={e => setRecipeText(e.target.value)} className="w-full bg-slate-50 border rounded-lg p-2 text-xs focus:outline-none" />
<button type="submit" className="w-full bg-slate-900 text-white font-bold py-2.5 rounded-lg text-xs">登録する</button>
</form>
</div>
</div>
)}
{/* ゴミ箱モーダル */}
{isTrashOpen && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
<div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-xl space-y-3">
<div className="flex justify-between items-center pb-2 border-b"><h3 className="font-bold text-sm">削除したレシピ</h3><button onClick={() => setIsTrashOpen(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
<div className="space-y-2 max-h-60 overflow-y-auto">
{trash.map(r => (
<div key={r.id} className="flex justify-between items-center p-2 bg-slate-50 rounded border text-xs">
<span>{r.title}</span>
<button onClick={() => handleRestoreRecipe(r.id)} className="bg-white border px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />復元</button>
</div>
))}
</div>
</div>
</div>
)}
{/* フッターナビ */}
<nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around py-2 px-3 z-40">
<button onClick={() => setCurrentTab('schedule')} className={⁠flex flex-col items-center flex-1 py-1 ${currentTab === 'schedule' ? 'text-slate-900 font-bold' : 'text-slate-400'}⁠}>
<CalendarIcon className="w-5 h-5" /><span className="text-[11px] mt-0.5">スケジュール</span>
</button>
<button onClick={() => setCurrentTab('todo')} className={⁠flex flex-col items-center flex-1 py-1 ${currentTab === 'todo' ? 'text-slate-900 font-bold' : 'text-slate-400'}⁠}>
<div className="relative">
<CheckSquare className="w-5 h-5" />
{todos.filter(t => !t.done).length > 0 && (
<span className="absolute -top-1 -right-2 bg-slate-800 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{todos.filter(t => !t.done).length}</span>
)}
</div>
<span className="text-[11px] mt-0.5">買い出しToDo</span>
</button>
<button onClick={() => setCurrentTab('recipe')} className={⁠flex flex-col items-center flex-1 py-1 ${currentTab === 'recipe' ? 'text-slate-900 font-bold' : 'text-slate-400'}⁠}>
<BookOpen className="w-5 h-5" /><span className="text-[11px] mt-0.5">レシピ帳</span>
</button>
</nav>
</div>
</div>
);
}
