'use client';

import React, { useEffect, useState } from 'react';
import { FolderOpen, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function ProjectBar() {
  const projects = useStore((s) => s.projects);
  const currentProjectId = useStore((s) => s.currentProjectId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const current = projects.find((p) => p.id === currentProjectId);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 1500);
  };

  const save = () => {
    const s = useStore.getState();
    if (s.currentProjectId) {
      flash(s.saveProject() ? 'Guardado' : 'Error al guardar');
      return;
    }
    const name = window.prompt('Nombre del proyecto');
    if (!name || !name.trim()) return;
    flash(s.saveProject(name) ? 'Guardado' : 'Error al guardar');
  };

  // Ctrl+S / Cmd+S. Capture phase so it works even when focus is inside
  // a sticky note textarea (which stops propagation of key events).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
    // save reads fresh state via useStore.getState(), so no deps needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rename = (id: string, oldName: string) => {
    const name = window.prompt('Nuevo nombre', oldName);
    if (!name || !name.trim()) return;
    if (!useStore.getState().renameProject(id, name)) flash('Error al renombrar');
  };

  const remove = (id: string, name: string) => {
    if (!window.confirm(`¿Borrar el proyecto "${name}"?`)) return;
    if (!useStore.getState().deleteProject(id)) flash('Error al borrar');
  };

  const btn =
    'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-zinc-200 hover:bg-[#3e3e3e] transition-colors';

  return (
    <div className="relative h-10 flex items-center gap-1 px-3 bg-[#2d2d2d] border-b border-[#3e3e3e] text-zinc-200">
      <span className="text-sm font-semibold truncate max-w-[40%]">
        {current ? current.name : 'Sin guardar'}
      </span>

      <div className="ml-auto flex items-center gap-1">
        {status && <span className="text-xs text-emerald-400 mr-2">{status}</span>}

        <button className={btn} onClick={() => useStore.getState().newProject()} title="Nuevo proyecto">
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
        <button className={btn} onClick={save} title="Guardar (Ctrl/Cmd + S)">
          <Save className="w-3.5 h-3.5" /> Guardar
        </button>
        <button className={btn} onClick={() => setMenuOpen((o) => !o)} title="Ver proyectos guardados">
          <FolderOpen className="w-3.5 h-3.5" /> Proyectos ({projects.length})
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-3 top-10 z-50 w-72 max-h-96 overflow-auto bg-[#2d2d2d] border border-[#3e3e3e] rounded shadow-xl py-1">
            {projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-zinc-400">
                No hay proyectos. Usa Ctrl/Cmd + S para guardar el actual.
              </p>
            )}
            {projects.map((p) => (
              <div
                key={p.id}
                className={`group flex items-center gap-2 px-3 py-2 hover:bg-[#3e3e3e] ${
                  p.id === currentProjectId ? 'bg-[#383838]' : ''
                }`}
              >
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => {
                    useStore.getState().openProject(p.id);
                    setMenuOpen(false);
                  }}
                >
                  <div className="text-sm truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-400">
                    {new Date(p.updatedAt).toLocaleString()}
                  </div>
                </button>
                <button
                  className="p-1 text-zinc-400 hover:text-zinc-100"
                  onClick={() => rename(p.id, p.name)}
                  title="Renombrar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  className="p-1 text-zinc-400 hover:text-red-400"
                  onClick={() => remove(p.id, p.name)}
                  title="Borrar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
