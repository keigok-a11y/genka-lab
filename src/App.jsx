import { useState, useEffect, useRef, useMemo } from "react";

const STORAGE_KEY = "genka_materials_v1";
const SAVED_KEY = "genka_saved_v1";

const initialMaterials = [
  { id: 1,  name: "リーフティー モーニング",          unit: "g",   price: 9.8 },
  { id: 2,  name: "ハーブ 青",                        unit: "g",   price: 9.8 },
  { id: 3,  name: "ハーブ 赤",                        unit: "g",   price: 12.25 },
  { id: 4,  name: "ハーブ 青ゆず",                    unit: "g",   price: 35 },
  { id: 5,  name: "ジャスミン",                       unit: "g",   price: 9.8 },
  { id: 6,  name: "リーフティー 白桃",                unit: "g",   price: 12.25 },
  { id: 7,  name: "リーフティー ライチローズ",        unit: "g",   price: 12.25 },
  { id: 8,  name: "ハーブ シナモンローズレイボス",    unit: "g",   price: 14 },
  { id: 9,  name: "ティーバッグ 8種",                unit: "枚",  price: 56 },
  { id: 10, name: "リーフティー アッサム",            unit: "g",   price: 9.8 },
  { id: 11, name: "冷凍パイシート カット(8.3×18)",    unit: "枚",  price: 134 },
  { id: 12, name: "冷凍パイシート 未カット(49.8×36)", unit: "枚",  price: 1608 },
  { id: 13, name: "中沢 カスタード",                  unit: "g",   price: 1.2 },
  { id: 14, name: "根釧35%クリーム",                  unit: "ml",  price: 1.264 },
  { id: 15, name: "北海道十勝よつ葉牛乳",            unit: "ml",  price: 0.248 },
  { id: 16, name: "キッコーマン 調整豆乳 1L",        unit: "ml",  price: 0.265 },
  { id: 17, name: "よつ葉無塩バター",                unit: "g",   price: 2.013 },
  { id: 18, name: "よつ葉発酵バター",                unit: "g",   price: 2.08 },
  { id: 19, name: "よつ葉発酵シートバター",          unit: "g",   price: 1.9752 },
  { id: 20, name: "薄力粉 スーパーバイオレット",     unit: "g",   price: 0.224 },
  { id: 21, name: "強力粉 春よ恋",                   unit: "g",   price: 0.316 },
  { id: 22, name: "A卵",                             unit: "個",  price: 40 },
];

function useLocalStorage(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }, [key, value]);
  return [value, setValue];
}

function MaterialDropdown({ materials, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const filtered = useMemo(() =>
    materials.filter(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.unit.includes(query)),
    [materials, query]);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const select = m => { onSelect(m); setQuery(""); setOpen(false); };
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input style={styles.input} placeholder="🔍 原材料を検索・選択..." value={query}
        onFocus={() => setOpen(true)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }} />
      {open && (
        <div style={styles.dropdownList}>
          {filtered.length === 0
            ? <div style={styles.dropdownEmpty}>見つかりません</div>
            : filtered.map(m => (
              <div key={m.id} style={styles.dropdownItem} onClick={() => select(m)}
                onMouseEnter={e => e.currentTarget.style.background = "#f0f4ff"}
                onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <span style={{ fontWeight: 600 }}>{m.name}</span>
                <span style={{ color: "#888", fontSize: 12 }}>¥{m.price.toLocaleString()} / {m.unit}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      ...styles.tab,
      background: active ? "#1a1a2e" : "transparent",
      color: active ? "#e8d5ff" : "#666",
      borderBottom: active ? "2px solid #a78bfa" : "2px solid transparent",
    }}>{label}</button>
  );
}

export default function App() {
  const [materials, setMaterials] = useLocalStorage(STORAGE_KEY, initialMaterials);
  const [savedList, setSavedList] = useLocalStorage(SAVED_KEY, []);
  const [tab, setTab] = useState("calc");
  const [rows, setRows] = useState([{ matId: null, mat: null, qty: "" }]);
  const [sellingPrice, setSellingPrice] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [targetRate, setTargetRate] = useState("35");
  const [productName, setProductName] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [newPrice, setNewPrice] = useState("");
  const [editId, setEditId] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [masterSearch, setMasterSearch] = useState("");
  const [saveMsg, setSaveMsg] = useState(false);

  const totalCost = useMemo(() =>
    rows.reduce((sum, r) => (!r.mat || !r.qty) ? sum : sum + r.mat.price * parseFloat(r.qty || 0), 0),
    [rows]);
  const sellingRaw = parseFloat(sellingPrice) || 0;
  const selling = taxRate === "0" ? sellingRaw : sellingRaw / (1 + parseFloat(taxRate) / 100);
  const costRate = selling > 0 ? (totalCost / selling) * 100 : 0;
  const grossProfit = selling - totalCost;
  const suggestedPrice = totalCost > 0 ? Math.ceil(totalCost / (parseFloat(targetRate) / 100)) : 0;
  const rateColor = costRate === 0 ? "#aaa" : costRate <= 30 ? "#22c55e" : costRate <= 40 ? "#f59e0b" : "#ef4444";

  const addRow = () => setRows(r => [...r, { matId: null, mat: null, qty: "" }]);
  const removeRow = i =>
