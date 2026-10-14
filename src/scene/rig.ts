import * as THREE from "three";

export interface ParteCfg {
  nome: string;
  /** Padrão procurado no nome do objeto ou de qualquer ancestral dele no arquivo GLB. */
  padrao: RegExp;
  /** Deslocamento em z (unidades da cena) na vista explodida. */
  deslocamento: number;
}

export interface ModeloCfg {
  /** Altura final do aparelho na cena. */
  altura: number;
  /** Rotação (rad) aplicada ao modelo antes de medir, para modelos que vêm deitados. */
  rotacao: [number, number, number];
  partes: ParteCfg[];
  /** Partes que precisam ser encontradas; se faltar alguma, o modelo é recusado. */
  minimas: string[];
}

export interface RigGlb {
  phone: THREE.Group;
  parts: THREE.Object3D[];
  achadas: string[];
}

/**
 * Transforma a cena de um GLB em peças independentes para a vista explodida.
 * Cada malha vai para a primeira parte cujo padrão combina com o nome dela ou de um ancestral
 * (o mais próximo primeiro). O que não combina fica na estrutura ("frame").
 * A frente do aparelho precisa apontar para +z depois da rotação de `cfg.rotacao`.
 */
export function montarRig(root: THREE.Object3D, cfg: ModeloCfg): RigGlb | null {
  const holder = new THREE.Group();
  holder.add(root);
  root.rotation.set(...cfg.rotacao);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const maior = Math.max(size.x, size.y, size.z);
  if (!isFinite(maior) || maior <= 0) return null;
  root.position.sub(box.getCenter(new THREE.Vector3()));
  holder.scale.setScalar(cfg.altura / maior);
  holder.updateMatrixWorld(true);

  const phone = new THREE.Group();
  const grupos = new Map<string, THREE.Group>();
  const grupo = (nome: string, off: number): THREE.Group => {
    let g = grupos.get(nome);
    if (!g) {
      g = new THREE.Group();
      g.name = nome;
      g.userData = { z: 0, o: off };
      grupos.set(nome, g);
      phone.add(g);
    }
    return g;
  };
  grupo("frame", 0);

  const malhas: THREE.Mesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) malhas.push(o as THREE.Mesh);
  });
  for (const m of malhas) {
    let destino: ParteCfg | null = null;
    for (let n: THREE.Object3D | null = m; n && n !== holder && !destino; n = n.parent) {
      destino = cfg.partes.find((p) => p.padrao.test(n!.name)) ?? null;
    }
    grupo(destino ? destino.nome : "frame", destino ? destino.deslocamento : 0).attach(m);
  }

  const achadas = [...grupos.keys()].filter((k) => k !== "frame");
  if (cfg.minimas.some((k) => !achadas.includes(k))) return null;
  return { phone, parts: [...grupos.values()], achadas };
}
