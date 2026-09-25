import {
  BookOpen,
  Briefcase,
  Code,
  Dumbbell,
  GraduationCap,
  Heart,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const LIFE_AREA_ICONS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: "graduation-cap", label: "Concurso", Icon: GraduationCap },
  { id: "code", label: "Código", Icon: Code },
  { id: "heart", label: "Saúde", Icon: Heart },
  { id: "sparkles", label: "Crescimento", Icon: Sparkles },
  { id: "briefcase", label: "Trabalho", Icon: Briefcase },
  { id: "dumbbell", label: "Fitness", Icon: Dumbbell },
  { id: "book-open", label: "Leitura", Icon: BookOpen },
  { id: "layers", label: "Geral", Icon: Layers },
];

export const LIFE_AREA_COLORS = [
  { id: "#6366f1", label: "Índigo" },
  { id: "#22c55e", label: "Verde" },
  { id: "#ef4444", label: "Vermelho" },
  { id: "#f59e0b", label: "Âmbar" },
  { id: "#3b82f6", label: "Azul" },
  { id: "#a855f7", label: "Roxo" },
  { id: "#ec4899", label: "Rosa" },
  { id: "#64748b", label: "Cinza" },
];

export function getLifeAreaIcon(iconId: string): LucideIcon {
  const found = LIFE_AREA_ICONS.find((i) => i.id === iconId);
  return found?.Icon ?? Layers;
}
