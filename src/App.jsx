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
  const removeRow = i => setRows(r => r.filter((_, idx) => idx !== i));
  const setRowMat = (i, mat) => setRows(r => r.map((row, idx) => idx === i ? { ...row, mat, matId: mat.id } : row));
  const setRowQty = (i, qty) => setRows(r => r.map((row, idx) => idx === i ? { ...row, qty } : row));

  const addMaterial = () => {
    if (!newName || !newPrice) return;
    setMaterials(m => [...m, { id: Date.now(), name: newName, unit: newUnit, price: parseFloat(newPrice) }]);
    setNewName(""); setNewPrice("");
  };
  const deleteMaterial = id => {
    setMaterials(m => m.filter(x => x.id !== id));
    setRows(r => r.map(row => row.matId === id ? { matId: null, mat: null, qty: row.qty } : row));
  };
  const saveEdit = id => {
    setMaterials(m => m.map(x => x.id === id ? { ...x, price: parseFloat(editPrice) } : x));
    setRows(r => r.map(row => row.matId === id ? { ...row, mat: { ...row.mat, price: parseFloat(editPrice) } } : row));
    setEditId(null);
  };
  const filteredMaster = materials.filter(m => m.name.includes(masterSearch) || m.unit.includes(masterSearch));

  // 保存機能
  const saveCalc = () => {
    if (totalCost === 0) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      productName: productName || "（商品名なし）",
      rows: rows.filter(r => r.mat && r.qty).map(r => ({
        name: r.mat.name, unit: r.mat.unit, qty: r.qty,
        cost: r.mat.price * parseFloat(r.qty)
      })),
      totalCost,
      sellingRaw,
      selling,
      taxRate,
      costRate,
      grossProfit,
      targetRate,
      suggestedPrice,
    };
    setSavedList(l => [entry, ...l]);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };
  const deleteSaved = id => setSavedList(l => l.filter(x => x.id !== id));

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>⚖️ GenkaLab</div>
          <div style={styles.subtitle}>仕入れ原価管理・適正売価計算システム</div>
        </div>
      </div>
      <div style={styles.tabBar}>
        <Tab label="📊 原価計算" active={tab === "calc"} onClick={() => setTab("calc")} />
        <Tab label="📂 保存済み計算" active={tab === "saved"} onClick={() => setTab("saved")} />
        <Tab label="📦 原材料マスタ" active={tab === "master"} onClick={() => setTab("master")} />
      </div>
      <div style={styles.body}>

        {/* ══ 原価計算タブ ══ */}
        {tab === "calc" && (
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>🍽 商品名（任意）</div>
              <input style={styles.input} placeholder="例: チョコケーキ" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 使用原材料</div>
              {rows.map((row, i) => (
                <div key={i} style={styles.rowLine}>
                  <div style={{ flex: 2 }}>
                    {row.mat
                      ? <div style={styles.selectedMat}>
                          <span style={{ fontWeight: 600 }}>{row.mat.name}</span>
                          <span style={styles.matBadge}>¥{row.mat.price}/{row.mat.unit}</span>
                          <button style={styles.clearBtn} onClick={() => setRowMat(i, null)}>✕</button>
                        </div>
                      : <MaterialDropdown materials={materials} onSelect={m => setRowMat(i, m)} />}
                  </div>
                  <div style={{ flex: "0 0 120px" }}>
                    <input style={{ ...styles.input, textAlign: "right" }} type="number" min="0" step="0.001"
                      placeholder={row.mat ? `数量(${row.mat.unit})` : "数量"}
                      value={row.qty} onChange={e => setRowQty(i, e.target.value)} />
                  </div>
                  <div style={{ flex: "0 0 100px", textAlign: "right", color: row.mat && row.qty ? "#1a1a2e" : "#ccc", fontWeight: 600, fontSize: 13 }}>
                    {row.mat && row.qty ? `¥${(row.mat.price * parseFloat(row.qty)).toFixed(1)}` : "¥ —"}
                  </div>
                  {rows.length > 1 && <button style={styles.removeBtn} onClick={() => removeRow(i)}>🗑</button>}
                </div>
              ))}
              <button style={styles.addRowBtn} onClick={addRow}>＋ 原材料を追加</button>
            </div>
            <div style={styles.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "flex-end" }}>
                <div>
                  <div style={styles.cardTitle}>💴 販売価格（円）</div>
                  <input style={styles.input} type="number" min="0" placeholder="例: 580"
                    value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div>
                  <div style={styles.cardTitle}>消費税率</div>
                  <select style={{ ...styles.input, width: 120 }} value={taxRate} onChange={e => setTaxRate(e.target.value)}>
                    <option value="10">税込 10%</option>
                    <option value="8">税込 8%</option>
                    <option value="0">税抜きのまま</option>
                  </select>
                </div>
                <div>
                  <div style={styles.cardTitle}>🎯 目標原価率（%）</div>
                  <input style={styles.input} type="number" min="1" max="100" placeholder="例: 35"
                    value={targetRate} onChange={e => setTargetRate(e.target.value)} />
                </div>
              </div>
              {sellingRaw > 0 && taxRate !== "0" && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", background: "#f8f9fb", borderRadius: 8, padding: "6px 12px" }}>
                  税抜き換算：<span style={{ fontWeight: 700, color: "#1a1a2e" }}>¥{Math.round(selling).toLocaleString()}</span> で原価率を計算
                </div>
              )}
            </div>

            <div style={styles.resultCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={styles.resultTitle}>{productName ? `「${productName}」の` : ""}原価計算結果</div>
                <button onClick={saveCalc}
                  style={{
                    background: saveMsg ? "#4ade80" : "#a78bfa",
                    color: saveMsg ? "#14532d" : "white",
                    border: "none", borderRadius: 8, padding: "8px 16px",
                    fontWeight: 700, cursor: totalCost > 0 ? "pointer" : "not-allowed",
                    fontSize: 13, opacity: totalCost > 0 ? 1 : 0.4, transition: "all .3s"
                  }}>
                  {saveMsg ? "✓ 保存しました" : "💾 この計算を保存"}
                </button>
              </div>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>原材料費合計</div>
                  <div style={{ ...styles.resultValue, color: "#e8d5ff" }}>¥{totalCost.toFixed(1)}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>原価率（税抜）</div>
                  <div style={{ ...styles.resultValue, color: rateColor }}>{selling > 0 ? `${costRate.toFixed(1)}%` : "—"}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>粗利益（税抜）</div>
                  <div style={{ ...styles.resultValue, color: grossProfit >= 0 ? "#4ade80" : "#f87171" }}>
                    {selling > 0 ? `¥${Math.round(grossProfit).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>利益率（税抜）</div>
                  <div style={{ ...styles.resultValue, color: grossProfit >= 0 ? "#4ade80" : "#f87171" }}>
                    {selling > 0 ? `${((grossProfit / selling) * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
              {totalCost > 0 && (
                <div style={styles.suggestBox}>
                  <div style={styles.suggestLabel}>目標原価率 {targetRate}% での適正売値（税抜き）</div>
                  <div style={styles.suggestValue}>
                    ¥{suggestedPrice.toLocaleString()}
                    <span style={styles.suggestSub}>
                      {taxRate !== "0" ? `→ 税込${Math.round(suggestedPrice * (1 + parseFloat(taxRate) / 100)).toLocaleString()}円` : "税抜き参考値"}
                    </span>
                  </div>
                  {sellingRaw > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#9ca3af" }}>
                      現在の税抜き売値との差：
                      <span style={{ fontWeight: 700, color: selling >= suggestedPrice ? "#4ade80" : "#f87171" }}>
                        {selling >= suggestedPrice ? "+" : ""}{Math.round(selling - suggestedPrice).toLocaleString()}円
                      </span>
                      {selling < suggestedPrice ? " ← 値上げ推奨" : " ← 余裕あり"}
                    </div>
                  )}
                </div>
              )}
              {selling > 0 && totalCost > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>原価率ゲージ（税抜）</div>
                  <div style={styles.gauge}>
                    <div style={{ ...styles.gaugeBar, width: `${Math.min(costRate, 100)}%`, background: rateColor }} />
                    <div style={{ ...styles.gaugeTarget, left: `${Math.min(parseFloat(targetRate), 100)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    <span>0%</span><span style={{ color: "#a78bfa" }}>目標 {targetRate}%</span><span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ 保存済み計算タブ ══ */}
        {tab === "saved" && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "#6b7280" }}>
              保存した計算結果：{savedList.length}件
            </div>
            {savedList.length === 0 && (
              <div style={{ ...styles.card, textAlign: "center", color: "#aaa", padding: "40px 0" }}>
                保存済みの計算はありません。<br />
                原価計算タブで「💾 この計算を保存」を押してください。
              </div>
            )}
            {savedList.map(entry => (
              <div key={entry.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>{entry.productName}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{entry.date}</div>
                  </div>
                  <button style={styles.btnSmRed} onClick={() => deleteSaved(entry.id)}>削除</button>
                </div>
                {/* 原材料リスト */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <th style={styles.th}>原材料</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>数量</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.rows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={styles.td}>{r.name}</td>
                        <td style={{ ...styles.td, textAlign: "right", color: "#6b7280" }}>{r.qty}{r.unit}</td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}>¥{r.cost.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* 結果サマリ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "原材料費合計", value: `¥${entry.totalCost.toFixed(1)}`, color: "#1a1a2e" },
                    { label: "原価率（税抜）", value: entry.selling > 0 ? `${entry.costRate.toFixed(1)}%` : "—",
                      color: entry.costRate <= 30 ? "#16a34a" : entry.costRate <= 40 ? "#d97706" : "#dc2626" },
                    { label: "粗利益（税抜）", value: entry.selling > 0 ? `¥${Math.round(entry.grossProfit).toLocaleString()}` : "—",
                      color: entry.grossProfit >= 0 ? "#16a34a" : "#dc2626" },
                    { label: "販売価格", value: entry.sellingRaw > 0 ? `¥${entry.sellingRaw.toLocaleString()}` : "—", color: "#1a1a2e" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#f8f9fb", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {entry.sellingRaw > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    適正売値（目標{entry.targetRate}%）：
                    <span style={{ fontWeight: 700, color: "#1a1a2e" }}>¥{entry.suggestedPrice.toLocaleString()}</span>
                    {entry.taxRate !== "0" && ` → 税込¥${Math.round(entry.suggestedPrice * (1 + parseFloat(entry.taxRate) / 100)).toLocaleString()}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ 原材料マスタタブ ══ */}
        {tab === "master" && (
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>➕ 新規原材料を追加</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr auto", gap: 8, alignItems: "flex-end" }}>
                <div><label style={styles.label}>原材料名</label><input style={styles.input} placeholder="例: 薄力粉" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><label style={styles.label}>単位</label>
                  <select style={styles.input} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                    {["g","ml","kg","L","個","枚","本","袋","箱","缶"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={styles.label}>仕入れ価格（円/単位）</label>
                  <input style={styles.input} type="number" min="0" step="0.001" placeholder="例: 0.224"
                    value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addMaterial()} />
                </div>
                <button style={{ ...styles.btnPrimary, whiteSpace: "nowrap" }} onClick={addMaterial}>登録</button>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <input style={styles.input} placeholder="🔍 原材料を検索..." value={masterSearch} onChange={e => setMasterSearch(e.target.value)} />
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 登録済み原材料（{filteredMaster.length}件）</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={styles.th}>原材料名</th><th style={styles.th}>単位</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>仕入れ価格</th><th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaster.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={styles.td}>{m.name}</td>
                      <td style={styles.td}><span style={styles.unitBadge}>{m.unit}</span></td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {editId === m.id
                          ? <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              <input style={{ ...styles.input, width: 100, textAlign: "right" }} type="number" step="0.001"
                                value={editPrice} onChange={e => setEditPrice(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && saveEdit(m.id)} />
                              <button style={styles.btnSmGreen} onClick={() => saveEdit(m.id)}>保存</button>
                              <button style={styles.btnSmGray} onClick={() => setEditId(null)}>戻す</button>
                            </div>
                          : <span style={{ fontWeight: 700 }}>¥{m.price}/{m.unit}</span>}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button style={styles.btnSmBlue} onClick={() => { setEditId(m.id); setEditPrice(m.price); }}>編集</button>
                          <button style={styles.btnSmRed} onClick={() => deleteMaterial(m.id)}>削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMaster.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 14 }}>原材料が登録されていません</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif", minHeight: "100vh", background: "#f8f9fb", color: "#1a1a2e" },
  header: { background: "#1a1a2e", color: "white", padding: "16px 24px" },
  headerInner: { maxWidth: 860, margin: "0 auto" },
  logo: { fontSize: 22, fontWeight: 700 },
  subtitle: { fontSize: 12, color: "#a78bfa", marginTop: 2 },
  tabBar: { background: "#1a1a2e", borderBottom: "1px solid #2d2d4e", padding: "0 24px", display: "flex", gap: 4 },
  tab: { padding: "10px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  body: { maxWidth: 860, margin: "0 auto", padding: "20px 16px" },
  card: { background: "white", borderRadius: 12, padding: "16px 18px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.07)" },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#4b5563", marginBottom: 10 },
  input: { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "white", color: "#1a1a2e", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 },
  dropdownList: { position: "absolute", zIndex: 999, top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid #e5e7eb", borderRadius: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)" },
  dropdownItem: { padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  dropdownEmpty: { padding: "12px 14px", color: "#aaa", fontSize: 13 },
  rowLine: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
  selectedMat: { display: "flex", alignItems: "center", gap: 8, background: "#f0f4ff", border: "1.5px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", fontSize: 14 },
  matBadge: { background: "#e0e7ff", color: "#4338ca", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 },
  clearBtn: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 13 },
  removeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#d1d5db", flexShrink: 0 },
  addRowBtn: { marginTop: 4, background: "none", border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "7px 14px", color: "#9ca3af", cursor: "pointer", fontSize: 13, width: "100%" },
  resultCard: { background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)", color: "white", borderRadius: 14, padding: "20px 22px", boxShadow: "0 4px 20px rgba(26,26,46,.2)" },
  resultTitle: { fontSize: 14, color: "#a78bfa", fontWeight: 600 },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  resultItem: { background: "rgba(255,255,255,.06)", borderRadius: 10, padding: "12px 14px" },
  resultLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 6 },
  resultValue: { fontSize: 20, fontWeight: 700 },
  suggestBox: { background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.4)", borderRadius: 10, padding: "14px 16px" },
  suggestLabel: { fontSize: 12, color: "#c4b5fd", marginBottom: 6 },
  suggestValue: { fontSize: 26, fontWeight: 800, color: "#e8d5ff" },
  suggestSub: { fontSize: 12, fontWeight: 400, color: "#a78bfa", marginLeft: 8 },
  gauge: { height: 10, background: "rgba(255,255,255,.1)", borderRadius: 5, position: "relative" },
  gaugeBar: { height: "100%", borderRadius: 5, transition: "width .5s,background .5s" },
  gaugeTarget: { position: "absolute", top: -3, width: 2, height: 16, background: "#a78bfa", borderRadius: 1, transform: "translateX(-50%)" },
  th: { padding: "8px 10px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 600 },
  td: { padding: "10px 10px", fontSize: 14 },
  unitBadge: { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 8px", fontSize: 12 },
  btnPrimary: { background: "#1a1a2e", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnSmBlue: { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmRed: { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmGreen: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmGray: { background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
};import { useState, useEffect, useRef, useMemo } from "react";

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
  const removeRow = i => setRows(r => r.filter((_, idx) => idx !== i));
  const setRowMat = (i, mat) => setRows(r => r.map((row, idx) => idx === i ? { ...row, mat, matId: mat.id } : row));
  const setRowQty = (i, qty) => setRows(r => r.map((row, idx) => idx === i ? { ...row, qty } : row));

  const addMaterial = () => {
    if (!newName || !newPrice) return;
    setMaterials(m => [...m, { id: Date.now(), name: newName, unit: newUnit, price: parseFloat(newPrice) }]);
    setNewName(""); setNewPrice("");
  };
  const deleteMaterial = id => {
    setMaterials(m => m.filter(x => x.id !== id));
    setRows(r => r.map(row => row.matId === id ? { matId: null, mat: null, qty: row.qty } : row));
  };
  const saveEdit = id => {
    setMaterials(m => m.map(x => x.id === id ? { ...x, price: parseFloat(editPrice) } : x));
    setRows(r => r.map(row => row.matId === id ? { ...row, mat: { ...row.mat, price: parseFloat(editPrice) } } : row));
    setEditId(null);
  };
  const filteredMaster = materials.filter(m => m.name.includes(masterSearch) || m.unit.includes(masterSearch));

  // 保存機能
  const saveCalc = () => {
    if (totalCost === 0) return;
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("ja-JP"),
      productName: productName || "（商品名なし）",
      rows: rows.filter(r => r.mat && r.qty).map(r => ({
        name: r.mat.name, unit: r.mat.unit, qty: r.qty,
        cost: r.mat.price * parseFloat(r.qty)
      })),
      totalCost,
      sellingRaw,
      selling,
      taxRate,
      costRate,
      grossProfit,
      targetRate,
      suggestedPrice,
    };
    setSavedList(l => [entry, ...l]);
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  };
  const deleteSaved = id => setSavedList(l => l.filter(x => x.id !== id));

  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>⚖️ GenkaLab</div>
          <div style={styles.subtitle}>仕入れ原価管理・適正売価計算システム</div>
        </div>
      </div>
      <div style={styles.tabBar}>
        <Tab label="📊 原価計算" active={tab === "calc"} onClick={() => setTab("calc")} />
        <Tab label="📂 保存済み計算" active={tab === "saved"} onClick={() => setTab("saved")} />
        <Tab label="📦 原材料マスタ" active={tab === "master"} onClick={() => setTab("master")} />
      </div>
      <div style={styles.body}>

        {/* ══ 原価計算タブ ══ */}
        {tab === "calc" && (
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>🍽 商品名（任意）</div>
              <input style={styles.input} placeholder="例: チョコケーキ" value={productName} onChange={e => setProductName(e.target.value)} />
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 使用原材料</div>
              {rows.map((row, i) => (
                <div key={i} style={styles.rowLine}>
                  <div style={{ flex: 2 }}>
                    {row.mat
                      ? <div style={styles.selectedMat}>
                          <span style={{ fontWeight: 600 }}>{row.mat.name}</span>
                          <span style={styles.matBadge}>¥{row.mat.price}/{row.mat.unit}</span>
                          <button style={styles.clearBtn} onClick={() => setRowMat(i, null)}>✕</button>
                        </div>
                      : <MaterialDropdown materials={materials} onSelect={m => setRowMat(i, m)} />}
                  </div>
                  <div style={{ flex: "0 0 120px" }}>
                    <input style={{ ...styles.input, textAlign: "right" }} type="number" min="0" step="0.001"
                      placeholder={row.mat ? `数量(${row.mat.unit})` : "数量"}
                      value={row.qty} onChange={e => setRowQty(i, e.target.value)} />
                  </div>
                  <div style={{ flex: "0 0 100px", textAlign: "right", color: row.mat && row.qty ? "#1a1a2e" : "#ccc", fontWeight: 600, fontSize: 13 }}>
                    {row.mat && row.qty ? `¥${(row.mat.price * parseFloat(row.qty)).toFixed(1)}` : "¥ —"}
                  </div>
                  {rows.length > 1 && <button style={styles.removeBtn} onClick={() => removeRow(i)}>🗑</button>}
                </div>
              ))}
              <button style={styles.addRowBtn} onClick={addRow}>＋ 原材料を追加</button>
            </div>
            <div style={styles.card}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "flex-end" }}>
                <div>
                  <div style={styles.cardTitle}>💴 販売価格（円）</div>
                  <input style={styles.input} type="number" min="0" placeholder="例: 580"
                    value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div>
                  <div style={styles.cardTitle}>消費税率</div>
                  <select style={{ ...styles.input, width: 120 }} value={taxRate} onChange={e => setTaxRate(e.target.value)}>
                    <option value="10">税込 10%</option>
                    <option value="8">税込 8%</option>
                    <option value="0">税抜きのまま</option>
                  </select>
                </div>
                <div>
                  <div style={styles.cardTitle}>🎯 目標原価率（%）</div>
                  <input style={styles.input} type="number" min="1" max="100" placeholder="例: 35"
                    value={targetRate} onChange={e => setTargetRate(e.target.value)} />
                </div>
              </div>
              {sellingRaw > 0 && taxRate !== "0" && (
                <div style={{ marginTop: 10, fontSize: 12, color: "#6b7280", background: "#f8f9fb", borderRadius: 8, padding: "6px 12px" }}>
                  税抜き換算：<span style={{ fontWeight: 700, color: "#1a1a2e" }}>¥{Math.round(selling).toLocaleString()}</span> で原価率を計算
                </div>
              )}
            </div>

            <div style={styles.resultCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={styles.resultTitle}>{productName ? `「${productName}」の` : ""}原価計算結果</div>
                <button onClick={saveCalc}
                  style={{
                    background: saveMsg ? "#4ade80" : "#a78bfa",
                    color: saveMsg ? "#14532d" : "white",
                    border: "none", borderRadius: 8, padding: "8px 16px",
                    fontWeight: 700, cursor: totalCost > 0 ? "pointer" : "not-allowed",
                    fontSize: 13, opacity: totalCost > 0 ? 1 : 0.4, transition: "all .3s"
                  }}>
                  {saveMsg ? "✓ 保存しました" : "💾 この計算を保存"}
                </button>
              </div>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>原材料費合計</div>
                  <div style={{ ...styles.resultValue, color: "#e8d5ff" }}>¥{totalCost.toFixed(1)}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>原価率（税抜）</div>
                  <div style={{ ...styles.resultValue, color: rateColor }}>{selling > 0 ? `${costRate.toFixed(1)}%` : "—"}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>粗利益（税抜）</div>
                  <div style={{ ...styles.resultValue, color: grossProfit >= 0 ? "#4ade80" : "#f87171" }}>
                    {selling > 0 ? `¥${Math.round(grossProfit).toLocaleString()}` : "—"}
                  </div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>利益率（税抜）</div>
                  <div style={{ ...styles.resultValue, color: grossProfit >= 0 ? "#4ade80" : "#f87171" }}>
                    {selling > 0 ? `${((grossProfit / selling) * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
              </div>
              {totalCost > 0 && (
                <div style={styles.suggestBox}>
                  <div style={styles.suggestLabel}>目標原価率 {targetRate}% での適正売値（税抜き）</div>
                  <div style={styles.suggestValue}>
                    ¥{suggestedPrice.toLocaleString()}
                    <span style={styles.suggestSub}>
                      {taxRate !== "0" ? `→ 税込${Math.round(suggestedPrice * (1 + parseFloat(taxRate) / 100)).toLocaleString()}円` : "税抜き参考値"}
                    </span>
                  </div>
                  {sellingRaw > 0 && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#9ca3af" }}>
                      現在の税抜き売値との差：
                      <span style={{ fontWeight: 700, color: selling >= suggestedPrice ? "#4ade80" : "#f87171" }}>
                        {selling >= suggestedPrice ? "+" : ""}{Math.round(selling - suggestedPrice).toLocaleString()}円
                      </span>
                      {selling < suggestedPrice ? " ← 値上げ推奨" : " ← 余裕あり"}
                    </div>
                  )}
                </div>
              )}
              {selling > 0 && totalCost > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>原価率ゲージ（税抜）</div>
                  <div style={styles.gauge}>
                    <div style={{ ...styles.gaugeBar, width: `${Math.min(costRate, 100)}%`, background: rateColor }} />
                    <div style={{ ...styles.gaugeTarget, left: `${Math.min(parseFloat(targetRate), 100)}%` }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    <span>0%</span><span style={{ color: "#a78bfa" }}>目標 {targetRate}%</span><span>100%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ 保存済み計算タブ ══ */}
        {tab === "saved" && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: "#6b7280" }}>
              保存した計算結果：{savedList.length}件
            </div>
            {savedList.length === 0 && (
              <div style={{ ...styles.card, textAlign: "center", color: "#aaa", padding: "40px 0" }}>
                保存済みの計算はありません。<br />
                原価計算タブで「💾 この計算を保存」を押してください。
              </div>
            )}
            {savedList.map(entry => (
              <div key={entry.id} style={styles.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>{entry.productName}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{entry.date}</div>
                  </div>
                  <button style={styles.btnSmRed} onClick={() => deleteSaved(entry.id)}>削除</button>
                </div>
                {/* 原材料リスト */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 10 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <th style={styles.th}>原材料</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>数量</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.rows.map((r, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}>
                        <td style={styles.td}>{r.name}</td>
                        <td style={{ ...styles.td, textAlign: "right", color: "#6b7280" }}>{r.qty}{r.unit}</td>
                        <td style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}>¥{r.cost.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* 結果サマリ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "原材料費合計", value: `¥${entry.totalCost.toFixed(1)}`, color: "#1a1a2e" },
                    { label: "原価率（税抜）", value: entry.selling > 0 ? `${entry.costRate.toFixed(1)}%` : "—",
                      color: entry.costRate <= 30 ? "#16a34a" : entry.costRate <= 40 ? "#d97706" : "#dc2626" },
                    { label: "粗利益（税抜）", value: entry.selling > 0 ? `¥${Math.round(entry.grossProfit).toLocaleString()}` : "—",
                      color: entry.grossProfit >= 0 ? "#16a34a" : "#dc2626" },
                    { label: "販売価格", value: entry.sellingRaw > 0 ? `¥${entry.sellingRaw.toLocaleString()}` : "—", color: "#1a1a2e" },
                  ].map((item, i) => (
                    <div key={i} style={{ background: "#f8f9fb", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {entry.sellingRaw > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    適正売値（目標{entry.targetRate}%）：
                    <span style={{ fontWeight: 700, color: "#1a1a2e" }}>¥{entry.suggestedPrice.toLocaleString()}</span>
                    {entry.taxRate !== "0" && ` → 税込¥${Math.round(entry.suggestedPrice * (1 + parseFloat(entry.taxRate) / 100)).toLocaleString()}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ══ 原材料マスタタブ ══ */}
        {tab === "master" && (
          <div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>➕ 新規原材料を追加</div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr auto", gap: 8, alignItems: "flex-end" }}>
                <div><label style={styles.label}>原材料名</label><input style={styles.input} placeholder="例: 薄力粉" value={newName} onChange={e => setNewName(e.target.value)} /></div>
                <div><label style={styles.label}>単位</label>
                  <select style={styles.input} value={newUnit} onChange={e => setNewUnit(e.target.value)}>
                    {["g","ml","kg","L","個","枚","本","袋","箱","缶"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div><label style={styles.label}>仕入れ価格（円/単位）</label>
                  <input style={styles.input} type="number" min="0" step="0.001" placeholder="例: 0.224"
                    value={newPrice} onChange={e => setNewPrice(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addMaterial()} />
                </div>
                <button style={{ ...styles.btnPrimary, whiteSpace: "nowrap" }} onClick={addMaterial}>登録</button>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <input style={styles.input} placeholder="🔍 原材料を検索..." value={masterSearch} onChange={e => setMasterSearch(e.target.value)} />
            </div>
            <div style={styles.card}>
              <div style={styles.cardTitle}>📋 登録済み原材料（{filteredMaster.length}件）</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                    <th style={styles.th}>原材料名</th><th style={styles.th}>単位</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>仕入れ価格</th><th style={styles.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMaster.map(m => (
                    <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={styles.td}>{m.name}</td>
                      <td style={styles.td}><span style={styles.unitBadge}>{m.unit}</span></td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {editId === m.id
                          ? <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              <input style={{ ...styles.input, width: 100, textAlign: "right" }} type="number" step="0.001"
                                value={editPrice} onChange={e => setEditPrice(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && saveEdit(m.id)} />
                              <button style={styles.btnSmGreen} onClick={() => saveEdit(m.id)}>保存</button>
                              <button style={styles.btnSmGray} onClick={() => setEditId(null)}>戻す</button>
                            </div>
                          : <span style={{ fontWeight: 700 }}>¥{m.price}/{m.unit}</span>}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button style={styles.btnSmBlue} onClick={() => { setEditId(m.id); setEditPrice(m.price); }}>編集</button>
                          <button style={styles.btnSmRed} onClick={() => deleteMaterial(m.id)}>削除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMaster.length === 0 && <div style={{ textAlign: "center", color: "#aaa", padding: "24px 0", fontSize: 14 }}>原材料が登録されていません</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  root: { fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN',sans-serif", minHeight: "100vh", background: "#f8f9fb", color: "#1a1a2e" },
  header: { background: "#1a1a2e", color: "white", padding: "16px 24px" },
  headerInner: { maxWidth: 860, margin: "0 auto" },
  logo: { fontSize: 22, fontWeight: 700 },
  subtitle: { fontSize: 12, color: "#a78bfa", marginTop: 2 },
  tabBar: { background: "#1a1a2e", borderBottom: "1px solid #2d2d4e", padding: "0 24px", display: "flex", gap: 4 },
  tab: { padding: "10px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  body: { maxWidth: 860, margin: "0 auto", padding: "20px 16px" },
  card: { background: "white", borderRadius: 12, padding: "16px 18px", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,.07)" },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#4b5563", marginBottom: 10 },
  input: { width: "100%", padding: "9px 12px", border: "1.5px solid #e5e7eb", borderRadius: 8, fontSize: 14, outline: "none", background: "white", color: "#1a1a2e", boxSizing: "border-box" },
  label: { display: "block", fontSize: 12, color: "#6b7280", marginBottom: 4 },
  dropdownList: { position: "absolute", zIndex: 999, top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid #e5e7eb", borderRadius: 10, maxHeight: 200, overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,.12)" },
  dropdownItem: { padding: "9px 14px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 },
  dropdownEmpty: { padding: "12px 14px", color: "#aaa", fontSize: 13 },
  rowLine: { display: "flex", gap: 8, alignItems: "center", marginBottom: 8 },
  selectedMat: { display: "flex", alignItems: "center", gap: 8, background: "#f0f4ff", border: "1.5px solid #c7d2fe", borderRadius: 8, padding: "8px 12px", fontSize: 14 },
  matBadge: { background: "#e0e7ff", color: "#4338ca", borderRadius: 6, padding: "2px 7px", fontSize: 11, fontWeight: 600 },
  clearBtn: { marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 13 },
  removeBtn: { background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#d1d5db", flexShrink: 0 },
  addRowBtn: { marginTop: 4, background: "none", border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "7px 14px", color: "#9ca3af", cursor: "pointer", fontSize: 13, width: "100%" },
  resultCard: { background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)", color: "white", borderRadius: 14, padding: "20px 22px", boxShadow: "0 4px 20px rgba(26,26,46,.2)" },
  resultTitle: { fontSize: 14, color: "#a78bfa", fontWeight: 600 },
  resultGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 16 },
  resultItem: { background: "rgba(255,255,255,.06)", borderRadius: 10, padding: "12px 14px" },
  resultLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 6 },
  resultValue: { fontSize: 20, fontWeight: 700 },
  suggestBox: { background: "rgba(167,139,250,.15)", border: "1px solid rgba(167,139,250,.4)", borderRadius: 10, padding: "14px 16px" },
  suggestLabel: { fontSize: 12, color: "#c4b5fd", marginBottom: 6 },
  suggestValue: { fontSize: 26, fontWeight: 800, color: "#e8d5ff" },
  suggestSub: { fontSize: 12, fontWeight: 400, color: "#a78bfa", marginLeft: 8 },
  gauge: { height: 10, background: "rgba(255,255,255,.1)", borderRadius: 5, position: "relative" },
  gaugeBar: { height: "100%", borderRadius: 5, transition: "width .5s,background .5s" },
  gaugeTarget: { position: "absolute", top: -3, width: 2, height: 16, background: "#a78bfa", borderRadius: 1, transform: "translateX(-50%)" },
  th: { padding: "8px 10px", fontSize: 12, color: "#6b7280", textAlign: "left", fontWeight: 600 },
  td: { padding: "10px 10px", fontSize: 14 },
  unitBadge: { background: "#f3f4f6", color: "#374151", borderRadius: 6, padding: "2px 8px", fontSize: 12 },
  btnPrimary: { background: "#1a1a2e", color: "white", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: "pointer", fontSize: 14 },
  btnSmBlue: { background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmRed: { background: "#fff1f2", color: "#be123c", border: "1px solid #fecdd3", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmGreen: { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
  btnSmGray: { background: "#f9fafb", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", fontWeight: 500 },
};
