import portrait from "@/assets/analtino-1782122360513.asset.json";
import groupShot from "@/assets/analtino-1782122437292.asset.json";
import interview from "@/assets/analtino-1782122346080.asset.json";
import award from "@/assets/analtino-1782122331946.asset.json";

export const JOURNALIST = {
  name: "Analtino Santos",
  role: "Jornalista · Cultura, Música & Sociedade",
  bio: `Analtino Santos é jornalista angolano com mais de duas décadas dedicadas à cobertura da música, cultura e sociedade de Angola. Conhecido pelas entrevistas profundas e pela proximidade com os artistas nacionais, tem assinado reportagens premiadas sobre o universo cultural lusófono.`,
  photos: {
    portrait: portrait.url,
    group: groupShot.url,
    interview: interview.url,
    award: award.url,
  },
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: string;
  date: string;
  readTime: string;
  featured?: boolean;
};

export const ARTICLES: Article[] = [
  {
    slug: "diploma-de-merito-jornalismo-cultural",
    title: "Diploma de Mérito reconhece duas décadas de jornalismo cultural angolano",
    excerpt:
      "Numa cerimónia em Luanda, Analtino Santos foi distinguido pelo contributo ao jornalismo cultural e à valorização da música nacional.",
    category: "Notícias",
    image: award.url,
    author: "Redacção",
    date: "12 Mar 2025",
    readTime: "6 min",
    featured: true,
  },
  {
    slug: "vozes-de-uma-geracao-encontro-musicos",
    title: "Vozes de uma geração: encontro reúne músicos históricos de Luanda",
    excerpt:
      "Cinco nomes incontornáveis da música angolana juntaram-se para uma conversa sobre legado, autoria e o futuro do semba.",
    category: "Música",
    image: groupShot.url,
    author: "Analtino Santos",
    date: "08 Mar 2025",
    readTime: "9 min",
  },
  {
    slug: "entrevista-mestre-do-semba",
    title: "“O semba é a alma que não se vende” — entrevista a um mestre",
    excerpt:
      "Numa conversa franca, recordou-se a trajectória, os bastidores e a urgência de preservar a memória musical de Angola.",
    category: "Entrevistas",
    image: portrait.url,
    author: "Analtino Santos",
    date: "02 Mar 2025",
    readTime: "12 min",
  },
  {
    slug: "jornal-de-angola-cobertura",
    title: "Bastidores: como se faz uma reportagem de rua em Luanda",
    excerpt:
      "Do primeiro contacto à publicação — uma viagem pelos métodos de quem escreve a cultura angolana todos os dias.",
    category: "Sociedade",
    image: interview.url,
    author: "Analtino Santos",
    date: "24 Fev 2025",
    readTime: "7 min",
  },
  {
    slug: "festival-de-luanda-cobertura",
    title: "Festival de Luanda: três noites que redefiniram a cena urbana",
    excerpt:
      "Cobertura completa, fotografia e análise das principais actuações do festival que dominou as conversas.",
    category: "Eventos",
    image: groupShot.url,
    author: "Analtino Santos",
    date: "18 Fev 2025",
    readTime: "10 min",
  },
  {
    slug: "perfil-nova-geracao-afro-house",
    title: "A nova geração que está a reinventar o afro-house angolano",
    excerpt:
      "Perfis de seis artistas emergentes que estão a levar Angola para as principais pistas do mundo.",
    category: "Celebridades",
    image: portrait.url,
    author: "Analtino Santos",
    date: "10 Fev 2025",
    readTime: "8 min",
  },
];

export type Artist = {
  slug: string;
  name: string;
  genre: string;
  image: string;
  bio: string;
};

export const ARTISTS: Artist[] = [
  {
    slug: "bonga",
    name: "Bonga",
    genre: "Semba · Tradicional",
    image: groupShot.url,
    bio: "Ícone vivo da música angolana, voz incontornável do semba moderno.",
  },
  {
    slug: "paulo-flores",
    name: "Paulo Flores",
    genre: "Semba · Autoral",
    image: portrait.url,
    bio: "Compositor e intérprete que documenta a alma de Luanda há mais de 30 anos.",
  },
  {
    slug: "matias-damasio",
    name: "Matias Damásio",
    genre: "Kizomba · Pop",
    image: interview.url,
    bio: "Voz contemporânea da kizomba, com presença internacional consolidada.",
  },
  {
    slug: "yola-semedo",
    name: "Yola Semedo",
    genre: "Soul · Semba",
    image: award.url,
    bio: "Uma das vozes femininas mais aclamadas de Angola, premiada por crítica e público.",
  },
];

export const VIDEOS = [
  { id: "1", title: "Entrevista exclusiva — bastidores do estúdio", duration: "14:22", thumb: portrait.url },
  { id: "2", title: "Cobertura: Noite de Semba em Luanda", duration: "08:45", thumb: groupShot.url },
  { id: "3", title: "Reportagem: a rota cultural do Mussulo", duration: "11:10", thumb: interview.url },
];

export const EVENTS = [
  { date: "29 Mar", title: "Noite de Semba — Cine Atlântico", city: "Luanda" },
  { date: "05 Abr", title: "Festival Kalemba — Edição 2025", city: "Benguela" },
  { date: "19 Abr", title: "Encontro de Jornalismo Cultural", city: "Luanda" },
];
