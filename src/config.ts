/**
 * CONFIGURAÇÃO DA LOJA
 * Este é o único arquivo que você precisa editar para trocar dados comerciais,
 * categorias, produtos e diferenciais. Os produtos abaixo são EXEMPLOS.
 */
export const SITE = {
  nome: "Mira Imports",
  /** Somente dígitos, com código do país e DDD. Ex.: 5579999999999 */
  whatsapp: "",
  endereco: "A definir",
  horario: "A definir",
  instagram: "A definir",
};

export type CatKey = "celulares" | "fones" | "eletronicos" | "acessorios" | "copos" | "chaveiros";

export const CATS: Record<CatKey, string> = {
  celulares: "Celulares",
  fones: "Fones de ouvido",
  eletronicos: "Outros eletrônicos",
  acessorios: "Acessórios",
  copos: "Copos personalizados",
  chaveiros: "Chaveiros e outros",
};

export interface Produto {
  id: number;
  nome: string;
  cat: CatKey;
  desc: string;
  preco: string;
}

const base: Array<Pick<Produto, "nome" | "cat" | "desc">> = [
  { nome: "Smartphone Exemplo A", cat: "celulares", desc: "Aparelho de demonstração. Trocar pelo modelo real." },
  { nome: "Smartphone Exemplo B", cat: "celulares", desc: "Aparelho de demonstração, novo ou usado conforme a oferta." },
  { nome: "Fone sem fio Exemplo", cat: "fones", desc: "Item de demonstração." },
  { nome: "Fone com fio Exemplo", cat: "fones", desc: "Item de demonstração." },
  { nome: "Caixa de som compacta Exemplo", cat: "eletronicos", desc: "Item de demonstração." },
  { nome: "Bateria portátil Exemplo", cat: "eletronicos", desc: "Item de demonstração." },
  { nome: "Capinha Exemplo", cat: "acessorios", desc: "Item de demonstração." },
  { nome: "Película Exemplo", cat: "acessorios", desc: "Item de demonstração." },
  { nome: "Carregador e cabo Exemplo", cat: "acessorios", desc: "Item de demonstração." },
  { nome: "Copo térmico personalizado Exemplo", cat: "copos", desc: "Item de demonstração." },
  { nome: "Chaveiro Exemplo", cat: "chaveiros", desc: "Item de demonstração." },
];

export const PRODUTOS: Produto[] = base.map((p, id) => ({ ...p, id, preco: "Preço sob consulta" }));

/** Troque pelos diferenciais reais da loja. */
export const DIFERENCIAIS = [
  { titulo: "Atendimento próximo", texto: "Conversa direta com a loja pelo WhatsApp." },
  { titulo: "Variedade de acessórios", texto: "Capinhas, películas, carregadores, fones e outros itens." },
  { titulo: "Ajuda na escolha", texto: "Orientação para escolher o aparelho ou o acessório certo." },
  { titulo: "Suporte para reparos", texto: "Fale com a loja para avaliar o problema do seu aparelho." },
];

/** Gera o link do WhatsApp com a mensagem já codificada. */
export const wa = (mensagem: string): string =>
  `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(mensagem)}`;
