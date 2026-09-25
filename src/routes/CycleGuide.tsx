import { Link } from "react-router-dom";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Lock,
  RefreshCw,
  SkipForward,
  Timer,
  Bookmark,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ESTRATEGIA_ATRF_COURSES,
  ESTRATEGIA_COURSE_COUNT,
  type EstrategiaPhase,
} from "@/lib/study-cycles/estrategiaCatalog";
import { CYCLE_ROLE_LABELS } from "@/lib/study-cycles/constants";
import { cn } from "@/lib/utils";

const PHASE_ORDER: EstrategiaPhase[] = ["BASE", "SPECIFIC", "FINAL", "SATURDAY"];

function phaseLabel(phase: EstrategiaPhase): string {
  switch (phase) {
    case "BASE":
      return "Fase 1 — Bloco básico (ciclo agora)";
    case "SPECIFIC":
      return "Fase 2 — Específicas (quando a teoria da base fechar)";
    case "FINAL":
      return "Fase 3 — Reta final";
    case "SATURDAY":
      return "Sábado — ciclo misto";
    default: {
      const _never: never = phase;
      return _never;
    }
  }
}

function phaseHint(phase: EstrategiaPhase): string {
  switch (phase) {
    case "BASE":
      return "Estas 7 matérias entram na fila rotativa de 12 sessões. No Estratégia, abra o PDF da matéria da sessão atual.";
    case "SPECIFIC":
      return "Não estude LTF nem Reforma Tributária antes de terminar Direito Tributário. Previdenciário entra primeiro.";
    case "FINAL":
      return "Ficam bloqueadas no ciclo até a reta final. Você pode ativá-las em Ciclos → Matérias quando quiser.";
    case "SATURDAY":
      return "Não avança teoria da fila de segunda a sexta. Use para discursiva, simulado e revisão mista.";
    default: {
      const _never: never = phase;
      return _never;
    }
  }
}

export function CycleGuide() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Pré-edital ATRF</p>
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <GraduationCap className="h-8 w-8 text-primary" />
            Como seguir o ciclo
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Material: Estratégia Concursos — Receita Federal (Analista Tributário), {ESTRATEGIA_COURSE_COUNT}{" "}
            cursos Pré-Edital. O ciclo do Sigma usa as matérias, não os cards duplicados de professor.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/cycles">
              <RefreshCw className="mr-2 h-4 w-4" />
              Abrir ciclo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/study">
              <Timer className="mr-2 h-4 w-4" />
              Sessão TQR
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-primary" />
              A fila não é calendário
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Não existe “segunda é Constitucional”. Você estuda a sessão 01, depois a 02, até a 12, e
            recomeça. Se faltar um dia, retoma de onde parou — nada se perde.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Sessão TQR (50 min)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            5–10 min de revisão do tópico anterior, 35–40 min de PDF no Estratégia, 10–15 min de
            questões. Videoaula só se o PDF travar (comum em Contabilidade e RLM).
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <SkipForward className="h-4 w-4 text-primary" />
              Gate de 70%
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Se acertar 70% ou mais das questões da aula, avance o tópico. Se não, a próxima sessão
            da mesma matéria começa com 30 min de reestudo dos erros.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bookmark className="h-4 w-4 text-primary" />
              Onde parei
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Terminou a sessão mas ainda está no meio do PDF? Em Ciclos ou Estudo, registre a aula,
            o nome do material e a página. Na próxima volta dessa matéria, o ciclo mostra exatamente
            de onde retomar.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Passo a passo no dia</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              "Abra Ciclos e veja a sessão marcada como agora.",
              "No Estratégia, abra o PDF da matéria correspondente (tabela abaixo).",
              "Em Estudo, inicie o modo TQR com essa disciplina.",
              "Estude o PDF. Ao terminar a teoria da sessão, faça 20–30 questões.",
              "Se não terminou o PDF, salve em Ciclos → Onde parei: aula, material e página.",
              "Registre resolvidas/corretas. O Sigma pinta a sessão e avança a fila.",
              "Sábado: discursivas, simulado ou revisão mista — fora da fila.",
            ].map((step, index) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs text-primary">
                  {index + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {PHASE_ORDER.map((phase) => {
        const courses = ESTRATEGIA_ATRF_COURSES.filter((c) => c.phase === phase);
        return (
          <section key={phase} className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">{phaseLabel(phase)}</h2>
              <p className="text-sm text-muted-foreground">{phaseHint(phase)}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <Card key={course.id} className="border-border/80">
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase">
                        Pré-Edital
                      </Badge>
                      {course.phase === "SATURDAY" ? (
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <BookOpen className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                    <p className="font-medium leading-snug">{course.name}</p>
                    {course.professor && (
                      <p className="text-xs text-muted-foreground">{course.professor}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      No ciclo:{" "}
                      <span className="text-foreground">
                        {course.cycleSlug
                          ? CYCLE_ROLE_LABELS[course.phase === "SATURDAY" ? "FINAL" : course.phase]
                          : "fora da fila"}
                      </span>
                    </p>
                    {course.note && (
                      <p className="text-xs text-amber-400/90">{course.note}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Ajuste o ciclo com essas matérias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Os {ESTRATEGIA_COURSE_COUNT} cards do Estratégia viram{" "}
            <span className="text-foreground">menos matérias no ciclo</span>, porque Constitucional,
            Contabilidade e Previdenciário têm dois cursos. Escolha um professor e ignore o outro.
          </p>
          <p>
            Em <span className="text-foreground">Ciclos → Matérias</span> você liga/desliga cada
            disciplina e muda o peso. Em <span className="text-foreground">Montar</span> você gera
            de novo a fila (12 sessões no padrão do método intercalado).
          </p>
          <p className={cn("text-xs")}>
            Regra de ouro: Legislação Tributária e Reforma Tributária só entram depois de Direito
            Tributário 100% teoria.
          </p>
          <Button asChild>
            <Link to="/cycles">Ir para o ciclo e ajustar</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
