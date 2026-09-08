import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
getAuth,
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
CheckCircle2,
AlertCircle
} from 'lucide-react';
/* ==========================================================================
【設定エリア】ご自身のFirebase設定をお持ちの場合はここに貼り付けます
※ 未設定でもスマホ本体（端末内）に100%確実に自動保存されます。
========================================================================== /
const FIREBASE_CONFIG = null;
/ 設定例:
const FIREBASE_CONFIG = {
apiKey: "AIzaSy...",
authDomain: "futari-note.firebaseapp.com",
projectId: "futari-note",
storageBucket: "futari-note.appspot.com",
messagingSenderId: "123456789",
appId: "1:123456789:web:abcdef"
};
*/
let app = null;
let auth = null;
let db = null;
if (FIREBASE_CONFIG && !getApps().length) {
try {
app = initializeApp(FIREBASE_CONFIG);
auth = getAuth(app);
db = getFirestore(app);
} catch (e) {
console.error("Firebase init failed:", e);
}
}
// --- 食材・消耗品のベクターイラスト ---
function ItemIllustration({ name = '', className = "w-6 h-6" }) {
const t = (name || '').toLowerCase();
if (t.includes('米') || t.includes('ごはん') || t.includes('ライス')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M6 3h12l2 6v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9l2-6z" fill="#FEF3C7" stroke="#D97706" />
<ellipse cx="12" cy="14" rx="3" ry="4" fill="#FFFFFF" stroke="#D97706" />
</svg>
);
}
if (t.includes('肉') || t.includes('牛') || t.includes('豚') || t.includes('鶏') || t.includes('ステーキ') || t.includes('ハム') || t.includes('ソーセージ')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M17 4c-4-1.5-9 1-11 3-3 3-2 8 0 11 2.5 3 8 4 12 1.5 4-2.5 4.5-7 3-11-.8-2.2-2-3.8-4-4.5z" fill="#FECDD3" stroke="#E11D48" />
<circle cx="15.5" cy="9.5" r="2" fill="#FFFFFF" stroke="#BE123C" />
</svg>
);
}
if (t.includes('魚') || t.includes('鮭') || t.includes('サケ') || t.includes('マグロ') || t.includes('ツナ') || t.includes('エビ')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M3 12c5-5 14-5 18 0-4 5-13 5-18 0z" fill="#BAE6FD" stroke="#0284C7" />
<circle cx="6.5" cy="11.5" r="1" fill="#0369A1" />
</svg>
);
}
if (t.includes('野菜') || t.includes('トマト') || t.includes('玉ねぎ') || t.includes('たまねぎ') || t.includes('人参') || t.includes('キャベツ') || t.includes('大根')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<circle cx="12" cy="14" r="7" fill="#FECDD3" stroke="#E11D48" />
<path d="M12 7V3m-3 3c1-2 2-2 3-2s2 0 3 2" stroke="#16A34A" strokeWidth="2" />
</svg>
);
}
if (t.includes('卵') || t.includes('たまご')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M9 21c-3.5 0-6-3.5-6-8 0-4.5 3-10 6-10s6 5.5 6 10c0 4.5-2.5 8-6 8z" fill="#FEF3C7" stroke="#D97706" />
<path d="M16 21c-2.5 0-4.5-2.5-4.5-6 0-3 2-7.5 4.5-7.5s4.5 4.5 4.5 7.5c0 3.5-2 6-4.5 6z" fill="#FFFBEB" stroke="#B45309" />
</svg>
);
}
if (t.includes('牛乳') || t.includes('ミルク') || t.includes('豆乳') || t.includes('ヨーグルト')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M8 3h8l2 3v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6l2-3z" fill="#E0F2FE" stroke="#0284C7" />
<rect x="9" y="11" width="6" height="5" rx="1" fill="#38BDF8" stroke="#0284C7" />
</svg>
);
}
if (t.includes('パン') || t.includes('食パン')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<path d="M5 9c0-3 2.5-5 5.5-5 1.5 0 3 .8 3.5.8s2-.8 3.5-.8C20.5 4 23 6 23 9c0 2-.8 3.5-1.5 4.2V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-5.8C5.2 12.5 5 11 5 9z" fill="#FDE68A" stroke="#B45309" />
</svg>
);
}
if (t.includes('ペーパー') || t.includes('ティッシュ') || t.includes('紙')) {
return (
<svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
<ellipse cx="11" cy="7" rx="6" ry="3" fill="#F1F5F9" stroke="#475569" />
<path d="M5 7v10c0 1.7 2.7 3 6 3s6-1.3 6-3V7" fill="#F8FAFC" stroke="#475569" />
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
btnActive: 'bg-blue-600 text-white',
},
'妻': {
badge: 'bg-rose-100 text-rose-800 border-rose-300',
border: 'border-l-4 border-l-rose-500',
cellBar: 'bg-rose-100 text-rose-800 border-l-2 border-rose-500',
btnActive: 'bg-rose-600 text-white',
},
'共通': {
badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
border: 'border-l-4 border-l-emerald-500',
cellBar: 'bg-emerald-100 text-emerald-800 border-l-2 border-emerald-500',
btnActive: 'bg-emerald-600 text-white',
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
}, 2500);
};
// --- ローカルストレージ復元ヘルパー ---
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
console.warn("Storage save error:", e);
}
};
// --- 日付管理 ---
const today = new Date();
const todayStr = ⁠${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}⁠;
const [selectedDate, setSelectedDate] = useState(todayStr);
const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
// --- 状態管理（ローカルストレージから確実に初期化） ---
const [schedules, setSchedules] = useState(() => loadLocal('schedules', []));
const [todos, setTodos] = useState(() => loadLocal('todos', []));
const [recipes, setRecipes] = useState(() => loadLocal('recipes', []));
const [deletedRecipes, setDeletedRecipes] = useState(() => loadLocal('trash', []));
const [itemCounts, setItemCounts] = useState(() => loadLocal('frequent', {
'牛乳': { count: 3, category: '冷蔵庫', author: '共通' },
'たまご': { count: 3, category: '冷蔵庫', author: '共通' },
'お米': { count: 2, category: '食材', author: '妻' },
'トイレットペーパー': { count: 2, category: '日用品', author: '夫' },
}));
// --- 変更があったら端末に即座に保存 ---
useEffect(() => saveLocal('schedules', schedules), [schedules]);
useEffect(() => saveLocal('todos', todos), [todos]);
useEffect(() => saveLocal('recipes', recipes), [recipes]);
useEffect(() => saveLocal('trash', deletedRecipes), [deletedRecipes]);
useEffect(() => saveLocal('frequent', itemCounts), [itemCounts]);
// --- モーダル・入力ステート ---
const [isAddScheduleOpen, setIsAddScheduleOpen] = useState(false);
const [newScheduleTitle, setNewScheduleTitle] = useState('');
const [newScheduleStartDate, setNewScheduleStartDate] = useState(todayStr);
const [newScheduleEndDate, setNewScheduleEndDate] = useState(todayStr);
const [newScheduleStartTime, setNewScheduleStartTime] = useState('');
const [newScheduleEndTime, setNewScheduleEndTime] = useState('');
const [newScheduleAuthor, setNewScheduleAuthor] = useState('夫');
const [newScheduleMemo, setNewScheduleMemo] = useState('');
const [isAddTodoOpen, setIsAddTodoOpen] = useState(false);
const [newTodoName, setNewTodoName] = useState('');
const [newTodoCategory, setNewTodoCategory] = useState('冷蔵庫');
const [newTodoAuthor, setNewTodoAuthor] = useState('妻');
const [isTrashOpen, setIsTrashOpen] = useState(false);
const [expandedRecipeId, setExpandedRecipeId] = useState(null);
const [recipeDetailTab, setRecipeDetailTab] = useState('ingredients');
const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
const [isAiModalOpen, setIsAiModalOpen] = useState(false);
const [aiInputText, setAiInputText] = useState('');
const [isAiLoading, setIsAiLoading] = useState(false);
const [previewRecipe, setPreviewRecipe] = useState(null);
const [editingRecipe, setEditingRecipe] = useState(null);
// カレンダー計算
const currentYear = viewDate.getFullYear();
const currentMonth = viewDate.getMonth();
const firstDay = new Date(currentYear, currentMonth, 1).getDay();
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
const handlePrevMonth = () => setViewDate(new Date(currentYear, currentMonth - 1, 1));
const handleNextMonth = () => setViewDate(new Date(currentYear, currentMonth + 1, 1));
// --- Firebase認証＆リアルタイム同期（設定時のみ起動） ---
useEffect(() => {
if (!auth) return;
signInAnonymously(auth).catch(err => console.error("Anonymous auth error:", err));
const unsub = onAuthStateChanged(auth, setCurrentUser);
return () => unsub();
}, []);
useEffect(() => {
if (!currentUser || !db) return;
const unsubSched = onSnapshot(collection(db, 'schedules'), (snap) => {
const list = [];
snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
setSchedules(list);
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
setDeletedRecipes(list);
});
return () => {
unsubSched();
unsubTodos();
unsubRecipes();
unsubTrash();
};
}, [currentUser]);
// ==========================================
// スケジュール操作
// ==========================================
const handleCreateSchedule = async (e) => {
e.preventDefault();
if (!newScheduleTitle.trim()) return;
const validEndDate = newScheduleEndDate < newScheduleStartDate ? newScheduleStartDate : newScheduleEndDate;
const item = {
id: 'sch-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
startDate: newScheduleStartDate,
endDate: validEndDate,
startTime: newScheduleStartTime || '',
endTime: newScheduleEndTime || '',
title: newScheduleTitle.trim(),
author: newScheduleAuthor,
memo: newScheduleMemo.trim()
};
// 画面・ローカルに即時反映
setSchedules((prev) => [...prev, item]);
// クラウド同期
if (db && currentUser) {
try {
await setDoc(doc(db, 'schedules', item.id), item);
} catch (err) {
console.error("Cloud save error:", err);
}
}
setNewScheduleTitle('');
setNewScheduleMemo('');
setNewScheduleStartTime('');
setNewScheduleEndTime('');
setIsAddScheduleOpen(false);
showToast('予定を登録しました');
};
const handleDeleteSchedule = async (id, e) => {
e?.stopPropagation();
// 画面・ローカルから即時消去
setSchedules((prev) => prev.filter((s) => s.id !== id));
showToast('予定を削除しました');
if (db && currentUser) {
try {
await deleteDoc(doc(db, 'schedules', id));
} catch (err) {
console.error("Cloud delete error:", err);
}
}
};
const selectedDaySchedules = useMemo(() => {
return schedules
.filter((s) => {
const start = s.startDate;
const end = s.endDate || s.startDate;
return selectedDate >= start && selectedDate <= end;
})
.sort((a, b) => (a.startTime || '99:99').localeCompare(b.startTime || '99:99'));
}, [schedules, selectedDate]);
const monthAllSchedules = useMemo(() => {
const monthStartStr = ⁠${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01⁠;
const monthEndStr = ⁠${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}⁠;
return schedules
.filter((s) => {
const start = s.startDate;
const end = s.endDate || s.startDate;
return start <= monthEndStr && end >= monthStartStr;
})
.sort((a, b) => {
if (a.startDate !== b.startDate) return a.startDate.localeCompare(b.startDate);
return (a.startTime || '99:99').localeCompare(b.startTime || '99:99');
});
}, [schedules, currentYear, currentMonth, daysInMonth]);
// ==========================================
// 買い出しToDo操作
// ==========================================
const recordItemFrequency = (name, category, author) => {
const trimmed = name.trim();
if (!trimmed) return;
setItemCounts((prev) => {
const current = prev[trimmed] || { count: 0, category, author };
return {
...prev,
[trimmed]: {
count: current.count + 1,
category,
author: author || current.author
}
};
});
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
// 即時反映
setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: newDone } : t)));
if (db && currentUser) {
try {
await updateDoc(doc(db, 'todos', id), { done: newDone });
} catch (err) {
console.error(err);
}
}
};
const handleDeleteTodo = async (id, e) => {
e?.stopPropagation();
// 即時消去
setTodos((prev) => prev.filter((t) => t.id !== id));
showToast('項目を削除しました');
if (db && currentUser) {
try {
await deleteDoc(doc(db, 'todos', id));
} catch (err) {
console.error(err);
}
}
};
const handleQuickAdd = async (presetItem) => {
const existing = todos.find((t) => t.name === presetItem.name && !t.done);
if (existing) {
showToast(⁠「${presetItem.name}」は既にリストにあります⁠);
return;
}
const item = {
id: 'td-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
name: presetItem.name,
category: presetItem.category || 'その他',
author: '共通',
done: false,
};
recordItemFrequency(presetItem.name, item.category, '共通');
setTodos((prev) => [item, ...prev]);
if (db && currentUser) {
try {
await setDoc(doc(db, 'todos', item.id), item);
} catch (err) {
console.error(err);
}
}
showToast(⁠「${presetItem.name}」を追加しました⁠);
};
const handleCreateTodo = async (e) => {
e.preventDefault();
if (!newTodoName.trim()) return;
const trimmedName = newTodoName.trim();
const item = {
id: 'td-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
name: trimmedName,
category: newTodoCategory,
author: newTodoAuthor,
done: false
};
recordItemFrequency(trimmedName, newTodoCategory, newTodoAuthor);
setTodos((prev) => [item, ...prev]);
if (db && currentUser) {
try {
await setDoc(doc(db, 'todos', item.id), item);
} catch (err) {
console.error(err);
}
}
setNewTodoName('');
setIsAddTodoOpen(false);
showToast(⁠「${item.name}」を追加しました⁠);
};
const remainingTodos = useMemo(() => todos.filter((t) => !t.done), [todos]);
const completedTodos = useMemo(() => todos.filter((t) => t.done), [todos]);
// ==========================================
// レシピ帳操作
// ==========================================
const filteredRecipes = useMemo(() => {
const q = recipeSearchQuery.trim().toLowerCase();
if (!q) return recipes;
return recipes.filter((r) => {
const matchTitle = (r.title || '').toLowerCase().includes(q);
const matchIng = (r.ingredients || []).some((i) => (i.name || '').toLowerCase().includes(q));
const matchSeasoning = (r.seasonings || []).some((s) => (s.name || '').toLowerCase().includes(q));
return matchTitle || matchIng || matchSeasoning;
});
}, [recipes, recipeSearchQuery]);
const handleAddIngredientToTodo = async (ingName) => {
const exists = todos.find((t) => t.name === ingName && !t.done);
if (exists) {
showToast(⁠「${ingName}」は既に買い出しリストにあります⁠);
return;
}
const item = {
id: 'td-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
name: ingName,
category: '食材',
author: '共通',
done: false
};
recordItemFrequency(ingName, '食材', '共通');
setTodos((prev) => [item, ...prev]);
if (db && currentUser) {
try {
await setDoc(doc(db, 'todos', item.id), item);
} catch (err) {
console.error(err);
}
}
showToast(⁠「${ingName}」を買い出しに追加しました⁠);
};
const handleExecuteDeleteRecipe = async (recipeId) => {
const target = recipes.find((r) => r.id === recipeId);
if (!target) return;
const trashItem = {
...target,
deletedAt: Date.now(),
expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
};
setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
setDeletedRecipes((prev) => [trashItem, ...prev]);
setEditingRecipe(null);
showToast(⁠「${target.title}」をゴミ箱へ移動しました⁠);
if (db && currentUser) {
try {
await deleteDoc(doc(db, 'recipes', recipeId));
await setDoc(doc(db, 'trash', recipeId), trashItem);
} catch (err) {
console.error(err);
}
}
};
const handleRestoreRecipe = async (recipeId) => {
const target = deletedRecipes.find((r) => r.id === recipeId);
if (!target) return;
const { deletedAt, expiresAt, ...restored } = target;
setDeletedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
setRecipes((prev) => [restored, ...prev]);
showToast(⁠「${restored.title}」を復元しました⁠);
if (db && currentUser) {
try {
await deleteDoc(doc(db, 'trash', recipeId));
await setDoc(doc(db, 'recipes', recipeId), restored);
} catch (err) {
console.error(err);
}
}
};
// スマート解析（AIキーなしでもテキストから自動分解する安心設計）
const handleParseRecipeText = () => {
if (!aiInputText.trim()) return;
setIsAiLoading(true);
setTimeout(() => {
const lines = aiInputText.split('\n').map(l => l.trim()).filter(Boolean);
let title = 'おすすめレシピ';
const ingredients = [];
const seasonings = [];
const steps = [];
// 簡易キーワード抽出
lines.forEach((line) => {
if (line.startsWith('http')) return;
if (line.includes('【') && line.includes('】')) {
title = line.replace(/【|】/g, '');
return;
}
// 調味料判定
const isSeasoning = /醤油|しょうゆ|みりん|酒|塩|砂糖|油|マヨ|ケチャップ|酢|だしの素|コンソメ|胡椒|こしょう/i.test(line);
// 分量分離（スペースや記号で分割）
const parts = line.replace(/[・-]/g, '').trim().split(/\s+/);
if (parts.length >= 2) {
const item = { name: parts[0], amount: parts.slice(1).join(' ') };
if (isSeasoning) seasonings.push(item);
else ingredients.push(item);
} else if (line.length > 2 && !line.includes('作り方') && !line.includes('材料')) {
if (steps.length < 6 && (line.match(/^[0-9]/) || line.includes('する') || line.includes('炒める') || line.includes('煮る'))) {
steps.push(line.replace(/^[0-9]+[.、)\s]/, ''));
} else {
ingredients.push({ name: line, amount: '適量' });
}
}
});
if (ingredients.length === 0) {
ingredients.push({ name: '食材', amount: '適量' });
}
setPreviewRecipe({
id: 'rc-' + Date.now(),
title: title || '新しいレシピ',
author: '共通',
sourceUrl: aiInputText.match(/https?://[^\s]+/)?.[0] || '',
ingredients: ingredients.slice(0, 15),
seasonings: seasonings.slice(0, 15),
steps: steps.length > 0 ? steps : ['材料を準備して加熱調理する。', '味を調えて盛り付ける。']
});
setIsAiLoading(false);
setIsAiModalOpen(false);
setAiInputText('');
}, 400);
};
const handleSavePreviewRecipe = async () => {
if (!previewRecipe) return;
setRecipes((prev) => [previewRecipe, ...prev]);
setExpandedRecipeId(previewRecipe.id);
if (db && currentUser) {
try {
await setDoc(doc(db, 'recipes', previewRecipe.id), previewRecipe);
} catch (err) {
console.error(err);
}
}
setPreviewRecipe(null);
showToast(⁠「${previewRecipe.title}」を登録しました⁠);
};
const handleSaveEditedRecipe = async (e) => {
e.preventDefault();
if (!editingRecipe) return;
setRecipes((prev) => prev.map((r) => (r.id === editingRecipe.id ? editingRecipe : r)));
if (db && currentUser) {
try {
await setDoc(doc(db, 'recipes', editingRecipe.id), editingRecipe);
} catch (err) {
console.error(err);
}
}
setEditingRecipe(null);
showToast('レシピを更新しました');
};
return (
<div className="min-h-screen bg-slate-100 flex justify-center items-start text-slate-800 antialiased font-sans">
<div className="w-full max-w-md bg-white min-h-screen shadow-lg flex flex-col relative pb-24 select-none">
{/* --- ヘッダー --- */}
<header className="bg-slate-900 text-white px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-xs">
<div className="flex items-center gap-2">
<h1 className="text-base font-bold tracking-tight">ふたり手帳</h1>
{db && currentUser ? (
<span className="flex items-center gap-1 text-[10px] bg-emerald-950/80 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
<span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
リアルタイム同期中
</span>
) : (
<span className="flex items-center gap-1 text-[10px] bg-amber-950/80 text-amber-300 px-2 py-0.5 rounded-full border border-amber-700" title="この端末内に確実に自動保存されています">
<CheckCircle2 className="w-2.5 h-2.5 text-amber-400" />
端末保存中
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
<div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-xs px-4 py-2 rounded-lg shadow-lg border border-slate-700 animate-bounce">
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
className={⁠flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${ calendarViewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500' }⁠}
>
<CalendarDays className="w-3.5 h-3.5" />
月表示
</button>
<button
onClick={() => setCalendarViewMode('list')}
className={⁠flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition ${ calendarViewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500' }⁠}
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
<div key={⁠empty-${i}⁠} className="min-h-[56px] bg-slate-50/40 rounded-lg" />
))}
{Array.from({ length: daysInMonth }).map((_, i) => {
const dayNum = i + 1;
const dateStr = ⁠${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}⁠;
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
className={⁠min-h-[56px] p-0.5 rounded-lg flex flex-col justify-start items-stretch border transition cursor-pointer overflow-hidden ${ isSelected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : isToday ? 'border-amber-300 bg-amber-50/40' : 'border-slate-100 hover:border-slate-300 bg-white' }⁠}
>
<div className="flex justify-between items-center px-1">
<span className={⁠text-[11px] font-mono leading-none ${ isToday ? 'font-extrabold text-amber-600' : isSelected ? 'font-bold text-slate-900' : 'text-slate-600' }⁠}>
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
title={⁠${ev.author}: ${ev.title}⁠}
className={⁠text-[9px] px-1 py-0.5 rounded leading-tight truncate text-left font-medium ${style.cellBar}⁠}
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
<div className="py-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
{selectedDate} に予定はありません
</div>
) : (
<div className="space-y-2">
{selectedDaySchedules.map((item) => {
const style = AUTHOR_STYLES[item.author] || AUTHOR_STYLES['共通'];
const isMultiDay = item.endDate && item.endDate !== item.startDate;
const timeDisplay = item.startTime
? ⁠${item.startTime}${item.endTime ? ⁠ - ${item.endTime}⁠ : ''}⁠
: '終日';
return (
<div
key={item.id}
className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${style.border}⁠}
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
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}⁠}>
{item.author}
</span>
</div>
{item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
</div>
</div>
<button
onClick={(e) => handleDeleteSchedule(item.id, e)}
className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition"
title="予定を削除"
>
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
{currentYear}年{currentMonth + 1}月の全予定（{monthAllSchedules.length}件）
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
? ⁠${item.startTime}${item.endTime ? ⁠ - ${item.endTime}⁠ : ''}⁠
: '終日';
return (
<div
key={item.id}
className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between ${style.border}⁠}
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
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}⁠}>
{item.author}
</span>
</div>
{item.memo && <p className="text-xs text-slate-500 mt-0.5">{item.memo}</p>}
</div>
</div>
<button
onClick={(e) => handleDeleteSchedule(item.id, e)}
className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition"
title="予定を削除"
>
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
className={⁠text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition active:scale-95 ${ isAdded ? 'bg-slate-200 text-slate-400 border-slate-300 cursor-default' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 shadow-xs' }⁠}
>
<ItemIllustration name={item.name} className="w-4 h-4" />
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
className={⁠p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer active:bg-slate-50 transition ${style.border}⁠}
>
<div className="flex items-center gap-3">
<div className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-transparent hover:border-slate-500">
<Check className="w-3.5 h-3.5" />
</div>
<div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
<ItemIllustration name={item.name} className="w-5 h-5" />
</div>
<div>
<div className="flex items-center gap-2">
<span className="font-bold text-sm text-slate-900">{item.name}</span>
<span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
{item.category}
</span>
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}⁠}>
{item.author}
</span>
</div>
</div>
</div>
<button
onClick={(e) => handleDeleteTodo(item.id, e)}
className="p-2 text-slate-300 hover:text-rose-500 active:scale-90 transition"
title="項目を削除"
>
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
<ItemIllustration name={item.name} className="w-4 h-4 opacity-75" />
<span>{item.name}</span>
<span className="text-[10px]">({item.author})</span>
</div>
<button
onClick={(e) => handleDeleteTodo(item.id, e)}
className="p-1.5 text-slate-300 hover:text-rose-500 active:scale-90 transition"
title="削除"
>
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
<div className="font-bold text-xs">レシピのスマート自動登録</div>
<div className="text-[10px] text-slate-300">URLや概要欄のテキストから材料を自動抽出</div>
</div>
</div>
<Plus className="w-4 h-4 text-slate-300 shrink-0" />
</button>
</div>
<div className="space-y-2">
{filteredRecipes.length === 0 ? (
<div className="py-10 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
{recipeSearchQuery ? ⁠「${recipeSearchQuery}」に一致するレシピはありません⁠ : 'レシピはまだ登録されていません'}
</div>
) : (
filteredRecipes.map((recipe) => {
const isExpanded = expandedRecipeId === recipe.id;
const style = AUTHOR_STYLES[recipe.author] || AUTHOR_STYLES['共通'];
return (
<div
key={recipe.id}
className={⁠bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition ${style.border}⁠}
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
<span className={⁠text-[10px] px-1.5 py-0.2 rounded font-semibold border ${style.badge}⁠}>
{recipe.author}
</span>
</div>
<div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
<span>食材 {(recipe.ingredients || []).length}種</span>
<span>調味料 {(recipe.seasonings || []).length}種</span>
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
className={⁠flex-1 py-1.5 font-bold rounded-md transition ${ recipeDetailTab === 'ingredients' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500' }⁠}
>
食材・調味料
</button>
<button
onClick={() => setRecipeDetailTab('steps')}
className={⁠flex-1 py-1.5 font-bold rounded-md transition ${ recipeDetailTab === 'steps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500' }⁠}
>
作り方・手順 ({(recipe.steps || []).length})
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
{(recipe.ingredients || []).map((ing, idx) => (
<div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
<div className="flex items-center gap-2">
<ItemIllustration name={ing.name} className="w-4 h-4" />
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
{(recipe.seasonings || []).map((s, idx) => (
<div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/50 border border-amber-100/60 text-xs">
<div className="flex items-center gap-2">
<ItemIllustration name={s.name} className="w-4 h-4" />
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
{(recipe.steps || []).map((step, idx) => (
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
{/* --- モーダル: レシピ抽出・入力 --- */}
{isAiModalOpen && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
<div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
<div className="flex items-center justify-between pb-2 border-b border-slate-100">
<div className="flex items-center gap-1.5">
<Sparkles className="w-4 h-4 text-amber-500" />
<h3 className="font-bold text-sm text-slate-800">レシピのスマート自動登録</h3>
</div>
<button onClick={() => setIsAiModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
<X className="w-5 h-5" />
</button>
</div>
<div className="space-y-3 mt-3">
<p className="text-xs text-slate-500 leading-relaxed">
YouTube動画のURLや、概要欄の材料テキストを貼り付けてください。自動で食材や調味料に分解します。
</p>
<textarea
rows={6}
placeholder="例:
【豚バラ大根】
豚バラ肉 200g
大根 1/3本
醤油 大さじ2
みりん 大さじ2
酒 大さじ1"
value={aiInputText}
onChange={(e) => setAiInputText(e.target.value)}
className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:border-slate-800"
/>
<button
onClick={handleParseRecipeText}
disabled={isAiLoading || !aiInputText.trim()}
className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition"
>
{isAiLoading ? (
<>
<Loader2 className="w-4 h-4 animate-spin" />
<span>解析中...</span>
</>
) : (
<>
<Sparkles className="w-3.5 h-3.5 text-amber-300" />
<span>自動解析して確認へ進む</span>
</>
)}
</button>
</div>
</div>
</div>
)}
{/* --- モーダル: レシピ確認・微調整 --- */}
{previewRecipe && (
<div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
<div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-4 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
<div className="flex items-center justify-between pb-2 border-b border-slate-100">
<div>
<h3 className="font-bold text-sm text-slate-800">抽出結果の確認・微調整</h3>
<p className="text-[10px] text-slate-400">分量や品名に誤りがないか手直しできます</p>
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
<label className="text-[11px] font-bold text-slate-500 block mb-1">記入者</label>
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map((p) => (
<button
key={p}
type="button"
onClick={() => setPreviewRecipe({ ...previewRecipe, author: p })}
className={⁠py-1.5 text-xs font-bold rounded-lg border transition ${ previewRecipe.author === p ? AUTHOR_STYLES[p].btnActive : 'bg-slate-50 text-slate-600 border-slate-200' }⁠}
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
{/* --- モーダル: レシピ編集 --- */}
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
<label className="text-[11px] font-bold text-slate-500 block mb-1">記入者</label>
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map((p) => (
<button
key={p}
type="button"
onClick={() => setEditingRecipe({ ...editingRecipe, author: p })}
className={⁠py-1.5 text-xs font-bold rounded-lg border transition ${ editingRecipe.author === p ? AUTHOR_STYLES[p].btnActive : 'bg-slate-50 text-slate-600 border-slate-200' }⁠}
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
className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition shadow-xs"
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
<label className="text-[11px] font-bold text-slate-500 block mb-1">記入者</label>
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map((p) => (
<button
key={p}
type="button"
onClick={() => setNewScheduleAuthor(p)}
className={⁠py-2 text-xs font-bold rounded-lg border transition ${ newScheduleAuthor === p ? AUTHOR_STYLES[p].btnActive : 'bg-slate-50 text-slate-600 border-slate-200' }⁠}
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
placeholder="例: 旅行、出張、お迎え、予防接種"
value={newScheduleTitle}
onChange={(e) => setNewScheduleTitle(e.target.value)}
className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none"
/>
</div>
<div>
<label className="text-[11px] font-bold text-slate-500 block mb-1">日程</label>
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
placeholder="例: 夕飯不要、新幹線10時発"
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
{/* --- モーダル: 買い出しToDo追加 --- */}
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
<label className="text-[11px] font-bold text-slate-500 block mb-1">記入者</label>
<div className="grid grid-cols-3 gap-2">
{['夫', '妻', '共通'].map((p) => (
<button
key={p}
type="button"
onClick={() => setNewTodoAuthor(p)}
className={⁠py-2 text-xs font-bold rounded-lg border transition ${ newTodoAuthor === p ? AUTHOR_STYLES[p].btnActive : 'bg-slate-50 text-slate-600 border-slate-200' }⁠}
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
placeholder="例: オリーブオイル、お米、コンタクト液"
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
{/* --- 下部タブナビゲーション --- */}
<nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 flex justify-around py-2 px-3 z-40">
<button
onClick={() => setCurrentTab('schedule')}
className={⁠flex flex-col items-center justify-center flex-1 py-1 transition ${ currentTab === 'schedule' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600' }⁠}
>
<CalendarIcon className="w-5 h-5" />
<span className="text-[11px] mt-0.5">スケジュール</span>
</button>
<button
onClick={() => setCurrentTab('todo')}
className={⁠flex flex-col items-center justify-center flex-1 py-1 transition ${ currentTab === 'todo' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600' }⁠}
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
className={⁠flex flex-col items-center justify-center flex-1 py-1 transition ${ currentTab === 'recipe' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600' }⁠}
>
<BookOpen className="w-5 h-5" />
<span className="text-[11px] mt-0.5">レシピ帳</span>
</button>
</nav>
</div>
</div>
);
}
