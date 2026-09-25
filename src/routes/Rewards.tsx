import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, Plus, Trash2, Pencil, Zap, ShoppingBag, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  createReward,
  deleteReward,
  getRecentRedemptions,
  getRewards,
  updateReward,
} from "@/lib/db/repositories/rewards";
import { getProfile, redeemReward } from "@/lib/gamification/engine";
import { REWARD_DEFAULT_XP_COST } from "@/lib/gamification/constants";
import type { RewardWithStats } from "@/lib/db/types";
import { useCelebrationStore } from "@/stores/celebrationStore";
import { formatDateBR } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function Rewards() {
  const queryClient = useQueryClient();
  const pushEvents = useCelebrationStore((s) => s.pushEvents);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpCost, setXpCost] = useState(String(REWARD_DEFAULT_XP_COST));
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: () => getRewards(true),
  });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: getProfile,
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["reward-redemptions"],
    queryFn: () => getRecentRedemptions(15),
  });

  const activeRewards = rewards.filter((r) => r.isActive);
  const totalXp = profile?.totalXp ?? 0;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setXpCost(String(REWARD_DEFAULT_XP_COST));
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const cost = parseInt(xpCost, 10) || REWARD_DEFAULT_XP_COST;

    if (editingId) {
      await updateReward(editingId, { title, description, xpCost: cost });
    } else {
      await createReward({ title, description, xpCost: cost });
    }

    resetForm();
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
  };

  const startEdit = (reward: RewardWithStats) => {
    setEditingId(reward.id);
    setTitle(reward.title);
    setDescription(reward.description ?? "");
    setXpCost(String(reward.xpCost));
    setShowForm(true);
  };

  const handleToggleActive = async (reward: RewardWithStats) => {
    await updateReward(reward.id, { isActive: !reward.isActive });
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
  };

  const handleDelete = async (id: number) => {
    await deleteReward(id);
    queryClient.invalidateQueries({ queryKey: ["rewards"] });
    queryClient.invalidateQueries({ queryKey: ["reward-redemptions"] });
  };

  const handleRedeem = async (rewardId: number) => {
    setRedeemError(null);
    const result = await redeemReward(rewardId);
    if (!result.success) {
      setRedeemError(result.error ?? "Não foi possível resgatar");
      return;
    }
    pushEvents(result.events);
    queryClient.invalidateQueries();
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-muted-foreground">Gamificação</p>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" />
            Loja de Recompensas
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina prêmios reais e gaste XP ao conquistá-los.
          </p>
        </div>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4">
            <Zap className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Saldo disponível</p>
              <p className="text-2xl font-bold">{totalXp.toLocaleString("pt-BR")} XP</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {redeemError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {redeemError}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova recompensa
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Editar recompensa" : "Nova recompensa"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: 1 episódio de série, café especial, jogo 30 min..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Input
                placeholder="Detalhes ou regras do prêmio"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Custo em XP</Label>
              <Input
                type="number"
                min={1}
                value={xpCost}
                onChange={(e) => setXpCost(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmit}>{editingId ? "Salvar" : "Criar"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : activeRewards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShoppingBag className="mx-auto mb-3 h-10 w-10 opacity-40" />
            <p>Nenhuma recompensa cadastrada ainda.</p>
            <p className="text-sm">Crie prêmios personalizados para motivar seus estudos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeRewards.map((reward) => {
            const canAfford = totalXp >= reward.xpCost;
            return (
              <Card key={reward.id} className={cn(!canAfford && "opacity-75")}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{reward.title}</CardTitle>
                    <Badge variant="secondary">{reward.xpCost} XP</Badge>
                  </div>
                  {reward.description && (
                    <p className="text-sm text-muted-foreground">{reward.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">Resgatada {reward.timesRedeemed}x</Badge>
                  </div>
                  <Button
                    className="w-full"
                    disabled={!canAfford}
                    onClick={() => handleRedeem(reward.id)}
                  >
                    <Gift className="mr-2 h-4 w-4" />
                    {canAfford ? "Resgatar" : "XP insuficiente"}
                  </Button>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => startEdit(reward)}>
                      <Pencil className="mr-1 h-3 w-3" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(reward)}>
                      Desativar
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {rewards.some((r) => !r.isActive) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">Recompensas inativas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards
              .filter((r) => !r.isActive)
              .map((reward) => (
                <div key={reward.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
                  <div>
                    <p className="font-medium">{reward.title}</p>
                    <p className="text-xs text-muted-foreground">{reward.xpCost} XP · {reward.timesRedeemed} resgates</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={reward.isActive} onCheckedChange={() => handleToggleActive(reward)} />
                    <Button size="icon" variant="ghost" onClick={() => startEdit(reward)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(reward.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {redemptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de resgates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(r.redeemedAt)}</p>
                  </div>
                  <span className="text-sm text-destructive">−{r.xpSpent} XP</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
