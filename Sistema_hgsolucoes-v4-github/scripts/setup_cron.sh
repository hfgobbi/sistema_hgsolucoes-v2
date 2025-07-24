#!/bin/bash

# Script para configurar tarefas cron para manutenção do sistema

# Caminho base do projeto (ajuste conforme necessário)
PROJECT_PATH="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS_PATH="${PROJECT_PATH}/scripts"

# Tornar os scripts executáveis
chmod +x "${SCRIPTS_PATH}/health_check.js"

# Backup diário às 03:00
BACKUP_CRON="0 3 * * * ${PROJECT_PATH}/backup_diario.sh > /dev/null 2>&1"

# Verificação de saúde do sistema às 07:00
HEALTH_CHECK_CRON="0 7 * * * node ${SCRIPTS_PATH}/health_check.js > ${PROJECT_PATH}/health_check.log 2>&1"

# Rotação de logs no primeiro dia do mês
LOG_ROTATION_CRON="0 4 1 * * find ${PROJECT_PATH} -name '*.log' -size +10M -exec mv {} {}.old \;"

# Adicionar ao crontab do usuário atual
(crontab -l 2>/dev/null | grep -v "${PROJECT_PATH}" ; echo "$BACKUP_CRON" ; echo "$HEALTH_CHECK_CRON" ; echo "$LOG_ROTATION_CRON") | crontab -

echo "Tarefas cron configuradas com sucesso:"
echo "1. Backup diário às 03:00"
echo "2. Verificação de saúde do sistema às 07:00"
echo "3. Rotação de logs no primeiro dia do mês"
