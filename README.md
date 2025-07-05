# Controle Financeiro - PostgreSQL Edition

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![AngularJS](https://img.shields.io/badge/AngularJS-E23237?style=for-the-badge&logo=angularjs&logoColor=white)](https://angularjs.org/)
[![Versão](https://img.shields.io/badge/Versão-2.3.0-blue?style=for-the-badge)](https://github.com/hfgobbi/sistema_hgsolucoes-v2)

Sistema completo de gerenciamento financeiro pessoal com backend em Node.js/Express e frontend em AngularJS, utilizando PostgreSQL como banco de dados. Permite controle de receitas, despesas (incluindo parceladas), categorias, com visualização de gráficos, relatórios avançados, dashboard interativo, exportação de dados e notificações por email.

## 📋 Estrutura do Projeto

```
Controle-Financeiro-SQL/
├── backups/                  # Backups do banco de dados e código
├── config/                   # Configurações do sistema
│   └── database.js           # Configuração do PostgreSQL e Sequelize
├── controllers/              # Controladores da API
│   ├── authController.js     # Autenticação e usuários
│   ├── categoriaController.js # Gerenciamento de categorias
│   ├── dashboardController.js # Dashboard financeiro aprimorado
│   ├── debugController.js    # Ferramentas de depuração
│   ├── exportController.js   # Exportação de dados (CSV, JSON)
│   ├── movimentacaoController.js # Movimentações financeiras (incluindo parcelas)
│   └── relatorioController.js # Relatórios financeiros avançados
├── models/                   # Modelos de dados (Sequelize)
│   ├── Categoria.js
│   ├── Movimentacao.js       # Incluindo campos para parcelas
│   ├── Usuario.js
│   └── index.js             # Configuração do ORM
├── public/                   # Frontend (AngularJS)
│   ├── css/                  # Estilos CSS
│   ├── js/                   # JavaScript
│   │   ├── controllers/      # Controllers AngularJS
│   │   │   ├── dashboardController.js # Controller do dashboard aprimorado
│   │   │   └── relatoriosController.js # Controller de relatórios avançados
│   │   └── services/         # Services AngularJS
│   ├── views/                # Templates HTML
│   ├── debug_movimentacoes.html # Página de depuração
│   └── index.html            # Página principal
├── routes/                   # Rotas da API
│   ├── authRoutes.js
│   ├── categoriaRoutes.js
│   ├── dashboardRoutes.js    # Rotas para o dashboard aprimorado
│   ├── debugRoutes.js
│   ├── exportRoutes.js       # Rotas para exportação de dados
│   ├── index.js              # Configuração central de rotas
│   ├── movimentacaoRoutes.js
│   └── relatorioRoutes.js    # Rotas para relatórios avançados
├── scripts/                 # Scripts de manutenção e monitoramento
│   ├── check_vencimentos.js  # Verifica vencimentos próximos e envia notificações
│   └── health_check.js       # Verifica a saúde do sistema
├── utils/                    # Utilitários diversos
│   ├── emailService.js       # Serviço de envio de emails e notificações
│   └── logger.js             # Sistema de logging avançado
├── app.log                   # Logs da aplicação
├── backup_diario.sh          # Script para backup diário automático
├── index.js                  # Ponto de entrada da aplicação
├── package.json              # Dependências do projeto
├── README.md                 # Este arquivo
├── start.sh                  # Script original para gerenciar o servidor
└── start_complete.sh         # Script aprimorado para iniciar todo o sistema
```

## 🗃️ Estrutura do Banco de Dados

### Tabela: Usuarios
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | INTEGER | Chave primária autoincrement |
| nome | VARCHAR(255) | Nome do usuário |
| login | VARCHAR(255) | Login único do usuário |
| senha | VARCHAR(255) | Senha criptografada |
| data_nascimento | DATE | Data de nascimento |
| saldo | DECIMAL(10,2) | Saldo atual do usuário |
| admin | TINYINT(1) | Flag de administrador |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### Tabela: Categoria
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | INTEGER | Chave primária autoincrement |
| descricao | VARCHAR(255) | Nome da categoria |
| usuario_id | INTEGER | Referência ao usuário (FK) |
| data_criacao | DATETIME | Data de criação do registro |
| data_atualizacao | DATETIME | Data da última atualização |

### Tabela: Movimentacaos
| Campo | Tipo | Descrição |
|-------|------|----------|
| id | INTEGER | Chave primária autoincrement |
| descricao | VARCHAR(255) | Descrição da movimentação |
| valor | DECIMAL(10,2) | Valor da movimentação |
| tipo | ENUM | Tipo (receita/despesa) |
| data | DATE | Data da competência |
| data_vencimento | DATE | Data de vencimento |
| status | ENUM | Status (pendente/pago/cancelado) |
| observacao | TEXT | Observações opcionais |
| tipo_frequencia | ENUM | Frequência (única, mensal, parcelada) |
| parcelas_total | INTEGER | Número total de parcelas (para tipo_frequencia='parcelada') |
| parcela_atual | INTEGER | Número da parcela atual (para tipo_frequencia='parcelada') |
| movimentacao_pai_id | INTEGER | ID da movimentação original (para vincular parcelas) |
| usuario_id | INTEGER | Referência ao usuário (FK) |
| categoria_id | INTEGER | Referência à categoria (FK) |
| data_criacao | TIMESTAMP | Data de criação do registro |
| data_atualizacao | TIMESTAMP | Data da última atualização |

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js (v12 ou superior)
- npm ou yarn
- PostgreSQL (v10 ou superior)
- Usuário PostgreSQL com permissões de criação

### Instalação

```bash
# Clonar o repositório
git clone https://seu-repositorio/Controle-Financeiro-SQL.git
cd Controle-Financeiro-SQL

# Instalar dependências
npm install

# Criar banco de dados PostgreSQL
psql -U postgres -c "CREATE DATABASE controle_financeiro;"

# Iniciar sistema completo
./start_complete.sh start
```

## 🛠️ Scripts Disponíveis

### Script start_complete.sh (Recomendado)
- `./start_complete.sh start`: Inicia todo o sistema (PostgreSQL, backend e frontend)
- `./start_complete.sh stop`: Para o servidor
- `./start_complete.sh restart`: Reinicia todo o sistema
- `./start_complete.sh status`: Verifica o status de todos os componentes do sistema

### Script start.sh (Original)
- `./start.sh start`: Inicia o servidor na porta 8000
- `./start.sh daemon`: Inicia o servidor em modo daemon (segundo plano)
- `./start.sh stop`: Para o servidor
- `./start.sh restart`: Reinicia o servidor
- `./start.sh status`: Verifica o status do servidor

### Scripts de Backup
- `backup_diario.sh`: Script configurado no cron para backup automático diário
  - Execução: `0 1 * * *` (todos os dias à 1h da manhã)
  - Realiza backup do banco de dados e código fonte
  - Mantém histórico de 7 dias de backups

### Scripts de Migração
- `adicionar_campos_parcelas.js`: Migração para adicionar suporte a parcelas no banco de dados
  - Executado automaticamente durante a inicialização se necessário

## 📊 Funcionalidades

### Autenticação
- Login e registro de usuários
- Proteção de rotas com middleware de autenticação

### Gerenciamento Financeiro
- Cadastro de receitas e despesas
- **Despesas Parceladas**: Suporte completo a despesas parceladas
  - Criação automática das parcelas futuras
  - Exibição de "Parcela X/Y" nas movimentações
  - Distribuição das parcelas nos meses corretos
  - Visualização integrada no fluxo de caixa mensal
- Categorização de movimentações
- Filtro por período (mês/ano)
- Datas de competência e vencimento separadas
- Cálculo automático de saldo

### Dashboard Aprimorado
- Gráficos de evolução mensal usando Chart.js
- Gráficos por categoria com dados interativos
- Resumo financeiro em cards visuais
- Próximos vencimentos com botão para pagamento rápido
- Últimas movimentações com visualização detalhada
- Seleção de período para análise personalizada

### Relatórios Avançados
- Fluxo de caixa mensal anualizado
- Gastos por categoria em período específico
- Evolução patrimonial em diversos períodos (3, 6, 12, 24 meses)
- Visualização gráfica interativa de dados financeiros

### Exportação de Dados
- Exportação de movimentações em CSV (compatível com Excel/Google Sheets)
- Exportação de movimentações em JSON (para desenvolvedores/integrações)
- Filtros por período, categoria e tipo de movimentação

### Sistema de Notificações
- Alertas por email para vencimentos próximos
- Templates de email responsivos e informativos
- Configuração flexível de parâmetros de notificação

### Diagnóstico e Depuração
- Página de debug para consultas SQL
- Scripts de manutenção do banco
- Monitoramento de saúde do sistema
- Logs detalhados e estruturados

## 🔧 Manutenção

### Backup do Banco de Dados
```bash
./backup_diario.sh
```
Cria backups em `/backups/` com os seguintes arquivos:
- `database_backup_postgres_DATA_HORA.dump`: Backup completo do PostgreSQL
- `codigo_backup_DATA_HORA.tar.gz`: Backup do código-fonte
- Backups específicos dos arquivos críticos relacionados às parcelas

### Inicialização do Sistema
```bash
./start_complete.sh start
```
Inicia todo o sistema, incluindo PostgreSQL, backend e frontend

### Verificação do Status
```bash
./start_complete.sh status
```
Verifica o status de todos os componentes (PostgreSQL, backend, frontend)

## 🔍 Depuração

- Logs disponíveis em `app.log`
- Página de debug em `http://localhost:8000/debug_movimentacoes.html`

## 📝 Status de Desenvolvimento e Próximos Passos

### Implementado até 03/07/2025:

- ✅ Dashboard financeiro aprimorado com visualização de saldo, fluxo de caixa e vencimentos
- ✅ Relatórios financeiros avançados (fluxo de caixa, categorias, evolução patrimonial)
- ✅ Exportação de dados em formatos CSV e JSON
- ✅ Sistema de notificações por email para vencimentos próximos
- ✅ Script de verificação de saúde do sistema corrigido
- ✅ Integração de Chart.js para gráficos interativos

### Próximos Passos Recomendados:

- ⬜ Testes unitários para os novos controladores (relatórios, exportação, dashboard)
- ⬜ Configuração do serviço de email em ambiente de produção
- ⬜ Integração do script de verificação de vencimentos no cron (sugestão: diário às 7h)
- ⬜ Melhorias na responsividade do frontend para dispositivos móveis
- ⬜ Implementação de dashboard para dispositivos móveis
- ⬜ Implementação de métricas de performance do sistema
- ⬜ Criação de versão API para integração com outros sistemas

## 📊 Backlog de Funcionalidades

- Sistema de metas financeiras
- Upload de comprovantes para movimentações
- Dashboards personalizados por usuário
- Geração de relatórios fiscais (imposto de renda)
- Integração com APIs bancárias

## 🔄 Correções Recentes

### Resolvido em 04/07/2025

1. **Confirmação de Pagamento**: Implementada confirmação detalhada ao marcar despesas como pagas com feedback visual
2. **Método HTTP Corrigido**: Alinhado método HTTP entre frontend e backend para marcação de pagamentos
3. **Feedback Visual**: Adicionado indicador de carregamento durante processamento do pagamento
4. **UX Melhorada**: Implementado atraso controlado para garantir visibilidade da confirmação e atualização dos dados

### Resolvido em 03/07/2025

1. **Correção do Dashboard Financeiro**: Correções implementadas para resolver erros 500 no backend e problemas de renderização no frontend.
   - Removidas referências ao valor `'cancelado'` no filtro `status_pagamento` (não existe no enum do PostgreSQL)
   - Corrigida função `alterarPeriodo()` no frontend que chamava função inexistente `carregarDados()`
   - Implementado tratamento robusto de tipos para mês e ano tanto no frontend quanto no backend
   - Melhorado tratamento de erros para evitar quebras na interface quando APIs retornam erro
   
### Problemas Pendentes
   - Ainda ocorrem erros 500 ao selecionar alguns meses específicos (maio/5)
   - Possíveis problemas na integração com toastr para notificações
   - O gráfico de fluxo mensal pode não estar sendo atualizado corretamente ao trocar o período

### Correções Anteriores

1. **Implementação de Parcelas**: Adicionado suporte completo a despesas parceladas
2. **Formatação de Valores**: Corrigido problema com formato numérico para evitar erro no AngularJS
3. **Listagem de Movimentações**: Aprimorada para exibir parcelas nos meses corretos
4. **Migração para PostgreSQL**: Sistema migrado de SQLite para PostgreSQL
5. **Scripts de Backup**: Implementada rotina de backup diário automático
6. **Script de Inicialização**: Criado script completo que configura todo o ambiente

## 🔗 API Endpoints

### Autenticação
- `POST /api/login`: Autenticação de usuários
- `POST /api/register`: Registro de novos usuários

### Categorias
- `GET /api/categorias`: Lista categorias do usuário
- `POST /api/categorias`: Cria nova categoria
- `PUT /api/categorias/:id`: Atualiza categoria
- `DELETE /api/categorias/:id`: Remove categoria

### Movimentações
- `GET /api/movimentacoes`: Lista movimentações (filtros via query)
  - Parâmetros adicionais: `mes`, `ano`, `categoria_id`, `tipo`
- `GET /api/movimentacoes/:id`: Obtém detalhes de movimentação
- `POST /api/movimentacoes`: Cria nova movimentação
  - Suporte a parâmetro `parcelas_total` para despesas parceladas
- `PUT /api/movimentacoes/:id`: Atualiza movimentação
- `DELETE /api/movimentacoes/:id`: Remove movimentação
- `PUT /api/movimentacoes/:id/pagar`: Marca uma movimentação como paga

### Debug
- `POST /api/debug/sql`: Executa consultas SQL para depuração

## 📚 Tecnologias Utilizadas

### Backend
- Node.js
- Express
- Sequelize ORM
- PostgreSQL
- Suporte a ENUMs nativos

### Frontend
- AngularJS 1.x
- Bootstrap 4
- Chart.js
- Formulários dinâmicos para parcelas

## 🧩 Detalhes da Funcionalidade de Parcelas

### Como Funciona

1. **Criação de Despesa Parcelada**:
   - No formulário de nova movimentação, selecione frequência "parcelada"
   - Informe o número de parcelas (mínimo 2)
   - A primeira parcela será criada com a data informada
   - As parcelas subsequentes serão criadas automaticamente

2. **Distribuição das Parcelas**:
   - A data de competência (`data`) permanece a mesma para todas as parcelas
   - A data de vencimento (`data_vencimento`) é incrementada mensalmente
   - Ex: Parcela 1 vence em 10/07, Parcela 2 em 10/08, Parcela 3 em 10/09, etc.

3. **Visualização**:
   - Cada parcela aparece no mês correspondente à sua data de vencimento
   - Todas as parcelas mostram indicador "Parcela X/Y" na listagem
   - As parcelas estão vinculadas entre si pelo campo `movimentacao_pai_id`

4. **Gerenciamento**:
   - Cada parcela pode ser paga individualmente
   - As datas de vencimento podem ser ajustadas se necessário

### Campos no Banco de Dados

- `parcelas_total`: Número total de parcelas da movimentação
- `parcela_atual`: Número da parcela atual (1, 2, 3...)
- `movimentacao_pai_id`: ID da movimentação principal (da primeira parcela)

## 🔧 Solução de Problemas Comuns

### Parcelas não aparecem no mês correto

**Solução**: Verifique se a data de vencimento (`data_vencimento`) está correta. A listagem considera essa data para exibir as parcelas no mês adequado.

### Erro na criação de parcelas

**Solução**: 
1. Verifique o formato do valor (deve usar ponto como separador decimal)
2. Confirme que o número de parcelas é maior ou igual a 2
3. Verifique os logs em `app.log` para detalhes do erro

### Erro ao adicionar movimentação: "controller.normalizarData is not a function"

**Solução**: Este problema foi corrigido na versão 2.1.0. A função `normalizarData` agora está corretamente definida como método do objeto `controller`. Se o erro persistir após a atualização:
1. Verifique se está usando a versão mais recente do código
2. Reinicie o servidor completamente usando `./start.sh restart`
3. Verifique o arquivo `/controllers/movimentacaoController.js` para confirmar que todas as chamadas para a função `normalizarData` estão utilizando o prefixo `controller.`

### Postgres não inicia

**Solução**:
```bash
sudo service postgresql start
# ou
sudo systemctl start postgresql
```

### Problemas com banco de dados

**Solução**: Utilize a restauração de backup:
```bash
PGPASSWORD=postgres psql -U postgres -h localhost -c "DROP DATABASE controle_financeiro;"
PGPASSWORD=postgres psql -U postgres -h localhost -c "CREATE DATABASE controle_financeiro;"
PGPASSWORD=postgres psql -U postgres -h localhost -d controle_financeiro < /home/user/Documentos/Controle-Financeiro-SQL/backups/db_backup_before_start_20250701_141159.dump
```

## 📝 Melhorias Futuras

1. **Relatórios Avançados**:
   - Exportação para PDF/Excel
   - Relatórios personalizados por categoria ou período

2. **Interface Responsiva**:
   - Adaptar interface para dispositivos móveis
   - Criar versão PWA

3. **Automações**:
   - Pagamentos recorrentes automáticos
   - Alertas de vencimento
   - Importação de extratos bancários

## 📜 Licença

Este projeto está licenciado sob a licença MIT.
