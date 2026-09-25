# Arquitetura de hospedagem — aplicações web pessoais

Este documento descreve uma arquitetura simples para hospedar o Sigma Web e
outros aplicativos no mesmo servidor Linux, usando um domínio próprio e para
um volume inicial de aproximadamente 5 a 10 usuários por aplicação.

## Objetivo

- Hospedar aplicações e dados no próprio servidor Linux.
- Acessar cada aplicação por domínio ou subdomínio com HTTPS.
- Manter os dados de cada aplicação isolados.
- Ter uma base segura e simples de manter, sem serviços externos obrigatórios.

## Visão geral

```text
Internet
   |
   v
Domínio e DNS
   |
   v
Servidor Linux
   |
   +-- Nginx (HTTPS e roteamento por domínio)
   |     |
   |     +-- sigma.exemplo.com ----------> Sigma Web (frontend + API)
   |     +-- monitor.exemplo.com --------> Monitor de passagens (frontend + API)
   |     +-- outroapp.exemplo.com -------> Outro aplicativo (frontend + API)
   |
   +-- PostgreSQL (acesso somente interno)
   |     |
   |     +-- banco: sigma
   |     +-- banco: monitor_passagens
   |     +-- banco: outro_app
   |
   +-- Backups criptografados fora do servidor
```

## Componentes

### Nginx

É a porta de entrada pública do servidor. Ele recebe as requisições em HTTPS,
serve os arquivos estáticos do frontend e encaminha chamadas de API para o
backend correto. Cada aplicação terá um arquivo de configuração próprio e
normalmente um subdomínio próprio.

Exemplos:

- `sigma.seudominio.com`
- `passagens.seudominio.com`
- `app.seudominio.com`

O Nginx deve ser o único serviço diretamente exposto para a web nas portas 80
e 443. O certificado HTTPS pode ser renovado automaticamente com Let's Encrypt.

### Aplicações

Cada aplicação deve ser executada como um serviço separado no servidor,
preferencialmente com um usuário Linux próprio e variáveis de ambiente em um
arquivo que não vai para o Git.

Uma aplicação web típica possui:

1. **Frontend:** a interface que o navegador baixa e executa (React/Vite, por
   exemplo).
2. **API/backend:** responsável por autenticação, regras de negócio e acesso
   ao banco.
3. **Banco de dados:** dados persistentes da aplicação.

O frontend não deve acessar o PostgreSQL diretamente. Apenas o backend possui
as credenciais do banco.

### PostgreSQL

Um único PostgreSQL pode servir várias aplicações sem problema. Para manter a
separação, cada aplicação deve ter:

- um banco próprio;
- um usuário próprio do PostgreSQL;
- senha própria e forte;
- permissões apenas sobre o seu banco.

Exemplo de separação:

| Aplicação | Banco | Usuário do banco |
| --- | --- | --- |
| Sigma Web | `sigma` | `sigma_app` |
| Monitor de passagens | `monitor_passagens` | `monitor_app` |
| Outro app | `outro_app` | `outro_app_user` |

O PostgreSQL deve escutar apenas localmente no servidor (`localhost`), sem
porta pública na internet. Isso reduz muito a superfície de ataque.

Para 5 a 10 usuários, o PostgreSQL terá ampla folga de capacidade. Não é
necessário criar um servidor de banco separado nesta fase.

## Aplicação Sigma: situação atual e migração para web

O Sigma atual é um aplicativo desktop com React/Vite, Tauri e SQLite local.
Para a versão web, boa parte das telas, componentes e regras de gamificação
pode ser reaproveitada. A mudança principal é a camada de persistência:

```text
Hoje (desktop)                         Versão web
------------------------------         -------------------------------
React + Vite + Tauri                   React + Vite
SQLite no computador                   API no servidor
Plugin SQL do Tauri                    PostgreSQL no servidor
Sem login web necessário               Login e dados por usuário
```

O objetivo é substituir as chamadas específicas do Tauri por chamadas à API.
A API verifica o usuário autenticado antes de ler ou gravar qualquer dado.

## Isolamento e segurança mínimos

- Criar uma conta de aplicação para cada backend; não executar tudo como
  `root`.
- Usar senhas fortes e segredos fora do repositório Git.
- Expor somente SSH, HTTP e HTTPS no firewall; restringir o SSH quando
  possível.
- Desativar login SSH por senha após confirmar acesso por chave.
- Não expor PostgreSQL, Redis ou portas internas publicamente.
- Usar HTTPS em todos os subdomínios.
- Criar autenticação e autorização no backend. Nunca confiar apenas em regras
  escondidas no frontend.
- Atualizar regularmente o sistema, Nginx, PostgreSQL e dependências das APIs.

## Backups

O servidor é a cópia de trabalho, não a única cópia dos dados.

Rotina inicial recomendada:

1. Backup diário de cada banco com `pg_dump`.
2. Retenção de pelo menos 7 backups diários e alguns mensais.
3. Cópia automática dos backups para fora do servidor (armazenamento em nuvem,
   outro computador ou outro servidor), de preferência criptografada.
4. Teste periódico de restauração em um banco temporário.

Os arquivos enviados por usuários, caso existam no futuro, também precisam
entrar no backup; `pg_dump` sozinho cobre apenas o banco.

## Estrutura sugerida no servidor

Os caminhos são apenas uma convenção. O importante é não misturar código,
configurações, segredos, logs e backups.

```text
/srv/apps/
  sigma/
    frontend/
    api/
  monitor-passagens/
    frontend/
    api/

/etc/nginx/sites-available/
  sigma
  monitor-passagens

/etc/systemd/system/
  sigma-api.service
  monitor-passagens-api.service

/etc/<app>/
  <app>.env                 # segredos, com permissão restrita

/var/backups/postgresql/
  sigma/
  monitor-passagens/
```

## Crescimento futuro

Esta arquitetura é adequada para a primeira fase. Só vale separar serviços ou
migrar componentes quando houver evidência de necessidade, por exemplo:

- aumento relevante de usuários simultâneos;
- falta de memória, CPU ou armazenamento no servidor;
- processos pesados, como IA local ou geração de arquivos;
- exigência de disponibilidade maior;
- necessidade de hospedar dados especialmente sensíveis.

Até lá, um servidor com Nginx, APIs separadas, PostgreSQL local e backups
externos é uma solução prática, econômica e fácil de administrar.

## Checklist antes de publicar a primeira aplicação

- [ ] DNS do subdomínio aponta para o IP do servidor.
- [ ] Nginx configurado para o subdomínio.
- [ ] Certificado HTTPS ativo e renovação automática testada.
- [ ] Backend executando como serviço `systemd` e reiniciando após falha.
- [ ] Banco e usuário exclusivos da aplicação criados.
- [ ] PostgreSQL sem acesso público.
- [ ] Variáveis de ambiente e senhas fora do Git.
- [ ] Login, autorização e validação no backend implementados.
- [ ] Backup automático criado e restauração testada.
- [ ] Logs da aplicação e do Nginx verificados.
