import { prepararCentralInicial } from "./app/models/central.js";
import { webhook as webhookMercadoPago } from "./app/controllers/controladorLicenciamentoBeats.js";
import { migrarParticipacoesEventos, processarLembretesEventos } from "./app/models/eventos.js";
import { conexaoInternaCypher } from "./app/models/bancoDados.js";
import { limparCredenciaisExpiradas } from "./app/models/retencaoCredenciais.js";
import { processarPrazos, resumoReputacao, reputacaoPublica } from "./app/models/colaboracoes.js";
import { rotuloProfissional } from "./app/models/tratamentoProfissional.js";
import { completudePerfil } from "./app/models/identidadeUsuario.js";
import { acoesCriacao } from "./app/models/espacoTrabalho.js";
import { discoDemo, idFaixaDemo, imagemPerfilDemo, imagemPublicacaoDemo } from "./app/models/catalogoDemonstrativo.js";
import { protegerEscrita } from "./app/middlewares/seguranca.js";
import { prepararSuperAdminLocal } from "./app/models/administracao.js";
import express from "express";
import ejs from "ejs";
import path from "node:path";
import routes from "./app/routes/rotasCypher.js";
import { inicializarAplicacaoCypher } from "./app/models/modeloCypher.js";
import {
  BriefcaseBusiness, Clapperboard, PenLine, Camera, Paintbrush, Footprints, Newspaper, PencilRuler, Scissors, Podcast, Drum, PenTool, SprayCan, Video,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  BadgeCheck,
  Bell,
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleUserRound,
  Clock3,
  Crown,
  SlidersHorizontal,
  Disc3,
  Eye,
  EyeOff,
  ExternalLink,
  FileMusic,
  Headphones,
  House,
  Lightbulb,
  ListChecks,
  MapPin,
  Menu,
  MicVocal,
  MessageCircle,
  Sun,
  Moon,
  MoreHorizontal,
  Music,
  Music2,
  Plus,
  Paperclip,
  Radio,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Tag,
  Trophy,
  UserRound,
  UsersRound,
  X,
} from "lucide-static";

inicializarAplicacaoCypher();
limparCredenciaisExpiradas();
const cicloRetencao = setInterval(() => {
  try { limparCredenciaisExpiradas(); } catch { console.error("Falha na limpeza das credenciais expiradas."); }
}, 15 * 60 * 1000);
cicloRetencao.unref();
migrarParticipacoesEventos();
await prepararSuperAdminLocal();
const responsavelCentral=conexaoInternaCypher().prepare("SELECT usuario_id FROM administradores WHERE papel='super_admin' AND ativo=1 ORDER BY criado_em LIMIT 1").get() as {usuario_id:string}|undefined;
if(responsavelCentral)prepararCentralInicial(responsavelCentral.usuario_id);
processarPrazos();
const cicloColaboracoes = setInterval(() => { try { processarPrazos(); } catch (erro) { console.error("Falha ao processar prazos de colaboração."); } }, 60000);
cicloColaboracoes.unref();
processarLembretesEventos();
const cicloEventos = setInterval(() => { try { processarLembretesEventos(); } catch { console.error("Falha ao processar lembretes de eventos."); } }, 60000);
cicloEventos.unref();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.set("trust proxy", process.env.CYPHER_TRUST_PROXY === "1" ? 1 : false);

const icones = {
  briefcase: BriefcaseBusiness, clapperboard: Clapperboard, pen: PenLine, camera: Camera, brush: Paintbrush, footprints: Footprints, newspaper: Newspaper, design: PencilRuler, scissors: Scissors, podcast: Podcast, drum: Drum, penTool: PenTool, spray: SprayCan, video: Video,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  audioLines: AudioLines,
  badgeCheck: BadgeCheck,
  bell: Bell,
  messageCircle: MessageCircle,
  calendarCheck: CalendarCheck2,
  calendarDays: CalendarDays,
  chart: ChartNoAxesCombined,
  check: Check,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circleCheck: CircleCheck,
  circleHelp: CircleHelp,
  circleUser: CircleUserRound,
  clock: Clock3,
  crown: Crown,
  sliders: SlidersHorizontal,
  disc: Disc3,
  eye: Eye,
  eyeOff: EyeOff,
  sun: Sun,
  moon: Moon,
  externalLink: ExternalLink,
  fileMusic: FileMusic,
  headphones: Headphones,
  house: House,
  lightbulb: Lightbulb,
  listChecks: ListChecks,
  mapPin: MapPin,
  menu: Menu,
  mic: MicVocal,
  more: MoreHorizontal,
  music: Music,
  music2: Music2,
  plus: Plus,
  paperclip: Paperclip,
  radio: Radio,
  search: Search,
  send: Send,
  settings: Settings,
  share: Share2,
  shieldCheck: ShieldCheck,
  sparkles: Sparkles,
  tag: Tag,
  trophy: Trophy,
  user: UserRound,
  users: UsersRound,
  x: X,
};

app.set("view engine", "ejs");
app.engine("ejs", (arquivo, opcoes, concluir) => {
  let html: string | undefined;
  try {
    // Os helpers das fichas consultam o SQLite durante o render síncrono.
    conexaoInternaCypher().transaction(() => {
      ejs.renderFile(arquivo, opcoes, (erro: Error | null, conteudo?: string) => {
        if (erro) throw erro;
        html = conteudo;
      });
    })();
  } catch (erro) {
    return concluir(erro as Error);
  }
  return concluir(null, html);
});
if (process.env.CYPHER_VIEW_CACHE === "1") app.enable("view cache");
app.set("views", path.resolve(process.cwd(), "views"));
app.locals.icones = icones;
app.locals.acoesCriacaoSidebar = acoesCriacao;
app.locals.resumoReputacao = resumoReputacao;
app.locals.reputacaoParaPerfil = (id: string, visitante: string) => {try {return reputacaoPublica(id,visitante);} catch{return null;}};
app.locals.rotuloProfissional = rotuloProfissional;
Object.assign(app.locals, { completudePerfil, discoDemo, idFaixaDemo, imagemPerfilDemo, imagemPublicacaoDemo });
app.post("/payments/mercadopago/webhook", express.json({ limit: "8kb" }), webhookMercadoPago);
app.use(["/portfolio/edit", "/portfolio/preview"], express.urlencoded({ extended: true, limit: "512kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(protegerEscrita);
app.use(express.static(path.resolve(process.cwd(), "public")));
app.use((req, res, next) => {
  res.locals.caminhoNavegacao = req.path;
  next();
});
app.use(routes);
app.use((_req, res) =>
  res.status(404).render("pages/nao-encontrado", {
    title: "Página não encontrada",
    path: "",
    stylesheet: "base",
    authenticated: false,
  })
);
app.listen(port, process.env.CYPHER_BIND_HOST ?? "0.0.0.0", () =>
  console.log(`O Bagulho tá no ar. Clique --> http://localhost:${port}`)
);

export default app;
