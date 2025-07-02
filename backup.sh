#!/bin/bash

# Script de backup para o banco de dados do Controle Financeiro

# Garantir que o diretório de backup exista
BACKUP_DIR="/home/user/Documentos/Controle-Financeiro-SQL/backups"
mkdir -p "$BACKUP_DIR"

# Formato do nome do arquivo: database_backup_DATA_HORA.sqlite
BACKUP_FILE="$BACKUP_DIR/database_backup_$(date +"%Y%m%d_%H%M%S").sqlite"

# Desligar o servidor antes do backup (opcional)
# ./start.sh stop

# Copiar o banco de dados
cp /home/user/Documentos/Controle-Financeiro-SQL/database.sqlite "$BACKUP_FILE"

# Reiniciar o servidor após o backup (opcional)
# ./start.sh start

# Verificar se o backup foi criado com sucesso
if [ -f "$BACKUP_FILE" ]; then
  echo -e "\033[32m✓ Backup criado com sucesso: $BACKUP_FILE\033[0m"
  echo -e "\033[32m✓ Tamanho do arquivo: $(du -h "$BACKUP_FILE" | cut -f1)\033[0m"
else
  echo -e "\033[31m✗ Erro ao criar o backup!\033[0m"
  exit 1
fi

# Remover backups mais antigos que 30 dias (opcional)
# find "$BACKUP_DIR" -name "database_backup_*.sqlite" -type f -mtime +30 -delete

exit 0
