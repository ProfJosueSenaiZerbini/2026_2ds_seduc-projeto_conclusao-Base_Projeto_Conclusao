import { buscarEnderecoPorCep, CepIndisponivelError } from '../services/cepService.js';
import { normalizarCep, validarCep } from '../validations/bicoValidation.js';

// GET /api/cep/:cep — usado pela tela de publicar bico para preencher o endereço.
// O front consulta pelo nosso servidor (e não direto na ViaCEP) para usar as mesmas regras e reservas do cadastro.
export const criarConsultorCep = (buscarCep = buscarEnderecoPorCep) => async (req, res) => {
    const cep = normalizarCep(req.params.cep);

    if (!validarCep(cep)) {
        return res.status(400).json({ erro: 'Informe um CEP com 8 dígitos.' });
    }

    try {
        const endereco = await buscarCep(cep);
        if (!endereco) {
            return res.status(404).json({ erro: 'CEP não encontrado.' });
        }
        return res.json(endereco);
    } catch (erro) {
        if (erro instanceof CepIndisponivelError) {
            return res.status(503).json({ erro: 'Não conseguimos verificar o CEP agora, tente novamente em instantes.' });
        }
        console.error('❌ Erro ao consultar CEP:', erro);
        return res.status(500).json({ erro: 'Erro ao consultar o CEP.' });
    }
};

export const consultarCep = criarConsultorCep();
