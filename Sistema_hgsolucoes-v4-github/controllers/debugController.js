// Controlador para depuração
const { sequelize } = require('../config/database');

module.exports = () => {
  const controller = {};

  // Executar uma consulta SQL para depuração
  controller.executarSQL = async (req, res) => {
    try {
      // Por razões de segurança, esta função só deve ser usada em ambiente de desenvolvimento
      // e deve ser removida em produção
      
      const { query } = req.body;
      
      // Verificar se a consulta está presente
      if (!query) {
        return res.status(400).json({ message: 'Consulta SQL não fornecida' });
      }
      
      // Apenas permite consultas SELECT para evitar alterações no banco de dados
      if (!query.trim().toLowerCase().startsWith('select')) {
        return res.status(403).json({ message: 'Apenas consultas SELECT são permitidas' });
      }
      
      // Executar a consulta
      const [resultado] = await sequelize.query(query);
      
      return res.status(200).json(resultado);
    } catch (error) {
      console.error('Erro durante depuração SQL:', error);
      return res.status(500).json({ message: 'Erro ao executar consulta', error: error.message });
    }
  };
  
  return controller;
};
