import { useState, Fragment } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TopicWithSegments } from "@/lib/db/types";
import { SEGMENT_LABELS } from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

interface TopicGroup {
  disciplineId: number;
  disciplineName: string;
  topics: TopicWithSegments[];
}

interface CycleTopicsPanelProps {
  groups: TopicGroup[];
  onCreateTopic: (
    disciplineId: number,
    data: { lessonCode: string; name: string; weight: number; totalQuestionsAvailable: number; targetAccuracyPercent: number | null },
  ) => void;
  onDeleteTopic: (id: number) => void;
  onUpdateSegment: (topicId: number, segment: number, resolved: number, correct: number) => void;
}

export function CycleTopicsPanel({
  groups,
  onCreateTopic,
  onDeleteTopic,
  onUpdateSegment,
}: CycleTopicsPanelProps) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [newTopic, setNewTopic] = useState<Record<number, { lessonCode: string; name: string }>>({});

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum tópico cadastrado. Adicione disciplinas em Conhecimento e crie aulas aqui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = expanded[group.disciplineId] ?? true;
        const draft = newTopic[group.disciplineId] ?? { lessonCode: "00", name: "" };

        return (
          <div key={group.disciplineId} className="rounded-lg border">
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold hover:bg-muted/30"
              onClick={() => toggle(group.disciplineId)}
            >
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {group.disciplineName}
              <span className="text-xs font-normal text-muted-foreground">
                ({group.topics.length} aulas)
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t px-4 py-3">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 pr-2">Aula</th>
                        <th className="pb-2 pr-2">Peso</th>
                        <th className="pb-2 pr-2">Total Q.</th>
                        <th className="pb-2 pr-2">% alvo</th>
                        {SEGMENT_LABELS.map((seg) => (
                          <th key={seg} className="pb-2 pr-2 text-center" colSpan={3}>
                            Seg. {seg}
                          </th>
                        ))}
                        <th className="pb-2 pr-2 text-center" colSpan={3}>
                          Total
                        </th>
                        <th className="pb-2" />
                      </tr>
                      <tr className="text-left text-[10px] uppercase text-muted-foreground">
                        <th colSpan={4} />
                        {SEGMENT_LABELS.flatMap((seg) => [
                          <th key={`${seg}-f`} className="pb-2 pr-1 font-normal">Feitos</th>,
                          <th key={`${seg}-a`} className="pb-2 pr-1 font-normal">Acertos</th>,
                          <th key={`${seg}-p`} className="pb-2 pr-2 font-normal">%</th>,
                        ])}
                        <th className="pb-2 pr-1 font-normal">Feitos</th>
                        <th className="pb-2 pr-1 font-normal">Acertos</th>
                        <th className="pb-2 pr-2 font-normal">%</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {group.topics.map((topic) => (
                        <tr key={topic.id} className="border-t">
                          <td className="py-2 pr-2">
                            <span className="font-mono text-xs text-primary">
                              {topic.lessonCode.padStart(2, "0")}
                            </span>{" "}
                            {topic.name}
                          </td>
                          <td className="py-2 pr-2 font-mono">{topic.weight}</td>
                          <td className="py-2 pr-2 font-mono">{topic.totalQuestionsAvailable}</td>
                          <td className="py-2 pr-2 font-mono">
                            {topic.targetAccuracyPercent != null
                              ? `${topic.targetAccuracyPercent}%`
                              : "—"}
                          </td>
                          {topic.segments.map((seg) => {
                            const pct =
                              seg.resolved > 0
                                ? Math.round((seg.correct / seg.resolved) * 100)
                                : null;
                            return (
                              <Fragment key={`${topic.id}-seg-${seg.segment}`}>
                                <td className="py-1 pr-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-7 w-14 text-xs"
                                    value={seg.resolved}
                                    onChange={(e) =>
                                      onUpdateSegment(
                                        topic.id,
                                        seg.segment,
                                        parseInt(e.target.value, 10) || 0,
                                        seg.correct,
                                      )
                                    }
                                  />
                                </td>
                                <td className="py-1 pr-1">
                                  <Input
                                    type="number"
                                    min={0}
                                    className="h-7 w-14 text-xs"
                                    value={seg.correct}
                                    onChange={(e) =>
                                      onUpdateSegment(
                                        topic.id,
                                        seg.segment,
                                        seg.resolved,
                                        parseInt(e.target.value, 10) || 0,
                                      )
                                    }
                                  />
                                </td>
                                <td
                                  className={cn(
                                    "py-2 pr-2 font-mono text-xs",
                                    pct != null &&
                                      topic.targetAccuracyPercent != null &&
                                      pct >= topic.targetAccuracyPercent
                                      ? "text-emerald-400"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {pct != null ? `${pct}%` : "—"}
                                </td>
                              </Fragment>
                            );
                          })}
                          <td className="py-2 pr-1 font-mono">{topic.totalResolvedAll}</td>
                          <td className="py-2 pr-1 font-mono">{topic.totalCorrectAll}</td>
                          <td
                            className={cn(
                              "py-2 pr-2 font-mono text-xs",
                              topic.meetsTarget ? "text-emerald-400" : "",
                            )}
                          >
                            {topic.accuracyPercent != null ? `${topic.accuracyPercent}%` : "—"}
                          </td>
                          <td className="py-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => onDeleteTopic(topic.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-end gap-2 border-t pt-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Código</Label>
                    <Input
                      className="h-8 w-16"
                      value={draft.lessonCode}
                      onChange={(e) =>
                        setNewTopic((prev) => ({
                          ...prev,
                          [group.disciplineId]: { ...draft, lessonCode: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="min-w-[200px] flex-1 space-y-1">
                    <Label className="text-xs">Nome da aula</Label>
                    <Input
                      className="h-8"
                      placeholder="Aula 00 — Ortografia Oficial"
                      value={draft.name}
                      onChange={(e) =>
                        setNewTopic((prev) => ({
                          ...prev,
                          [group.disciplineId]: { ...draft, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (!draft.name.trim()) return;
                      onCreateTopic(group.disciplineId, {
                        lessonCode: draft.lessonCode,
                        name: draft.name.trim(),
                        weight: 1,
                        totalQuestionsAvailable: 0,
                        targetAccuracyPercent: null,
                      });
                      setNewTopic((prev) => ({
                        ...prev,
                        [group.disciplineId]: { lessonCode: "00", name: "" },
                      }));
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Adicionar aula
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
