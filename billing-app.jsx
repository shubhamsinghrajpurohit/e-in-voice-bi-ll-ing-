import React, { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard, Users, FileText, Settings, Plus, Trash2, X,
  ArrowLeft, Printer, Check, Clock, AlertCircle, Search, Pencil,
} from "lucide-react";

/* ---------------------------------------------------------
   TOKENS
   paper   #EFEEE9  ink #1C2B39  ink-soft #57697A
   emerald #2F6E5C (paid)  amber #C97A2B (unpaid)  rust #B23A3A (overdue)
   line    #D9D2C2
--------------------------------------------------------- */
const C = {
  paper: "#EFEEE9",
  paper2: "#F7F5F0",
  ink: "#1C2B39",
  inkSoft: "#57697A",
  emerald: "#2F6E5C",
  amber: "#C97A2B",
  rust: "#B23A3A",
  line: "#D9D2C2",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const money = (n, sym = "$") =>
  `${sym}${(Math.round((n + Number.EPSILON) * 100) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE = {
  paid: { color: C.emerald, label: "Paid" },
  unpaid: { color: C.amber, label: "Unpaid" },
  overdue: { color: C.rust, label: "Overdue" },
  draft: { color: C.inkSoft, label: "Draft" },
};

function calcTotals(inv) {
  const subtotal = inv.items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const tax = subtotal * ((Number(inv.taxRate) || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export default function BillingApp() {
  const [ready, setReady] = useState(false);
  const [business, setBusiness] = useState({ name: "Your Business", address: "", phone: "", email: "", currency: "$" });
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [view, setView] = useState("dashboard");
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [editingClientId, setEditingClientId] = useState(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ---- load ----
  useEffect(() => {
    (async () => {
      try {
        const b = await window.storage.get("business-profile");
        if (b) setBusiness(JSON.parse(b.value));
      } catch (e) {}
      try {
        const c = await window.storage.get("clients-list");
        if (c) setClients(JSON.parse(c.value));
      } catch (e) {}
      try {
        const i = await window.storage.get("invoices-list");
        if (i) setInvoices(JSON.parse(i.value));
      } catch (e) {}
      setReady(true);
    })();
  }, []);

  const persist = async (key, value) => {
    try {
      const r = await window.storage.set(key, JSON.stringify(value));
      if (!r) setSaveError("Could not save. Your changes may not persist.");
      else setSaveError("");
    } catch (e) {
      setSaveError("Could not save. Your changes may not persist.");
    }
  };

  const updateBusiness = (b) => { setBusiness(b); persist("business-profile", b); };
  const updateClients = (list) => { setClients(list); persist("clients-list", list); };
  const updateInvoices = (list) => { setInvoices(list); persist("invoices-list", list); };

  const nextInvoiceNumber = useMemo(() => {
    const nums = invoices
      .map((i) => parseInt((i.number || "").replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `INV-${String(next).padStart(4, "0")}`;
  }, [invoices]);

  const clientById = (id) => clients.find((c) => c.id === id);

  // ---- derived dashboard numbers ----
  const stats = useMemo(() => {
    let paid = 0, outstanding = 0, overdue = 0;
    invoices.forEach((inv) => {
      const { total } = calcTotals(inv);
      if (inv.status === "paid") paid += total;
      else if (inv.status === "overdue") { outstanding += total; overdue += total; }
      else if (inv.status === "unpaid") outstanding += total;
    });
    return { paid, outstanding, overdue, count: invoices.length };
  }, [invoices]);

  if (!ready) {
    return (
      <div style={{ background: C.paper, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: C.inkSoft, fontFamily: "'Space Grotesk', sans-serif" }}>Loading ledger…</div>
      </div>
    );
  }

  return (
    <div style={{ background: C.paper, minHeight: "100vh", color: C.ink, fontFamily: "'Inter', sans-serif" }}>
      <GlobalStyle />
      <div className="flex flex-col md:flex-row min-h-screen">
        <Sidebar view={view} setView={setView} business={business} />

        <main className="flex-1 pb-24 md:pb-8 px-4 md:px-10 pt-6 md:pt-10 max-w-5xl mx-auto w-full">
          {saveError && (
            <div className="mb-4 text-sm px-3 py-2 rounded" style={{ background: "#F3E3E3", color: C.rust }}>
              {saveError}
            </div>
          )}

          {view === "dashboard" && (
            <Dashboard
              stats={stats}
              business={business}
              invoices={invoices}
              clients={clients}
              goNew={() => { setActiveInvoiceId(null); setView("invoice-form"); }}
              openInvoice={(id) => { setActiveInvoiceId(id); setView("invoice-view"); }}
            />
          )}

          {view === "clients" && (
            <ClientsView
              clients={clients}
              invoices={invoices}
              onAdd={() => { setEditingClientId(null); setClientModalOpen(true); }}
              onEdit={(id) => { setEditingClientId(id); setClientModalOpen(true); }}
              onDelete={(id) => updateClients(clients.filter((c) => c.id !== id))}
              currency={business.currency}
            />
          )}

          {view === "invoices" && (
            <InvoicesView
              invoices={invoices}
              clients={clients}
              currency={business.currency}
              goNew={() => { setActiveInvoiceId(null); setView("invoice-form"); }}
              openInvoice={(id) => { setActiveInvoiceId(id); setView("invoice-view"); }}
            />
          )}

          {view === "invoice-form" && (
            <InvoiceForm
              invoice={invoices.find((i) => i.id === activeInvoiceId) || null}
              clients={clients}
              nextNumber={nextInvoiceNumber}
              currency={business.currency}
              onCancel={() => setView(activeInvoiceId ? "invoice-view" : "invoices")}
              onSave={(inv) => {
                if (invoices.some((i) => i.id === inv.id)) {
                  updateInvoices(invoices.map((i) => (i.id === inv.id ? inv : i)));
                } else {
                  updateInvoices([...invoices, inv]);
                }
                setActiveInvoiceId(inv.id);
                setView("invoice-view");
              }}
              onAddClientShortcut={() => { setEditingClientId(null); setClientModalOpen(true); }}
            />
          )}

          {view === "invoice-view" && activeInvoiceId && (
            <InvoiceDetail
              invoice={invoices.find((i) => i.id === activeInvoiceId)}
              client={clientById((invoices.find((i) => i.id === activeInvoiceId) || {}).clientId)}
              business={business}
              onBack={() => setView("invoices")}
              onEdit={() => setView("invoice-form")}
              onStatus={(status) => {
                updateInvoices(invoices.map((i) => (i.id === activeInvoiceId ? { ...i, status } : i)));
              }}
              onDelete={() => {
                updateInvoices(invoices.filter((i) => i.id !== activeInvoiceId));
                setActiveInvoiceId(null);
                setView("invoices");
              }}
            />
          )}

          {view === "settings" && (
            <SettingsView business={business} onSave={updateBusiness} />
          )}
        </main>
      </div>

      <MobileTabBar view={view} setView={setView} />

      {clientModalOpen && (
        <ClientModal
          client={editingClientId ? clientById(editingClientId) : null}
          onClose={() => setClientModalOpen(false)}
          onSave={(c) => {
            if (clients.some((x) => x.id === c.id)) updateClients(clients.map((x) => (x.id === c.id ? c : x)));
            else updateClients([...clients, c]);
            setClientModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ---------------- Global style / fonts / print ---------------- */
function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
      .font-display { font-family: 'Space Grotesk', sans-serif; }
      .font-mono { font-family: 'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums; }
      .stamp {
        display: inline-block;
        transform: rotate(-6deg);
        border: 2.5px solid currentColor;
        border-radius: 4px;
        padding: 4px 14px;
        letter-spacing: 0.12em;
        font-family: 'Space Grotesk', sans-serif;
        font-weight: 700;
      }
      .perforation {
        background-image: radial-gradient(circle, ${C.paper} 2.5px, transparent 2.5px);
        background-size: 14px 14px;
        background-position: -3px center;
        height: 6px;
      }
      @media print {
        .no-print { display: none !important; }
        body { background: white !important; }
        .print-sheet { box-shadow: none !important; margin: 0 !important; }
      }
    `}</style>
  );
}

/* ---------------- Sidebar (desktop) ---------------- */
function Sidebar({ view, setView, business }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <aside
      className="no-print hidden md:flex md:flex-col md:w-56 md:min-h-screen px-5 py-8"
      style={{ background: C.ink, color: C.paper2 }}
    >
      <div className="font-display text-lg font-semibold mb-1 truncate">{business.name || "Your Business"}</div>
      <div className="text-xs mb-10" style={{ color: "#8FA1AF" }}>Billing Ledger</div>
      <nav className="flex flex-col gap-1">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="flex items-center gap-3 px-3 py-2 rounded text-sm transition"
            style={{
              background: view === id ? "rgba(255,255,255,0.08)" : "transparent",
              color: view === id ? "#fff" : "#B6C2CC",
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

function MobileTabBar({ view, setView }) {
  const items = [
    { id: "dashboard", label: "Home", icon: LayoutDashboard },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "clients", label: "Clients", icon: Users },
    { id: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <nav
      className="no-print md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-2 z-20"
      style={{ background: C.ink, borderTop: `1px solid ${C.line}` }}
    >
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => setView(id)}
          className="flex flex-col items-center gap-1 px-3 py-1 text-[11px]"
          style={{ color: view === id ? "#fff" : "#8FA1AF" }}
        >
          <Icon size={18} />
          {label}
        </button>
      ))}
    </nav>
  );
}

/* ---------------- Dashboard ---------------- */
function Dashboard({ stats, business, invoices, clients, goNew, openInvoice }) {
  const recent = [...invoices].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm" style={{ color: C.inkSoft }}>{clients.length} client{clients.length !== 1 ? "s" : ""} · {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={goNew} className="no-print flex items-center gap-2 px-4 py-2 rounded font-medium text-sm" style={{ background: C.ink, color: "#fff" }}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Collected" value={money(stats.paid, business.currency)} color={C.emerald} />
        <StatCard label="Outstanding" value={money(stats.outstanding, business.currency)} color={C.amber} />
        <StatCard label="Overdue" value={money(stats.overdue, business.currency)} color={C.rust} />
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
        <div className="px-5 py-3 font-display text-sm font-semibold" style={{ borderBottom: `1px solid ${C.line}` }}>
          Recent Invoices
        </div>
        {recent.length === 0 ? (
          <EmptyRow text="No invoices yet. Create your first one to see it here." />
        ) : (
          recent.map((inv) => (
            <InvoiceRow key={inv.id} inv={inv} clients={clients} currency={business.currency} onClick={() => openInvoice(inv.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-lg p-5" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
      <div className="text-xs uppercase tracking-wide mb-2" style={{ color: C.inkSoft }}>{label}</div>
      <div className="font-mono text-2xl font-semibold" style={{ color }}>{value}</div>
    </div>
  );
}

function EmptyRow({ text }) {
  return <div className="px-5 py-8 text-sm text-center" style={{ color: C.inkSoft }}>{text}</div>;
}

function InvoiceRow({ inv, clients, currency, onClick }) {
  const client = clients.find((c) => c.id === inv.clientId);
  const { total } = calcTotals(inv);
  const st = STATUS_STYLE[inv.status] || STATUS_STYLE.draft;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-black/5 transition"
      style={{ borderBottom: `1px solid ${C.line}` }}
    >
      <div>
        <div className="text-sm font-medium">{client ? client.name : "No client"}</div>
        <div className="font-mono text-xs" style={{ color: C.inkSoft }}>{inv.number} · {inv.date}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm">{money(total, currency)}</span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${st.color}1A`, color: st.color }}>{st.label}</span>
      </div>
    </button>
  );
}

/* ---------------- Clients ---------------- */
function ClientsView({ clients, invoices, onAdd, onEdit, onDelete, currency }) {
  const [q, setQ] = useState("");
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Clients</h1>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 rounded font-medium text-sm" style={{ background: C.ink, color: "#fff" }}>
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.inkSoft }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className="w-full pl-9 pr-3 py-2 rounded text-sm outline-none"
          style={{ background: C.paper2, border: `1px solid ${C.line}` }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
          <EmptyRow text={clients.length === 0 ? "No clients yet. Add your first client to start billing." : "No matches."} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => {
            const count = invoices.filter((i) => i.clientId === c.id).length;
            return (
              <div key={c.id} className="rounded-lg p-4" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{c.name}</div>
                    {c.email && <div className="text-xs mt-0.5" style={{ color: C.inkSoft }}>{c.email}</div>}
                    {c.phone && <div className="text-xs" style={{ color: C.inkSoft }}>{c.phone}</div>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => onEdit(c.id)} className="p-1.5 rounded hover:bg-black/5"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(c.id)} className="p-1.5 rounded hover:bg-black/5" style={{ color: C.rust }}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-xs mt-3 font-mono" style={{ color: C.inkSoft }}>{count} invoice{count !== 1 ? "s" : ""}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ClientModal({ client, onClose, onSave }) {
  const [form, setForm] = useState(client || { id: uid(), name: "", email: "", phone: "", address: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" style={{ background: "rgba(28,43,57,0.45)" }}>
      <div className="w-full sm:w-96 rounded-t-xl sm:rounded-xl p-5" style={{ background: C.paper2 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-base">{client ? "Edit Client" : "Add Client"}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <Field label="Name" value={form.name} onChange={(v) => set("name", v)} />
          <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
          <Field label="Address" value={form.address} onChange={(v) => set("address", v)} textarea />
        </div>
        <button
          disabled={!form.name.trim()}
          onClick={() => onSave(form)}
          className="w-full mt-5 py-2.5 rounded font-medium text-sm disabled:opacity-40"
          style={{ background: C.ink, color: "#fff" }}
        >
          Save Client
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, textarea, type = "text" }) {
  const cls = "w-full px-3 py-2 rounded text-sm outline-none";
  const style = { background: "#fff", border: `1px solid ${C.line}` };
  return (
    <label className="text-xs" style={{ color: C.inkSoft }}>
      {label}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className={cls + " mt-1 resize-none"} style={style} rows={2} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={cls + " mt-1"} style={style} />
      )}
    </label>
  );
}

/* ---------------- Invoices list ---------------- */
function InvoicesView({ invoices, clients, currency, goNew, openInvoice }) {
  const [filter, setFilter] = useState("all");
  const tabs = ["all", "draft", "unpaid", "overdue", "paid"];
  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);
  const sorted = [...filtered].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold">Invoices</h1>
        <button onClick={goNew} className="flex items-center gap-2 px-4 py-2 rounded font-medium text-sm" style={{ background: C.ink, color: "#fff" }}>
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap"
            style={{
              background: filter === t ? C.ink : C.paper2,
              color: filter === t ? "#fff" : C.inkSoft,
              border: `1px solid ${filter === t ? C.ink : C.line}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
        {sorted.length === 0 ? (
          <EmptyRow text="No invoices in this view." />
        ) : (
          sorted.map((inv) => (
            <InvoiceRow key={inv.id} inv={inv} clients={clients} currency={currency} onClick={() => openInvoice(inv.id)} />
          ))
        )}
      </div>
    </div>
  );
}

/* ---------------- Invoice form ---------------- */
function InvoiceForm({ invoice, clients, nextNumber, currency, onCancel, onSave, onAddClientShortcut }) {
  const blank = {
    id: uid(),
    number: nextNumber,
    clientId: clients[0]?.id || "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
    items: [{ id: uid(), desc: "", qty: 1, price: 0 }],
    taxRate: 0,
    status: "draft",
    notes: "",
  };
  const [form, setForm] = useState(invoice ? { ...invoice } : blank);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const setItem = (id, k, v) =>
    setForm((f) => ({ ...f, items: f.items.map((it) => (it.id === id ? { ...it, [k]: v } : it)) }));
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { id: uid(), desc: "", qty: 1, price: 0 }] }));
  const removeItem = (id) => setForm((f) => ({ ...f, items: f.items.filter((it) => it.id !== id) }));

  const { subtotal, tax, total } = calcTotals(form);
  const canSave = form.clientId && form.items.some((it) => it.desc.trim());

  return (
    <div>
      <button onClick={onCancel} className="flex items-center gap-1 text-sm mb-5" style={{ color: C.inkSoft }}>
        <ArrowLeft size={15} /> Back
      </button>
      <h1 className="font-display text-2xl font-semibold mb-6">{invoice ? "Edit Invoice" : "New Invoice"}</h1>

      {clients.length === 0 ? (
        <div className="rounded-lg p-6 text-center" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
          <p className="text-sm mb-3" style={{ color: C.inkSoft }}>Add a client before creating an invoice.</p>
          <button onClick={onAddClientShortcut} className="px-4 py-2 rounded text-sm font-medium" style={{ background: C.ink, color: "#fff" }}>
            Add Client
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg p-5" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
            <label className="text-xs" style={{ color: C.inkSoft }}>
              Client
              <select value={form.clientId} onChange={(e) => set("clientId", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="text-xs" style={{ color: C.inkSoft }}>
              Invoice #
              <input value={form.number} onChange={(e) => set("number", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm font-mono" style={{ background: "#fff", border: `1px solid ${C.line}` }} />
            </label>
            <label className="text-xs" style={{ color: C.inkSoft }}>
              Date
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }} />
            </label>
            <label className="text-xs" style={{ color: C.inkSoft }}>
              Due Date
              <input type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }} />
            </label>
          </div>

          <div className="rounded-lg p-5" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
            <div className="font-display text-sm font-semibold mb-3">Line Items</div>
            <div className="flex flex-col gap-2">
              {form.items.map((it) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
                  <input
                    placeholder="Description"
                    value={it.desc}
                    onChange={(e) => setItem(it.id, "desc", e.target.value)}
                    className="col-span-6 px-2 py-2 rounded text-sm"
                    style={{ background: "#fff", border: `1px solid ${C.line}` }}
                  />
                  <input
                    type="number" min="0" placeholder="Qty"
                    value={it.qty}
                    onChange={(e) => setItem(it.id, "qty", e.target.value)}
                    className="col-span-2 px-2 py-2 rounded text-sm font-mono"
                    style={{ background: "#fff", border: `1px solid ${C.line}` }}
                  />
                  <input
                    type="number" min="0" step="0.01" placeholder="Price"
                    value={it.price}
                    onChange={(e) => setItem(it.id, "price", e.target.value)}
                    className="col-span-3 px-2 py-2 rounded text-sm font-mono"
                    style={{ background: "#fff", border: `1px solid ${C.line}` }}
                  />
                  <button onClick={() => removeItem(it.id)} className="col-span-1 flex justify-center" style={{ color: C.rust }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addItem} className="flex items-center gap-1 text-sm mt-3 font-medium" style={{ color: C.ink }}>
              <Plus size={14} /> Add line
            </button>
          </div>

          <div className="rounded-lg p-5" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="text-xs" style={{ color: C.inkSoft }}>
                Tax rate (%)
                <input type="number" min="0" step="0.1" value={form.taxRate} onChange={(e) => set("taxRate", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm font-mono" style={{ background: "#fff", border: `1px solid ${C.line}` }} />
              </label>
              <label className="text-xs" style={{ color: C.inkSoft }}>
                Notes
                <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }} />
              </label>
            </div>
            <div className="flex flex-col items-end mt-4 gap-1 font-mono text-sm">
              <div style={{ color: C.inkSoft }}>Subtotal: {money(subtotal, currency)}</div>
              <div style={{ color: C.inkSoft }}>Tax: {money(tax, currency)}</div>
              <div className="text-lg font-semibold">{money(total, currency)}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              disabled={!canSave}
              onClick={() => onSave({ ...form, status: form.status === "draft" ? "unpaid" : form.status })}
              className="flex-1 py-2.5 rounded font-medium text-sm disabled:opacity-40"
              style={{ background: C.ink, color: "#fff" }}
            >
              Save Invoice
            </button>
            <button
              disabled={!canSave}
              onClick={() => onSave({ ...form, status: "draft" })}
              className="px-4 py-2.5 rounded font-medium text-sm disabled:opacity-40"
              style={{ background: "transparent", border: `1px solid ${C.line}`, color: C.inkSoft }}
            >
              Save Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- Invoice detail / print ---------------- */
function InvoiceDetail({ invoice, client, business, onBack, onEdit, onStatus, onDelete }) {
  if (!invoice) return null;
  const { subtotal, tax, total } = calcTotals(invoice);
  const st = STATUS_STYLE[invoice.status] || STATUS_STYLE.draft;

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-5">
        <button onClick={onBack} className="flex items-center gap-1 text-sm" style={{ color: C.inkSoft }}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="flex gap-2">
          <button onClick={onEdit} className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1" style={{ border: `1px solid ${C.line}` }}>
            <Pencil size={13} /> Edit
          </button>
          <button onClick={() => window.print()} className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1" style={{ border: `1px solid ${C.line}` }}>
            <Printer size={13} /> Print
          </button>
          <button onClick={onDelete} className="px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1" style={{ border: `1px solid ${C.line}`, color: C.rust }}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      <div className="no-print flex gap-2 mb-5">
        {["draft", "unpaid", "overdue", "paid"].map((s) => (
          <button
            key={s}
            onClick={() => onStatus(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium capitalize"
            style={{
              background: invoice.status === s ? STATUS_STYLE[s].color : "transparent",
              color: invoice.status === s ? "#fff" : C.inkSoft,
              border: `1px solid ${invoice.status === s ? STATUS_STYLE[s].color : C.line}`,
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="print-sheet rounded-lg p-8 relative" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
        <div className="perforation absolute -top-1 left-0 right-0" />
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="font-display text-xl font-semibold">{business.name}</div>
            <div className="text-xs mt-1 whitespace-pre-line" style={{ color: C.inkSoft }}>{business.address}</div>
            <div className="text-xs" style={{ color: C.inkSoft }}>{business.phone} {business.email && `· ${business.email}`}</div>
          </div>
          <div className="stamp text-sm" style={{ color: st.color }}>{st.label.toUpperCase()}</div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-wide mb-1" style={{ color: C.inkSoft }}>Bill To</div>
            <div className="text-sm font-medium">{client ? client.name : "—"}</div>
            {client?.address && <div className="text-xs whitespace-pre-line" style={{ color: C.inkSoft }}>{client.address}</div>}
            {client?.email && <div className="text-xs" style={{ color: C.inkSoft }}>{client.email}</div>}
          </div>
          <div className="text-right font-mono text-xs" style={{ color: C.inkSoft }}>
            <div>{invoice.number}</div>
            <div>Date: {invoice.date}</div>
            {invoice.dueDate && <div>Due: {invoice.dueDate}</div>}
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.line}` }}>
              <th className="text-left py-2 font-medium" style={{ color: C.inkSoft }}>Description</th>
              <th className="text-right py-2 font-medium" style={{ color: C.inkSoft }}>Qty</th>
              <th className="text-right py-2 font-medium" style={{ color: C.inkSoft }}>Price</th>
              <th className="text-right py-2 font-medium" style={{ color: C.inkSoft }}>Amount</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {invoice.items.filter((it) => it.desc.trim()).map((it) => (
              <tr key={it.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td className="py-2 font-sans">{it.desc}</td>
                <td className="py-2 text-right">{it.qty}</td>
                <td className="py-2 text-right">{money(Number(it.price) || 0, business.currency)}</td>
                <td className="py-2 text-right">{money((Number(it.qty) || 0) * (Number(it.price) || 0), business.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-48 font-mono text-sm flex flex-col gap-1">
            <div className="flex justify-between" style={{ color: C.inkSoft }}><span>Subtotal</span><span>{money(subtotal, business.currency)}</span></div>
            <div className="flex justify-between" style={{ color: C.inkSoft }}><span>Tax ({invoice.taxRate || 0}%)</span><span>{money(tax, business.currency)}</span></div>
            <div className="flex justify-between text-base font-semibold pt-1" style={{ borderTop: `1px solid ${C.line}` }}><span>Total</span><span>{money(total, business.currency)}</span></div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 text-xs" style={{ color: C.inkSoft, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
            {invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Settings ---------------- */
function SettingsView({ business, onSave }) {
  const [form, setForm] = useState(business);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const [saved, setSaved] = useState(false);

  return (
    <div className="max-w-md">
      <h1 className="font-display text-2xl font-semibold mb-6">Business Profile</h1>
      <div className="rounded-lg p-5 flex flex-col gap-3" style={{ background: C.paper2, border: `1px solid ${C.line}` }}>
        <Field label="Business Name" value={form.name} onChange={(v) => set("name", v)} />
        <Field label="Address" value={form.address} onChange={(v) => set("address", v)} textarea />
        <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
        <label className="text-xs" style={{ color: C.inkSoft }}>
          Currency symbol
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className="w-full mt-1 px-3 py-2 rounded text-sm" style={{ background: "#fff", border: `1px solid ${C.line}` }}>
            {["$", "€", "£", "₹", "¥"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <button
        onClick={() => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
        className="w-full mt-4 py-2.5 rounded font-medium text-sm flex items-center justify-center gap-2"
        style={{ background: C.ink, color: "#fff" }}
      >
        {saved ? <><Check size={15} /> Saved</> : "Save Profile"}
      </button>
    </div>
  );
}
