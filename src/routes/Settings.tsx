import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Download, Upload, HardDriveDownload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getProfile, updateProfile } from "@/lib/gamification/profile";
import { getSettings, updateSettings } from "@/lib/db/repositories/settings";
import { exportDatabaseBackup, importDatabaseBackup } from "@/lib/backup";

export function Settings() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [dailyGoal, setDailyGoal] = useState("60");
  const [targetDate, setTargetDate] = useState("");
  const [checkInEnabled, setCheckInEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);

  const { data } = useQuery({
    queryKey: ["settings-page"],
    queryFn: async () => {
      const [profile, settings] = await Promise.all([getProfile(), getSettings()]);
      return { profile, settings };
    },
  });

  useEffect(() => {
    if (data) {
      setName(data.profile.name);
      setDailyGoal(data.profile.dailyGoalMin.toString());
      setTargetDate(data.settings.futureTargetDate);
      setCheckInEnabled(data.settings.checkInEnabled);
    }
  }, [data]);

  const handleSave = async () => {
    await updateProfile({
      name: name.trim() || "Operador",
      dailyGoalMin: parseInt(dailyGoal, 10) || 60,
    });
    await updateSettings({
      futureTargetDate: targetDate,
      checkInEnabled,
    });
    setSaved(true);
    queryClient.invalidateQueries();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    setBackupBusy(true);
    try {
      const path = await exportDatabaseBackup();
      if (path) {
        alert(`Backup exportado com sucesso.\n\nSalve na pasta do Google Drive para usar no outro PC.`);
      }
    } catch {
      alert("Não foi possível exportar o backup.");
    } finally {
      setBackupBusy(false);
    }
  };

  const handleImport = async () => {
    const confirmed = window.confirm(
      "Importar um backup substitui todos os dados locais deste computador.\n\n" +
        "Use o arquivo mais recente exportado do outro PC. Deseja continuar?",
    );
    if (!confirmed) return;

    setBackupBusy(true);
    try {
      const path = await importDatabaseBackup();
      if (!path) return;

      alert("Backup importado. O app será recarregado com os dados restaurados.");
      queryClient.clear();
      window.location.reload();
    } catch {
      alert("Não foi possível importar o backup. Verifique se o arquivo é um .db válido do Sigma.");
    } finally {
      setBackupBusy(false);
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-xl">
      <div>
        <p className="text-sm uppercase tracking-widest text-muted-foreground">Sistema</p>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do operador</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Meta diária (minutos)</Label>
            <Input type="number" min={1} value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Preferências</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Check-in diário ao abrir</Label>
            <Switch checked={checkInEnabled} onCheckedChange={setCheckInEnabled} />
          </div>
          <div className="space-y-2">
            <Label>Data alvo (Meu Futuro)</Label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDriveDownload className="h-5 w-5 text-primary" />
            Backup entre computadores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Use um PC por vez. Ao terminar no notebook, exporte o backup para o Google Drive. No
            desktop, importe antes de estudar. O Sigma guarda o banco em{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              AppData\Roaming\com.operacao.sigma\sigma.db
            </code>
            .
          </p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Feche o Sigma no outro PC (se estiver aberto).</li>
            <li>Exporte o backup e salve na pasta sincronizada do Drive.</li>
            <li>No PC que vai usar, importe o arquivo .db mais recente.</li>
          </ol>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport} disabled={backupBusy}>
              <Download className="mr-2 h-4 w-4" />
              Exportar backup
            </Button>
            <Button variant="outline" onClick={handleImport} disabled={backupBusy}>
              <Upload className="mr-2 h-4 w-4" />
              Importar backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>{saved ? "Salvo!" : "Salvar"}</Button>
    </div>
  );
}
