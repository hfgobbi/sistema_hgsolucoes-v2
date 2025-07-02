#!/bin/bash

# Script de backup diário para o sistema Controle-Financeiro-SQL
# Criado em: $(date '+%Y-%m-%d')

# Configurações
BACKUP_DIR="/home/user/Documentos/Controle-Financeiro-SQL/backups"
DATA=$(date '+%Y%m%d_%H%M%S')
PROJECT_DIR="/home/user/Documentos/Controle-Financeiro-SQL"

# Criar pasta de backup se não existir
mkdir -p "$BACKUP_DIR"

# 1. Backup do banco de dados PostgreSQL
PGPASSWORD=postgres pg_dump -U postgres -h localhost -d controle_financeiro > "$BACKUP_DIR/database_backup_postgres_$DATA.dump"

# 2. Backup dos arquivos importantes (código-fonte)
tar -czf "$BACKUP_DIR/codigo_backup_$DATA.tar.gz" \
    -C "$PROJECT_DIR" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="backups" \
    controllers models public/js public/views routes config index.js

# 3. Backup específico dos arquivos essenciais para as parcelas
cp "$PROJECT_DIR/controllers/movimentacaoController.js" "$BACKUP_DIR/movimentacaoController_$DATA.js"
cp "$PROJECT_DIR/models/Movimentacao.js" "$BACKUP_DIR/Movimentacao_model_$DATA.js"

# 4. Limpar backups antigos (manter apenas os últimos 7 dias)
find "$BACKUP_DIR" -name "database_backup_postgres_*.dump" -type f -mtime +7 -delete
find "$BACKUP_DIR" -name "codigo_backup_*.tar.gz" -type f -mtime +7 -delete

echo "Backup realizado com sucesso em: $(date)" >> "$BACKUP_DIR/backup_log.txt"

exit 0
