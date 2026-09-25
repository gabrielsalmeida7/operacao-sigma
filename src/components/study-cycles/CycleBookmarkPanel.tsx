import { useEffect, useState } from "react";
import { Bookmark, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Discipline } from "@/lib/db/types";

export interface BookmarkData {
  bookmarkLessonCode: string | null;
  bookmarkPdfName: string | null;
  bookmarkNote: string | null;
}

interface CycleBookmarkPanelProps {
  disciplines: Discipline[];
  selectedDisciplineId: number | null;
  onSave: (disciplineId: number, data: BookmarkData) => Promise<void>;
  compact?: boolean;
}

export function CycleBookmarkPanel({
  disciplines,
  selectedDisciplineId,
  onSave,
  compact = false,
}: CycleBookmarkPanelProps) {
  const [disciplineId, setDisciplineId] = useState<number | null>(selectedDisciplineId);
  const [lessonCode, setLessonCode] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectable = disciplines.filter((d) => d.isInCycle && d.cycleState !== "LOCKED");
  const discipline = disciplines.find((d) => d.id === disciplineId) ?? null;

  useEffect(() => {
    setDisciplineId(selectedDisciplineId);
  }, [selectedDisciplineId]);

  useEffect(() => {
    if (!discipline) {
      setLessonCode("");
      setPdfName("");
      setNote("");
      return;
    }
    setLessonCode(discipline.bookmarkLessonCode ?? "");
    setPdfName(discipline.bookmarkPdfName ?? "");
    setNote(discipline.bookmarkNote ?? "");
  }, [
    discipline?.id,
    discipline?.bookmarkLessonCode,
    discipline?.bookmarkPdfName,
    discipline?.bookmarkNote,
  ]);

  const handleSave = async () => {
    if (!disciplineId) return;
    setSaving(true);
    try {
      await onSave(disciplineId, {
        bookmarkLessonCode: lessonCode.trim() || null,
        bookmarkPdfName: pdfName.trim() || null,
        bookmarkNote: note.trim() || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const formFields = (
    <>
      {!compact && (
        <div className="space-y-2">
          <Label>Matéria</Label>
          <Select
            value={disciplineId ? String(disciplineId) : ""}
            onValueChange={(v) => setDisciplineId(parseInt(v, 10))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a matéria" />
            </SelectTrigger>
            <SelectContent>
              {selectable.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
        <div className="space-y-2">
          <Label htmlFor="bookmark-lesson">Aula</Label>
          <Input
            id="bookmark-lesson"
            placeholder="Ex: 01"
            value={lessonCode}
            onChange={(e) => setLessonCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bookmark-pdf">PDF / material</Label>
          <Input
            id="bookmark-pdf"
            placeholder="Ex: Aula 01 — Introdução"
            value={pdfName}
            onChange={(e) => setPdfName(e.target.value)}
          />
        </div>
        <div className={`space-y-2 ${compact ? "sm:col-span-2" : "sm:col-span-2"}`}>
          <Label htmlFor="bookmark-note">Onde parou (página, item, parágrafo…)</Label>
          <Input
            id="bookmark-note"
            placeholder="Ex: p. 47, item II do Art. 5º"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <Button size={compact ? "sm" : "default"} onClick={handleSave} disabled={!disciplineId || saving}>
        <Save className="mr-2 h-4 w-4" />
        {saved ? "Salvo!" : "Salvar onde parei"}
      </Button>
    </>
  );

  if (compact) {
    return (
      <div className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Registrar onde parou
        </p>
        {formFields}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bookmark className="h-4 w-4 text-primary" />
          Onde parei
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Registre a aula, o PDF e o ponto exato. Na próxima vez que esta matéria aparecer na fila,
          o ciclo mostrará de onde retomar.
        </p>
        {formFields}
      </CardContent>
    </Card>
  );
}
