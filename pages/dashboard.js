import { useEffect, useState, useMemo } from "react";
import { isAuthorized } from "../lib/auth";

export async function getServerSideProps({ req }) {
  if (!isAuthorized(req)) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  return { props: {} };
}

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [folders, setFolders] = useState([]);
  const [activeFolder, setActiveFolder] = useState("all");
  const [selected, setSelected] = useState(new Set());
  const [newFolder, setNewFolder] = useState("");

  const [type, setType] = useState("text");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState(null);

  async function loadAll() {
    const [g, f] = await Promise.all([
      fetch("/api/groups").then((r) => r.json()),
      fetch("/api/folders").then((r) => r.json()),
    ]);
    setGroups(g.groups || []);
    setFolders(f.folders || []);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const visibleGroups = useMemo(() => {
    if (activeFolder === "all") return groups;
    if (activeFolder === "none") return groups.filter((g) => !g.folder);
    return groups.filter((g) => g.folder === activeFolder);
  }, [groups, activeFolder]);

  function toggle(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function selectAllVisible() {
    setSelected(new Set(visibleGroups.map((g) => g.id)));
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function createFolder(e) {
    e.preventDefault();
    if (!newFolder.trim()) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolder.trim() }),
    });
    setNewFolder("");
    loadAll();
  }

  async function deleteFolder(name) {
    await fetch("/api/folders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (activeFolder === name) setActiveFolder("all");
    loadAll();
  }

  async function assignFolder(groupId, folder) {
    await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    loadAll();
  }

  async function removeGroup(groupId) {
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
    loadAll();
  }

  async function send() {
    if (selected.size === 0) {
      alert("Sélectionne au moins un groupe.");
      return;
    }
    if (type !== "text" && !file) {
      alert("Ajoute un fichier pour ce type d'envoi.");
      return;
    }
    setSending(true);
    setResults(null);

    const form = new FormData();
    form.append("type", type);
    form.append("caption", caption);
    form.append("targets", JSON.stringify([...selected]));
    if (file) form.append("file", file);

    const res = await fetch("/api/send", { method: "POST", body: form });
    const data = await res.json();
    setResults(data.results || []);
    setSending(false);
  }

  return (
    <div className="min-h-screen p-6 lg:p-10">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-white">📡 Broadcast Telegram</h1>
        <span className="text-white/40 text-sm">{groups.length} groupe(s) connecté(s)</span>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_360px] gap-6">
        {/* Colonne dossiers */}
        <aside className="card rounded-2xl p-4 h-fit">
          <h2 className="text-white/70 text-sm font-medium mb-3 uppercase tracking-wide">Dossiers</h2>
          <ul className="space-y-1 mb-4">
            <FolderItem label={`Tous (${groups.length})`} active={activeFolder === "all"} onClick={() => setActiveFolder("all")} />
            <FolderItem
              label={`Sans dossier (${groups.filter((g) => !g.folder).length})`}
              active={activeFolder === "none"}
              onClick={() => setActiveFolder("none")}
            />
            {folders.map((f) => (
              <FolderItem
                key={f}
                label={`${f} (${groups.filter((g) => g.folder === f).length})`}
                active={activeFolder === f}
                onClick={() => setActiveFolder(f)}
                onDelete={() => deleteFolder(f)}
              />
            ))}
          </ul>
          <form onSubmit={createFolder} className="flex gap-2">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="Nouveau dossier"
              className="flex-1 min-w-0 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400"
            />
            <button className="bg-brand-500 hover:bg-brand-600 rounded-lg px-3 text-sm text-white">+</button>
          </form>
        </aside>

        {/* Colonne groupes */}
        <section className="card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/70 text-sm font-medium uppercase tracking-wide">
              Groupes {activeFolder !== "all" ? `— ${activeFolder}` : ""}
            </h2>
            <div className="flex gap-2 text-sm">
              <button onClick={selectAllVisible} className="text-brand-400 hover:underline">
                Tout sélectionner
              </button>
              <button onClick={clearSelection} className="text-white/40 hover:underline">
                Vider
              </button>
            </div>
          </div>

          {visibleGroups.length === 0 && (
            <p className="text-white/40 text-sm py-8 text-center">
              Aucun groupe ici. Ajoute le bot dans un groupe Telegram pour qu'il apparaisse.
            </p>
          )}

          <ul className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
            {visibleGroups.map((g) => (
              <li
                key={g.id}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/[0.07] rounded-xl px-3 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={selected.has(g.id)}
                  onChange={() => toggle(g.id)}
                  className="w-4 h-4 accent-brand-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{g.title}</p>
                  <p className="text-white/30 text-xs">{g.id}</p>
                </div>
                <select
                  value={g.folder || ""}
                  onChange={(e) => assignFolder(g.id, e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 px-2 py-1 outline-none"
                >
                  <option value="">— Dossier —</option>
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeGroup(g.id)}
                  title="Retirer de la liste"
                  className="text-white/30 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* Colonne composition */}
        <section className="card rounded-2xl p-4 h-fit">
          <h2 className="text-white/70 text-sm font-medium mb-3 uppercase tracking-wide">Composer</h2>

          <div className="flex gap-2 mb-3">
            {[
              ["text", "Texte"],
              ["photo", "Photo"],
              ["video", "Vidéo"],
              ["voice", "Vocal"],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setType(val)}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  type === val
                    ? "bg-brand-500 border-brand-500 text-white"
                    : "border-white/10 text-white/50 hover:border-white/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {type !== "text" && (
            <input
              type="file"
              accept={type === "photo" ? "image/*" : type === "video" ? "video/*" : "audio/*"}
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-white/60 mb-3 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs"
            />
          )}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={type === "text" ? "Ton message…" : "Légende (optionnelle)…"}
            rows={5}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-brand-400 mb-3 resize-none"
          />

          <p className="text-white/40 text-xs mb-3">
            {selected.size} groupe(s) sélectionné(s)
          </p>

          <button
            onClick={send}
            disabled={sending}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 transition rounded-lg py-3 font-medium text-white"
          >
            {sending ? "Envoi en cours…" : "Envoyer"}
          </button>

          {results && (
            <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
              {results.map((r) => (
                <p key={r.chatId} className={`text-xs ${r.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {r.ok ? "✓" : "✕"} {r.chatId} {r.error ? `— ${r.error}` : ""}
                </p>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FolderItem({ label, active, onClick, onDelete }) {
  return (
    <li
      onClick={onClick}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer ${
        active ? "bg-brand-500/20 text-brand-200" : "text-white/60 hover:bg-white/5"
      }`}
    >
      <span className="truncate">{label}</span>
      {onDelete && (
        <span
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-white/20 hover:text-red-400 text-xs ml-2"
        >
          ✕
        </span>
      )}
    </li>
  );
}
