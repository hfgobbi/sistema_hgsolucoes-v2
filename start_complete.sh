#!/bin/bash

# =================================================================
#  HG Soluções Pro 2.0 - PostgreSQL Edition
#  Inicialização Completa (Backend, Frontend e BD)
#  Porta Backend: 8000
#  Data: $(date +"%d/%m/%Y")
# =================================================================

# Cores para terminal
VERDE="\033[0;32m"
AZUL="\033[0;34m"
AMARELO="\033[1;33m"
VERMELHO="\033[0;31m"
MAGENTA="\033[0;35m"
CIANO="\033[0;36m"
NEGRITO="\033[1m"
SEM_COR="\033[0m"

# Configurações da aplicação
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$APP_DIR/.app.pid"
LOG_FILE="$APP_DIR/app.log"
BACKUP_DIR="$APP_DIR/backups"
PORT=8000
DB_NAME="hg_solucoes_pro"

# Função para mostrar banner
show_banner() {
  echo -e "${CIANO}╔═════════════════════════════════════════════════════╗${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}║  ${NEGRITO}${MAGENTA}HG SOLUÇÕES PRO 2.0${SEM_COR}${CIANO}                        ║${SEM_COR}"
  echo -e "${CIANO}║  ${AZUL}PostgreSQL Edition${SEM_COR}${CIANO}                              ║${SEM_COR}"
  echo -e "${CIANO}║                                                     ║${SEM_COR}"
  echo -e "${CIANO}╚═════════════════════════════════════════════════════╝${SEM_COR}"
  echo -e "${VERDE}Porta:${SEM_COR} $PORT | ${VERDE}Log:${SEM_COR} $LOG_FILE | ${VERDE}PID:${SEM_COR} $PID_FILE"
  echo
}

# Função para verificar se o PostgreSQL está em execução
check_postgres() {
  if command -v pg_isready &> /dev/null; then
    if pg_isready -q; then
      return 0  # PostgreSQL está rodando
    else
      return 1  # PostgreSQL não está rodando
    fi
  else
    # Se pg_isready não estiver disponível, tenta com ps
    if ps aux | grep -v grep | grep postgres > /dev/null; then
      return 0  # PostgreSQL está rodando
    else
      return 1  # PostgreSQL não está rodando
    fi
  fi
}

# Função para verificar se o banco de dados existe
check_database_exists() {
  # Verifica se o banco existe usando o psql
  if PGPASSWORD=postgres psql -U postgres -h localhost -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    return 0  # Banco existe
  else
    return 1  # Banco não existe
  fi
}

# Função para criar backup do banco atual (segurança)
create_db_backup() {
  # Verifica se o diretório de backup existe
  mkdir -p "$BACKUP_DIR"
  
  # Nome do arquivo de backup com timestamp
  local backup_file="$BACKUP_DIR/db_backup_before_start_$(date '+%Y%m%d_%H%M%S').dump"
  
  # Cria backup do banco se ele existir
  echo -e "${AMARELO}Criando backup de segurança do banco atual...${SEM_COR}"
  
  if check_database_exists; then
    PGPASSWORD=postgres pg_dump -U postgres -h localhost -d "$DB_NAME" > "$backup_file"
    
    if [ $? -eq 0 ]; then
      echo -e "${VERDE}✓ Backup criado com sucesso: $backup_file${SEM_COR}"
    else
      echo -e "${VERMELHO}⚠️ Erro ao criar backup, mas vamos continuar...${SEM_COR}"
    fi
  else
    echo -e "${AMARELO}Banco de dados não existe ainda. Pulando backup.${SEM_COR}"
  fi
}

# Função para iniciar o PostgreSQL
start_postgres() {
  if ! check_postgres; then
    echo -e "${AMARELO}PostgreSQL não está rodando. Tentando iniciar...${SEM_COR}"
    
    # Diferentes comandos para iniciar PostgreSQL dependendo da distribuição
    if [ -f /etc/init.d/postgresql ]; then
      echo -e "${VERDE}Iniciando PostgreSQL via init.d...${SEM_COR}"
      sudo /etc/init.d/postgresql start
    elif command -v systemctl &> /dev/null; then
      # Detectar versão do PostgreSQL para systemd
      local pg_services=$(systemctl list-unit-files | grep postgresql | awk '{print $1}')
      
      if [ -n "$pg_services" ]; then
        # Pega o primeiro serviço PostgreSQL disponível
        local pg_service=$(echo "$pg_services" | head -n 1)
        echo -e "${VERDE}Iniciando PostgreSQL via systemd ($pg_service)...${SEM_COR}"
        sudo systemctl start "$pg_service"
      else
        echo -e "${VERDE}Iniciando PostgreSQL via systemd (serviço genérico)...${SEM_COR}"
        sudo systemctl start postgresql
      fi
    else
      echo -e "${VERMELHO}Não foi possível iniciar o PostgreSQL automaticamente.${SEM_COR}"
      echo -e "${AMARELO}Por favor, inicie o PostgreSQL manualmente e tente novamente.${SEM_COR}"
      return 1
    fi
    
    # Aguarde o PostgreSQL iniciar com feedback visual
    echo -e "${AMARELO}Aguardando PostgreSQL iniciar.${SEM_COR}"
    for i in {1..10}; do
      echo -n "."
      if check_postgres; then
        echo -e "\n${VERDE}PostgreSQL iniciado com sucesso!${SEM_COR}"
        break
      fi
      sleep 1
      
      # Se após 10 tentativas ainda não iniciar, falha
      if [ $i -eq 10 ] && ! check_postgres; then
        echo -e "\n${VERMELHO}Falha ao iniciar o PostgreSQL após 10 tentativas.${SEM_COR}"
        return 1
      fi
    done
  fi
  
  echo -e "${VERDE}✓ PostgreSQL está rodando e pronto.${SEM_COR}"
  return 0
}

# Função para instalar dependências necessárias
install_dependencies() {
  cd "$APP_DIR" || exit 1
  
  # Verificar se as dependências estão instaladas
  if [ ! -d "node_modules" ]; then
    echo -e "${AMARELO}Instalando dependências...${SEM_COR}"
    npm install
    
    # Verificar se a instalação foi bem sucedida
    if [ $? -ne 0 ]; then
      echo -e "${VERMELHO}Erro ao instalar dependências.${SEM_COR}" >&2
      exit 1
    else
      echo -e "${VERDE}✓ Dependências instaladas com sucesso.${SEM_COR}"
    fi
  else
    echo -e "${VERDE}✓ Dependências já estão instaladas.${SEM_COR}"
  fi
}

# Função para verificar atualizações de banco de dados necessárias
check_db_updates() {
  # Verificar se há scripts de migração não executados
  if [ -f "$APP_DIR/adicionar_campos_parcelas.js" ]; then
    echo -e "${AMARELO}Verificando se é necessário atualizar o banco de dados...${SEM_COR}"
    
    # Verificar se a tabela Movimentacaos já tem os campos de parcelas
    # Esta consulta vai verificar se o campo parcelas_total existe
    local has_parcelas=$(PGPASSWORD=postgres psql -U postgres -h localhost -d "$DB_NAME" -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='movimentacaos' AND column_name='parcelas_total';")
    
    if [ -z "$has_parcelas" ]; then
      echo -e "${AMARELO}Campos de parcelas não encontrados. Executando migração...${SEM_COR}"
      
      # Criar backup antes de migrar
      create_db_backup
      
      # Executar a migração
      node "$APP_DIR/adicionar_campos_parcelas.js"
      
      if [ $? -eq 0 ]; then
        echo -e "${VERDE}✓ Migração de banco de dados concluída com sucesso.${SEM_COR}"
      else
        echo -e "${VERMELHO}⚠️ Erro durante a migração do banco de dados.${SEM_COR}"
        echo -e "${AMARELO}Continuando mesmo assim, mas o sistema pode não funcionar corretamente.${SEM_COR}"
      fi
    else
      echo -e "${VERDE}✓ Banco de dados já está atualizado com os campos de parcelas.${SEM_COR}"
    fi
  fi
}

# Função para iniciar o backend
start_backend() {
  cd "$APP_DIR" || exit 1
  
  # Verificar se a aplicação já está rodando
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${AMARELO}O backend já está rodando (PID: $PID).${SEM_COR}"
      return 0
    else
      # Remove arquivo PID inválido
      rm "$PID_FILE"
    fi
  fi
  
  # Iniciar o backend em modo daemon
  echo -e "${VERDE}Iniciando backend em segundo plano na porta $PORT...${SEM_COR}"
  PORT=$PORT nohup node index.js > "$LOG_FILE" 2>&1 &
  echo $! > "$PID_FILE"
  echo -e "${VERDE}Backend iniciado com sucesso (PID: $(cat "$PID_FILE"))${SEM_COR}"
  
  # Aguardar servidor iniciar completamente
  echo -e "${AMARELO}Aguardando backend iniciar completamente...${SEM_COR}"
  sleep 3
}

# Função para verificar requisitos do frontend
check_frontend_deps() {
  # Verificar se o diretório public existe
  if [ -d "$APP_DIR/public" ]; then
    echo -e "${VERDE}✓ Frontend detectado em $APP_DIR/public${SEM_COR}"
    return 0
  else
    echo -e "${VERMELHO}Diretório frontend não encontrado!${SEM_COR}"
    return 1
  fi
}

# Função principal - iniciar tudo
start_all() {
  show_banner
  echo -e "${NEGRITO}${MAGENTA}INICIANDO O SISTEMA COMPLETO (Backend, Frontend e BD)...${SEM_COR}"
  echo
  
  # 1. Verificar requisitos
  if ! [ -x "$(command -v node)" ]; then
    echo -e "${VERMELHO}Erro: Node.js não está instalado.${SEM_COR}" >&2
    exit 1
  fi
  
  # 2. Criar backup de segurança se o banco já existir
  create_db_backup
  
  # 3. Iniciar PostgreSQL
  if ! start_postgres; then
    echo -e "${VERMELHO}Não foi possível iniciar o PostgreSQL. Abortando.${SEM_COR}"
    exit 1
  fi
  
  # 4. Instalar dependências
  install_dependencies
  
  # 5. Verificar e executar migrações de banco de dados
  check_db_updates
  
  # 6. Verificar frontend
  if ! check_frontend_deps; then
    echo -e "${AMARELO}Aviso: Frontend não detectado ou incompleto.${SEM_COR}"
    echo -e "${AMARELO}O sistema continuará com recursos limitados.${SEM_COR}"
  fi
  
  # 7. Iniciar backend
  start_backend
  
  # 8. Exibir instruções de acesso
  echo
  echo -e "${VERDE}=== Sistema iniciado com sucesso! ===${SEM_COR}"
  echo -e "${AZUL}Acesse a aplicação em: http://localhost:$PORT${SEM_COR}"
  echo -e "${AZUL}Credenciais de admin: login: admin / senha: admin123${SEM_COR}"
  echo -e "${AMARELO}Para verificar o status do sistema, execute: ./start_complete.sh status${SEM_COR}"
  echo -e "${AMARELO}Para parar o sistema, execute: ./start_complete.sh stop${SEM_COR}"
  echo
}

# Função para parar a aplicação
stop_app() {
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${AMARELO}Criando backup antes de encerrar...${SEM_COR}"
      create_db_backup
      
      echo -e "${AMARELO}Parando servidor (PID: $PID)...${SEM_COR}"
      kill "$PID"
      rm "$PID_FILE"
      echo -e "${VERDE}Servidor parado com sucesso.${SEM_COR}"
    else
      echo -e "${AMARELO}Servidor não está rodando.${SEM_COR}"
      rm "$PID_FILE"
    fi
  else
    echo -e "${AMARELO}Servidor não está rodando.${SEM_COR}"
  fi
}

# Função para verificar status da aplicação
status_app() {
  # Verificar status do PostgreSQL
  if check_postgres; then
    echo -e "${VERDE}✓ PostgreSQL está rodando${SEM_COR}"
  else
    echo -e "${VERMELHO}✗ PostgreSQL não está rodando${SEM_COR}"
  fi
  
  # Verificar status do backend
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if ps -p "$PID" > /dev/null; then
      echo -e "${VERDE}✓ Backend está rodando (PID: $PID)${SEM_COR}"
    else
      echo -e "${VERMELHO}✗ Backend não está rodando (arquivo PID inválido)${SEM_COR}"
      rm "$PID_FILE"
    fi
  else
    echo -e "${VERMELHO}✗ Backend não está rodando${SEM_COR}"
  fi
  
  # Verificar banco de dados
  if check_database_exists; then
    echo -e "${VERDE}✓ Banco de dados '$DB_NAME' existe${SEM_COR}"
  else
    echo -e "${VERMELHO}✗ Banco de dados '$DB_NAME' não existe${SEM_COR}"
  fi
  
  # Verificar frontend
  if [ -d "$APP_DIR/public" ]; then
    echo -e "${VERDE}✓ Frontend está disponível${SEM_COR}"
  else
    echo -e "${VERMELHO}✗ Frontend não está disponível${SEM_COR}"
  fi
  
  echo -e "${AZUL}Acesse a aplicação em: http://localhost:$PORT${SEM_COR}"
}

# Processar argumentos da linha de comando
case "$1" in
  start)
    start_all
    ;;
  stop)
    stop_app
    ;;
  restart)
    stop_app
    sleep 2
    start_all
    ;;
  status)
    status_app
    ;;
  *)
    show_banner
    echo -e "${NEGRITO}COMANDOS DISPONÍVEIS:${SEM_COR}"
    echo -e "  ${VERDE}start${SEM_COR}     - Inicia o sistema completo (BD, backend e frontend)"
    echo -e "  ${VERDE}stop${SEM_COR}      - Para o servidor"
    echo -e "  ${VERDE}restart${SEM_COR}   - Reinicia o servidor"
    echo -e "  ${VERDE}status${SEM_COR}    - Verifica o status de todos os componentes"
    echo 
    echo -e "${AZUL}Acesso:${SEM_COR} http://localhost:$PORT"
    exit 1
    ;;
esac

exit 0
