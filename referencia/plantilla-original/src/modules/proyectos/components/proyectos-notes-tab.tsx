import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Pin,
  Save,
  Check,
  FileText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { ProjectNote, NoteCategory } from '../types/proyectos.types';
import { initialNotes } from '../data/proyectos-data';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

export const ProyectosNotesTab: React.FC = () => {
  const { play } = useSound();
  const [notes, setNotes] = useState<ProjectNote[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string>(initialNotes[0].id);
  const [activeCategory, setActiveCategory] = useState<NoteCategory>('all');
  const [search, setSearch] = useState('');

  // Active note lookup
  const activeNote = notes.find((n) => n.id === selectedNoteId) || notes[0];

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    const matchCategory = activeCategory === 'all' || n.category === activeCategory;
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleUpdateActiveNote = <K extends keyof ProjectNote>(field: K, value: ProjectNote[K]) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === selectedNoteId ? { ...n, [field]: value } : n))
    );
  };

  const handleCreateNote = () => {
    play('pop');
    const newNote: ProjectNote = {
      id: `note-${Date.now()}`,
      title: 'Nueva Nota de Proyecto',
      body: 'Comienza a redactar aquí tus especificaciones o apuntes técnicos...',
      category: activeCategory === 'all' ? 'engineering' : activeCategory,
      colorTag: 'border-l-primary',
      updatedAt: 'Justo ahora',
      isPinned: false,
    };
    setNotes([newNote, ...notes]);
    setSelectedNoteId(newNote.id);
    pillToast.success('Nota Creada', 'Listo para redactar.');
  };

  const handleDeleteNote = (id: string) => {
    if (notes.length <= 1) {
      play('alert');
      pillToast.error('Mínimo Requerido', 'Debes conservar al menos una nota en el bloc.');
      return;
    }
    play('alert');
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    setSelectedNoteId(remaining[0].id);
    pillToast.info('Nota Eliminada', 'Se borró el apunte seleccionado.');
  };

  const handleTogglePin = (id: string) => {
    play('pop');
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Notes Sidebar with Filters & List */}
        <Card className="lg:col-span-5 border-border">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Notas & Especificaciones</CardTitle>
                <CardDescription className="text-xs">
                  {notes.length} documentos registrados
                </CardDescription>
              </div>

              <Button
                variant="default"
                size="sm"
                soundType="pop"
                onClick={handleCreateNote}
                className="text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Nueva Nota
              </Button>
            </div>

            {/* Category Pills Switcher */}
            <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
              {[
                { id: 'all', label: 'Todas' },
                { id: 'design', label: 'Diseño' },
                { id: 'engineering', label: 'Ingeniería' },
                { id: 'business', label: 'Negocio' },
                { id: 'personal', label: 'Personal' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    play('tab');
                    setActiveCategory(cat.id as NoteCategory);
                  }}
                  className={cn(
                    'px-3 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer',
                    activeCategory === cat.id
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-secondary'
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar notas por palabra clave..."
                  className="pl-9 text-xs h-8 bg-background"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-border/50 max-h-[580px] overflow-y-auto">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No hay notas que coincidan con la búsqueda.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = note.id === selectedNoteId;
                  return (
                    <div
                      key={note.id}
                      onClick={() => {
                        play('click');
                        setSelectedNoteId(note.id);
                      }}
                      className={cn(
                        'p-4 transition-all cursor-pointer border-l-4 space-y-1.5',
                        note.colorTag,
                        isSelected
                          ? 'bg-primary/5 text-foreground'
                          : 'hover:bg-muted/30 text-muted-foreground'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={cn(
                            'text-xs font-bold truncate line-clamp-1',
                            isSelected ? 'text-foreground' : 'text-foreground/90'
                          )}
                        >
                          {note.title}
                        </h4>
                        {note.isPinned && (
                          <Pin className="h-3 w-3 text-primary shrink-0 rotate-45" />
                        )}
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {note.body}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-muted-foreground/70">
                        <span className="capitalize">{note.category}</span>
                        <span>{note.updatedAt}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column (7 cols): Full Note Editor */}
        <div className="lg:col-span-7 space-y-6">
          {activeNote && (
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <Input
                      value={activeNote.title}
                      onChange={(e) => handleUpdateActiveNote('title', e.target.value)}
                      placeholder="Título de la Nota..."
                      className="text-base font-bold h-9 bg-transparent border-transparent hover:border-border focus:border-primary px-2"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="iconSm"
                      soundType="pop"
                      onClick={() => handleTogglePin(activeNote.id)}
                      title={activeNote.isPinned ? 'Desanclar nota' : 'Fijar nota al inicio'}
                    >
                      <Pin
                        className={cn(
                          'h-4 w-4',
                          activeNote.isPinned ? 'text-primary fill-primary rotate-45' : 'text-muted-foreground'
                        )}
                      />
                    </Button>

                    <Button
                      variant="ghost"
                      size="iconSm"
                      soundType="alert"
                      onClick={() => handleDeleteNote(activeNote.id)}
                      title="Eliminar esta nota"
                      className="hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">Categoría:</span>
                    <select
                      value={activeNote.category}
                      onChange={(e) => handleUpdateActiveNote('category', e.target.value as ProjectNote['category'])}
                      className="h-7 px-2 rounded-lg border border-border bg-background text-[11px] font-medium text-foreground cursor-pointer focus:outline-hidden"
                    >
                      <option value="engineering">Ingeniería</option>
                      <option value="design">Diseño</option>
                      <option value="business">Negocio</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    Modificado: {activeNote.updatedAt}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                <textarea
                  rows={16}
                  value={activeNote.body}
                  onChange={(e) => {
                    handleUpdateActiveNote('body', e.target.value);
                    handleUpdateActiveNote(
                      'updatedAt',
                      new Date().toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    );
                  }}
                  placeholder="Comienza a escribir tus notas en texto plano o markdown..."
                  className="w-full p-4 rounded-2xl border border-border bg-background text-xs text-foreground focus:outline-hidden leading-relaxed resize-none font-mono"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-1 border-t border-border/40">
                  <span>
                    {activeNote.body.length} caracteres • {activeNote.body.split(/\s+/).filter(Boolean).length} palabras
                  </span>
                  <span className="text-emerald-500 font-medium">Sincronizado</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
