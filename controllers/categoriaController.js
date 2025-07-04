module.exports = (app) => {
  const controller = {};
  const { Categoria } = app.models;
  
  // Listar todas as categorias do usuário
  controller.listar = async (req, res) => {
    try {
      console.log('Requisição recebida para listar categorias');
      const usuarioId = req.usuario ? req.usuario.id : null;
      
      if (!usuarioId) {
        console.error('Erro: ID do usuário não encontrado no token JWT');
        return res.status(401).json({ erro: 'Autenticação inválida - ID de usuário não encontrado' });
      }
      
      console.log(`Buscando categorias para o usuário ID: ${usuarioId}`);
      
      const categorias = await app.models.Categoria.findAll({ 
        where: { usuario_id: usuarioId },
        order: [['descricao', 'ASC']] 
      });
      
      console.log(`${categorias.length} categorias encontradas para o usuário ${usuarioId}`);
      
      return res.status(200).json(categorias);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ erro: 'Erro ao listar categorias', mensagem: error.message });
    }
  };
  
  // Buscar uma categoria específica
  controller.buscarPorId = async (req, res) => {
    try {
      console.log('Requisição recebida para buscar categoria por ID');
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      // Buscar a categoria
      const categoria = await Categoria.findOne({
        where: { id, usuario_id: usuarioId }
      });
      
      // Verificar se a categoria foi encontrada
      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      return res.status(200).json(categoria);
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Adicionar nova categoria
  controller.adicionar = async (req, res) => {
    try {
      const { descricao } = req.body;
      const usuarioId = req.usuario.id;
      
      // Verificar se a descrição foi fornecida
      if (!descricao) {
        return res.status(400).json({ message: 'Descrição é obrigatória' });
      }
      
      // Verificar se já existe uma categoria com essa descrição para o usuário
      const categoriaExistente = await Categoria.findOne({
        where: { descricao, usuario_id: usuarioId }
      });
      
      if (categoriaExistente) {
        return res.status(400).json({ message: 'Já existe uma categoria com essa descrição' });
      }
      
      // Criar a nova categoria
      const novaCategoria = await Categoria.create({
        descricao,
        usuario_id: usuarioId
      });
      
      return res.status(201).json(novaCategoria);
    } catch (error) {
      console.error('Erro ao adicionar categoria:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Atualizar categoria
  controller.atualizar = async (req, res) => {
    try {
      const { id } = req.params;
      const { descricao } = req.body;
      const usuarioId = req.usuario.id;
      
      // Verificar se a descrição foi fornecida
      if (!descricao) {
        return res.status(400).json({ message: 'Descrição é obrigatória' });
      }
      
      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.findOne({
        where: { id, usuario_id: usuarioId }
      });
      
      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      // Verificar se já existe outra categoria com essa descrição para o usuário
      const categoriaExistente = await Categoria.findOne({
        where: { descricao, usuario_id: usuarioId, id: { [app.models.sequelize.Op.ne]: id } }
      });
      
      if (categoriaExistente) {
        return res.status(400).json({ message: 'Já existe uma categoria com essa descrição' });
      }
      
      // Atualizar a categoria
      await categoria.update({ descricao });
      
      return res.status(200).json({ message: 'Categoria atualizada com sucesso', categoria });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  // Remover categoria
  controller.remover = async (req, res) => {
    try {
      const { id } = req.params;
      const usuarioId = req.usuario.id;
      
      // Verificar se a categoria existe e pertence ao usuário
      const categoria = await Categoria.findOne({
        where: { id, usuario_id: usuarioId }
      });
      
      if (!categoria) {
        return res.status(404).json({ message: 'Categoria não encontrada' });
      }
      
      // Verificar se existem movimentações relacionadas à categoria
      const { Movimentacao } = app.models;
      const movimentacoes = await Movimentacao.count({
        where: { categoria_id: id, usuario_id: usuarioId }
      });
      
      if (movimentacoes > 0) {
        return res.status(400).json({
          message: `Não é possível remover a categoria. Existem ${movimentacoes} movimentações relacionadas.`
        });
      }
      
      // Remover a categoria
      await categoria.destroy();
      
      return res.status(200).json({ message: 'Categoria removida com sucesso' });
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }
  };
  
  return controller;
};
