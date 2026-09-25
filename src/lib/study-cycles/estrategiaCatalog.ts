import type { CycleRole } from "@/lib/db/types";

export type EstrategiaPhase = CycleRole | "SATURDAY";

export interface EstrategiaCourse {
  id: string;
  name: string;
  professor?: string;
  cycleSlug: string | null;
  phase: EstrategiaPhase;
  note?: string;
}

/**
 * Os 24 cursos Pré-Edital ATRF do Estratégia Concursos.
 * Cursos duplicados (dois professores) apontam para a mesma matéria do ciclo — escolha um.
 */
export const ESTRATEGIA_ATRF_COURSES: EstrategiaCourse[] = [
  {
    id: "portugues",
    name: "Língua Portuguesa",
    cycleSlug: "portugues",
    phase: "BASE",
  },
  {
    id: "rlm",
    name: "Raciocínio Lógico Matemático",
    cycleSlug: "raciocinio-logico",
    phase: "BASE",
  },
  {
    id: "constitucional",
    name: "Direito Constitucional",
    cycleSlug: "direito-constitucional",
    phase: "BASE",
    note: "Versão geral do curso",
  },
  {
    id: "constitucional-trindade",
    name: "Direito Constitucional",
    professor: "Prof. João Trindade",
    cycleSlug: "direito-constitucional",
    phase: "BASE",
    note: "Escolha esta ou a versão geral — não faça as duas no ciclo",
  },
  {
    id: "administrativo",
    name: "Direito Administrativo",
    cycleSlug: "direito-administrativo",
    phase: "BASE",
  },
  {
    id: "tributario",
    name: "Direito Tributário",
    cycleSlug: "direito-tributario",
    phase: "BASE",
  },
  {
    id: "contabilidade-possati",
    name: "Contabilidade Geral",
    professor: "Prof. Gilmar Possati",
    cycleSlug: "contabilidade-geral",
    phase: "BASE",
    note: "Escolha um professor de Contabilidade",
  },
  {
    id: "contabilidade-cardozo",
    name: "Contabilidade Geral",
    professor: "Profs. Júlio Cardozo, Luciano Rosa e Silvio Sande",
    cycleSlug: "contabilidade-geral",
    phase: "BASE",
    note: "Escolha um professor de Contabilidade",
  },
  {
    id: "fluencia-dados",
    name: "Fluência em Dados",
    cycleSlug: "informatica",
    phase: "BASE",
  },
  {
    id: "previdenciario-rubens",
    name: "Direito Previdenciário",
    professor: "Prof. Rubens Maurício",
    cycleSlug: "direito-previdenciario",
    phase: "SPECIFIC",
    note: "Escolha um professor de Previdenciário",
  },
  {
    id: "previdenciario-adriana",
    name: "Direito Previdenciário",
    professor: "Profª. Adriana Menezes",
    cycleSlug: "direito-previdenciario",
    phase: "SPECIFIC",
    note: "Escolha um professor de Previdenciário",
  },
  {
    id: "aduaneira",
    name: "Legislação Aduaneira",
    cycleSlug: "legislacao-aduaneira",
    phase: "SPECIFIC",
  },
  {
    id: "ltf",
    name: "Legislação Tributária",
    cycleSlug: "ltf",
    phase: "SPECIFIC",
    note: "Só depois de concluir Direito Tributário",
  },
  {
    id: "reforma-ec132",
    name: "Reforma Tributária (EC nº 132/2023 e LC nº 214/2025)",
    cycleSlug: "ltc",
    phase: "SPECIFIC",
    note: "IBS/CBS. Só depois de Direito Tributário",
  },
  {
    id: "reforma-lc227",
    name: "Reforma Tributária (LC nº 227/2026)",
    cycleSlug: "ltc",
    phase: "SPECIFIC",
    note: "Processo administrativo do IBS. Complementa a outra reforma",
  },
  {
    id: "ingles",
    name: "Língua Inglesa",
    cycleSlug: "ingles",
    phase: "FINAL",
  },
  {
    id: "adm-publica",
    name: "Administração Pública",
    cycleSlug: "administracao-publica",
    phase: "FINAL",
  },
  {
    id: "adm-geral",
    name: "Administração Geral",
    cycleSlug: "administracao-geral",
    phase: "FINAL",
  },
  {
    id: "adm-compras",
    name: "Administração de Compras e Materiais",
    cycleSlug: "administracao-compras",
    phase: "FINAL",
  },
  {
    id: "adm-financeira",
    name: "Administração Financeira",
    cycleSlug: "administracao-financeira",
    phase: "FINAL",
  },
  {
    id: "estatistica",
    name: "Estatística",
    cycleSlug: "estatistica",
    phase: "FINAL",
  },
  {
    id: "trib-jurisprudencial",
    name: "Direito Tributário Jurisprudencial",
    cycleSlug: "direito-tributario-jurisprudencial",
    phase: "FINAL",
    note: "Depois da teoria de Direito Tributário",
  },
  {
    id: "analise-contabil",
    name: "Análise das Demonstrações Contábeis",
    cycleSlug: "analise-demonstracoes",
    phase: "FINAL",
    note: "Depois da teoria de Contabilidade Geral",
  },
  {
    id: "discursivas",
    name: "Discursivas Sem Correção",
    cycleSlug: null,
    phase: "SATURDAY",
    note: "Sábado — ciclo misto, não entra na fila de seg–sex",
  },
];

export const ESTRATEGIA_COURSE_COUNT = ESTRATEGIA_ATRF_COURSES.length;
