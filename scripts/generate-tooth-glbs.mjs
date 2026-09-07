/**
 * Crown-only glossy tooth GLBs (no dangling roots) for chairside Charting.
 * Run: node scripts/generate-tooth-glbs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

class NodeFileReader {
  result = null;
  onloadend = null;
  onerror = null;
  readAsArrayBuffer(blob) {
    Promise.resolve(blob.arrayBuffer())
      .then((buf) => {
        this.result = buf;
        this.onloadend?.({ target: this });
      })
      .catch((err) => this.onerror?.(err));
  }
}
globalThis.FileReader = NodeFileReader;

const THREE = await import("three");
const { GLTFExporter } = await import("three/addons/exporters/GLTFExporter.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../public/dental/teeth");

function enamel() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.22,
    metalness: 0.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
  });
}

function lathe(profile, segments = 72) {
  const points = profile.map(([x, y]) => new THREE.Vector2(x, y));
  const geo = new THREE.LatheGeometry(points, segments);
  geo.computeVertexNormals();
  return geo;
}

function cusp(x, y, z, r) {
  const g = new THREE.SphereGeometry(r, 28, 20);
  g.translate(x, y, z);
  g.computeVertexNormals();
  return new THREE.Mesh(g, enamel());
}

function group(...meshes) {
  const g = new THREE.Group();
  for (const m of meshes) g.add(m);
  // Sit cervix near y=0, crown above
  g.position.y = 0;
  return g;
}

function makeIncisor() {
  const crown = lathe([
    [0.012, 0.58],
    [0.13, 0.56],
    [0.175, 0.42],
    [0.19, 0.24],
    [0.16, 0.08],
    [0.1, 0.0],
  ]);
  crown.scale(0.58, 1, 1.12);
  return group(new THREE.Mesh(crown, enamel()));
}

function makeCanine() {
  const crown = lathe([
    [0.006, 0.72],
    [0.05, 0.64],
    [0.12, 0.46],
    [0.17, 0.26],
    [0.15, 0.08],
    [0.1, 0.0],
  ]);
  return group(new THREE.Mesh(crown, enamel()));
}

function makePremolar() {
  const body = lathe([
    [0.025, 0.46],
    [0.15, 0.43],
    [0.21, 0.3],
    [0.22, 0.14],
    [0.16, 0.04],
    [0.11, 0.0],
  ]);
  return group(
    new THREE.Mesh(body, enamel()),
    cusp(-0.08, 0.44, 0.02, 0.09),
    cusp(0.09, 0.43, -0.02, 0.085),
  );
}

function makeMolar() {
  const body = lathe(
    [
      [0.04, 0.4],
      [0.23, 0.37],
      [0.3, 0.24],
      [0.31, 0.1],
      [0.22, 0.03],
      [0.14, 0.0],
    ],
    80,
  );
  body.scale(1.2, 1, 1.1);
  return group(
    new THREE.Mesh(body, enamel()),
    cusp(-0.12, 0.38, -0.1, 0.1),
    cusp(0.12, 0.38, -0.1, 0.1),
    cusp(-0.12, 0.36, 0.12, 0.095),
    cusp(0.12, 0.36, 0.12, 0.095),
  );
}

async function writeGlb(name, object) {
  const exporter = new GLTFExporter();
  const buffer = await exporter.parseAsync(object, {
    binary: true,
    onlyVisible: true,
  });
  const file = path.join(OUT, `${name}.glb`);
  fs.writeFileSync(file, Buffer.from(buffer));
  console.log("wrote", file, `(${Buffer.from(buffer).byteLength} bytes)`);
}

fs.mkdirSync(OUT, { recursive: true });
await writeGlb("incisor", makeIncisor());
await writeGlb("canine", makeCanine());
await writeGlb("premolar", makePremolar());
await writeGlb("molar", makeMolar());
console.log("Done.");
