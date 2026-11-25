import rotasSuporte from "./rotasSuporte.js";
import rotasMidiasRepresentacao from "./rotasMidiasRepresentacao.js";
import rotasInteracoes from "./rotasInteracoes.js";
import rotasLicenciamentoBeats from "./rotasLicenciamentoBeats.js";
import rotasEventos from "./rotasEventos.js";
import rotasCentral from "./rotasCentral.js";
import rotasColaboracoes from "./rotasColaboracoes.js";
import rotasPortfolio from "./rotasPortfolio.js";
import rotasProjetos from "./rotasProjetos.js";
import rotasOportunidades from "./rotasOportunidades.js";
import * as administracao from "../controllers/controladorAdministracao.js";
import * as identidade from "../controllers/controladorIdentidade.js";
import * as contas from "../controllers/controladorGestaoConta.js";
import { limitarAutenticacao } from "../middlewares/seguranca.js";
import { Router } from "express";
import * as autenticacao from "../controllers/controladorAutenticacao.js";
import * as beats from "../controllers/controladorBeats.js";
import * as configuracoes from "../controllers/controladorConfiguracoes.js";
import * as dashboard from "../controllers/controladorDashboard.js";
import * as eventos from "../controllers/controladorEventos.js";
import * as obras from "../controllers/controladorObras.js";
import * as perfis from "../controllers/controladorPerfis.js";
import { buscaGlobal, sugestoesBusca } from "../controllers/controladorBusca.js";
import * as notificacoes from "../controllers/controladorNotificacoes.js";
import { middlewareAutorizacao } from "../controllers/controladorCompartilhado.js";

import { espacoTrabalho, fichaTrabalho } from "../controllers/controladorEspacoTrabalho.js";

const router = Router();

router.use(middlewareAutorizacao);
router.use(rotasMidiasRepresentacao);
router.use(rotasInteracoes);
router.use(rotasSuporte);
router.use(rotasLicenciamentoBeats);
router.use(rotasCentral);
router.use(rotasColaboracoes);
router.use(rotasPortfolio);
router.use(rotasProjetos);
router.use(rotasOportunidades);
// /events/new é uma rota estática, anterior à ficha dinâmica.
router.get('/events/new', eventos.novoEvento);
router.use(rotasEventos);
router.get("/admin/login", administracao.paginaLoginAdministrativo);
router.post("/admin/login", limitarAutenticacao, administracao.loginAdministrativo);
router.post("/admin/logout", administracao.logoutAdministrativo);
router.get("/admin", administracao.painelAdministrativo);
router.post("/admin/equipe", administracao.adicionarAdministrador);
router.post("/admin/equipe/:id", administracao.editarAdministrador);
router.get("/login", autenticacao.paginaAutenticacao);
router.get("/register", identidade.paginaCadastro);
router.post("/login", limitarAutenticacao, autenticacao.login);
router.get("/recuperar-senha", contas.paginaRecuperacao);
router.post("/recuperar-senha", limitarAutenticacao, contas.solicitarRecuperacao);
router.get("/redefinir-senha", contas.paginaRedefinicao);
router.post("/redefinir-senha", limitarAutenticacao, contas.redefinirSenha);
router.get(["/termos-de-uso", "/politica-privacidade"], contas.termosConta);
router.post("/register/validate", identidade.validarCadastro);
router.post("/register/identificador", identidade.disponibilidadeIdentificador);
router.post("/register", identidade.registrarConta);
router.get("/email/pendente", identidade.paginaEmailPendente);
router.post("/email/reenviar", limitarAutenticacao, identidade.reenviarConfirmacao);
router.get("/confirmar-email", identidade.paginaConfirmacao);
router.post("/confirmar-email", identidade.confirmarEmail);
router.post("/logout", autenticacao.logout);
router.get("/notificacoes", notificacoes.notificacoes);
router.post("/notificacoes/marcar-todas-lidas", notificacoes.marcarTodasLidas);
router.post("/notificacoes/preferencias", notificacoes.salvarPreferencias);
router.post("/notificacoes/limpar", notificacoes.limpar);
router.post("/notificacoes/:id/lida", notificacoes.marcarLida);
router.post("/notificacoes/:id/nao-lida", notificacoes.marcarNaoLida);
router.post("/notificacoes/:id/excluir", notificacoes.excluir);
router.post("/categories/analyze", dashboard.analisarCategoria);
router.get(["/", "/dashboard"], dashboard.descoberta);
router.get("/search", buscaGlobal);
router.get("/search/suggestions", sugestoesBusca);
router.get("/events", eventos.oportunidades);
router.get("/events/new", eventos.novoEvento);
router.post("/events/new", eventos.criarEvento);
router.post("/events/:id/interest", eventos.demonstrarInteresse);
router.post("/events/:id/interest/cancel", eventos.cancelarInteresse);
router.post(
  "/events/:id/interests/:usuarioId/status",
  eventos.atualizarInteresse
);
router.get("/events/:id/edit", eventos.editarEvento);
router.post("/events/:id/edit", eventos.atualizarEvento);
router.post("/events/:id/delete", eventos.excluirEvento);
router.get("/espaco-de-trabalho", espacoTrabalho);
router.get("/espaco-de-trabalho/:modalidade/:id", fichaTrabalho);
router.get("/works", obras.obras);
router.post("/works/:id/like", obras.curtirObra);
router.get("/works/new", obras.novaObra);
router.post("/works/new", obras.criarObra);
router.get("/works/:id/edit", obras.editarObra);
router.post("/works/:id/edit", obras.atualizarObra);
router.post("/works/:id/delete", obras.excluirObra);
router.get("/beats", beats.bancoBeats);
router.get("/beats/new", beats.novoBeat);
router.post("/beats/new", beats.criarBeat);
router.get("/beats/:id/edit", beats.editarBeat);
router.post("/beats/:id/edit", beats.atualizarBeat);
router.post("/beats/:id/delete", beats.excluirBeat);

router.get("/profile", identidade.meuPerfil);
router.get("/profile/completar", identidade.completarPerfil);
router.get("/profile/profissionalizar", identidade.ativarProfissional);
router.post("/profile/profissionalizar", identidade.confirmarProfissionalizacao);
router.post("/profile/apresentacao", identidade.salvarApresentacao);
router.post("/profile", perfis.atualizarPerfil);
router.post("/profile/secoes/:secao", perfis.atualizarPerfilPorSecao);
router.post(
  "/profile/categorias/sugerir",
  perfis.solicitarCategoriaProfissional
);
router.post(
  "/profile/categorias/solicitar-excecao",
  perfis.solicitarExcecaoCategoria
);
router.post(
  "/profile/categorias/solicitacoes/:id/responder",
  perfis.responderSolicitacaoCategoria
);
router.get("/settings", identidade.configuracoesIdentidade);
router.post("/settings/identidade", identidade.salvarIdentidade);
router.post("/settings/identificador", identidade.salvarIdentificador);
router.post("/settings/preferencias", identidade.salvarPreferencias);
router.post("/settings/email", identidade.solicitarTrocaEmail);
router.post("/settings/senha", limitarAutenticacao, contas.alterarSenha);
router.get("/settings/encerramento", contas.paginaEncerramento);
router.post("/admin/identificador", identidade.excecaoIdentificador);
router.post("/settings/privacy", configuracoes.atualizarPrivacidade);
router.post("/settings/delete-account", limitarAutenticacao, contas.fecharConta);
router.get("/admin/revisao", configuracoes.revisaoAdministrativa);
router.get("/admin/revisao/excecoes", configuracoes.revisaoAdministrativa);
router.get(
  "/admin/revisao/excecoes/busca",
  configuracoes.buscarPerfisExcecaoAdministrativa
);
router.post(
  "/admin/revisao/generos/:id",
  configuracoes.revisarGeneroAdministrativamente
);
router.post(
  "/admin/revisao/categorias-profissionais/:id",
  configuracoes.revisarCategoriaProfissionalAdministrativamente
);
router.post(
  "/admin/revisao/excecoes-categorias/:id",
  configuracoes.autorizarExcecaoCategoria
);
router.post(
  "/admin/revisao/solicitacoes-excecao/:id",
  configuracoes.revisarSolicitacaoExcecaoCategoria
);
router.post(
  "/admin/revisao/solicitacoes-excecao/:id/esclarecimento",
  configuracoes.solicitarInformacaoSolicitacaoCategoria
);
router.get("/p/:identificador", perfis.perfilPublico);

export default router;
