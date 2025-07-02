#!/bin/bash

# Cores para saída no terminal
VERDE="\033[0;32m"
AMARELO="\033[1;33m"
VERMELHO="\033[0;31m"
SEM_COR="\033[0m"

# Verifica se recebeu o nome do arquivo de backup
if [ $# -ne 1 ]; then
    echo -e "${VERMELHO}Uso: $0 nome_do_arquivo_de_backup${SEM_COR}"
    echo -e "${AMARELO}Exemplo: $0 database_backup_postgres_20250701_112205.dump${SEM_COR}"
    
    echo -e "\nBackups disponíveis:"
    ls -la backups/*.dump 2>/dev/null || echo -e "${VERMELHO}Nenhum backup encontrado na pasta backups/${SEM_COR}"
    
    exit 1
fi

BACKUP_FILE="backups/$1"

# Verifica se o arquivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${VERMELHO}Erro: Arquivo de backup $BACKUP_FILE não encontrado!${SEM_COR}"
    exit 1
fi

# Confirma a restauração
echo -e "${AMARELO}ATENÇÃO: Esta operação vai substituir o banco de dados atual pelo backup.${SEM_COR}"
echo -e "${AMARELO}Todos os dados atuais serão perdidos.${SEM_COR}"
read -p "Deseja continuar? (s/N): " confirma

if [[ ! "$confirma" =~ ^[sS](im)?$ ]]; then
    echo -e "${AMARELO}Operação cancelada pelo usuário.${SEM_COR}"
    exit 0
fi

# Restaura o backup
echo -e "Restaurando backup a partir de $BACKUP_FILE..."
PGPASSWORD=postgres pg_restore -U postgres -h localhost -d controle_financeiro --clean --if-exists -v "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${VERDE}✓ Backup restaurado com sucesso!${SEM_COR}"
    echo -e "${VERDE}✓ O sistema está pronto para uso.${SEM_COR}"
else
    echo -e "${VERMELHO}✗ Erro ao restaurar o backup.${SEM_COR}"
    echo -e "${AMARELO}Verifique os erros acima.${SEM_COR}"
fi
