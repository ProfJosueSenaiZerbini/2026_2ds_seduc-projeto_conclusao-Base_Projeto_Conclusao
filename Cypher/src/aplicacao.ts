import { rotuloProfissional } from "./app/models/tratamentoProfissional.js";
import { protegerEscrita } from "./app/middlewares/seguranca.js";
import { prepararSuperAdminLocal } from "./app/models/administracao.js";
import express from "express";
import path from "node:path";
import routes from "./app/routes/rotasCypher.js";
import { inicializarAplicacaoCypher } from "./app/models/modeloCypher.js";
import {
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
  Sun,
  Moon,
  MoreHorizontal,
  Music,
  Music2,
  Plus,
  Radio,
  Search,
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
await prepararSuperAdminLocal();

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.set("trust proxy", process.env.CYPHER_TRUST_PROXY === "1" ? 1 : false);

const icones = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  audioLines: AudioLines,
  badgeCheck: BadgeCheck,
  bell: Bell,
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
  radio: Radio,
  search: Search,
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
app.set("views", path.resolve(process.cwd(), "views"));
app.locals.icones = icones;
app.locals.rotuloProfissional = rotuloProfissional;
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(protegerEscrita);
app.use(express.static(path.resolve(process.cwd(), "public")));
app.use(routes);
app.use((_req, res) =>
  res.status(404).render("pages/nao-encontrado", {
    title: "Página não encontrada",
    path: "",
    stylesheet: "base",
    authenticated: false,
  })
);
app.listen(port, "0.0.0.0", () =>
  console.log(`O Bagulho tá no ar. Clique --> http://localhost:${port}`)
);

export default app;
