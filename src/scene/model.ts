import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MODELO } from "./modelo.config";
import { lockScreenMesh } from "./phone";
import { montarRig } from "./rig";
import type { PhoneRig } from "./phone";

/**
 * Carrega o GLB (se existir) e devolve as peças prontas para a desmontagem.
 * Devolve null se o arquivo não for um GLB válido ou se faltarem as peças mínimas.
 * Modelos comprimidos com Draco ou Meshopt não são suportados por esta versão.
 */
export async function carregarModelo(url: string, logoUrl: string): Promise<PhoneRig | null> {
  const buf = await (await fetch(url)).arrayBuffer();
  if (new Uint32Array(buf.slice(0, 4))[0] !== 0x46546c67) return null; // assinatura "glTF"
  const gltf = await new Promise<GLTF>((ok, erro) => new GLTFLoader().parse(buf, "", ok, erro));
  const rig = montarRig(gltf.scene, MODELO);
  if (!rig) {
    console.warn("GLB sem as peças mínimas:", MODELO.minimas.join(", "));
    return null;
  }
  // a tela de bloqueio vira filha da peça "tela", logo acompanha o movimento dela
  const tela = rig.parts.find((p) => p.name === "tela");
  if (tela) {
    const bb = new THREE.Box3().setFromObject(tela);
    const w = (bb.max.x - bb.min.x) * 0.94;
    const h = (bb.max.y - bb.min.y) * 0.96;
    const ls = lockScreenMesh(w, h, Math.min(w, h) * 0.12, logoUrl);
    ls.position.set((bb.max.x + bb.min.x) / 2, (bb.max.y + bb.min.y) / 2, bb.max.z + 0.001);
    tela.add(ls);
  }
  return rig;
}
