import type * as THREE from "three";

/**
 * Framework-free 3D scene. One model per screen:
 *   0 bot · 1 database · 2 service graph · 3 conversation
 * Camera and canvas never move; models swap with a short directional transition.
 */
export type SceneHandle = {
  setSlide(index: number): void;
  setMotion(on: boolean): void;
  dispose(): void;
};

type Three = typeof THREE;
type Disposable = { dispose(): void };
type Model = { group: THREE.Group; tick(time: number): void };

const TAU = Math.PI * 2;
const GOLDEN_ANGLE = 2.399963;
const FIT_RADIUS = 2.6; // world-space radius that must stay inside the canvas
const FOV = 36;

export function createScene(
  T: Three,
  container: HTMLElement,
  initial: { slide: number; motion: boolean },
): SceneHandle | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  } catch {
    return null; // WebGL is unavailable: the CSS fallback stays visible.
  }

  const trash: Disposable[] = [];
  const keep = <X extends Disposable>(item: X): X => { trash.push(item); return item; };
  let disposed = false, raf = 0;
  const cleanups: (() => void)[] = [];

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    cleanups.forEach(run => run());
    trash.forEach(item => item.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };

  try {
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(FOV, 1, 0.1, 40);
    const assembly = new T.Group();
    assembly.scale.setScalar(1.5);
    scene.add(assembly);

    /* ---------- Lighting: a small procedural studio, baked into an environment map ---------- */
    const makeEnvironment = () => {
      const studio = new T.Scene(), local: Disposable[] = [];
      const own = <X extends Disposable>(item: X): X => { local.push(item); return item; };
      const gradient = document.createElement("canvas");
      gradient.width = 4; gradient.height = 128;
      const ctx = gradient.getContext("2d");
      if (ctx) {
        const fill = ctx.createLinearGradient(0, 0, 0, 128);
        fill.addColorStop(0, "#47356e"); fill.addColorStop(0.5, "#1d1430"); fill.addColorStop(1, "#0b0812");
        ctx.fillStyle = fill; ctx.fillRect(0, 0, 4, 128);
      }
      const sky = own(new T.CanvasTexture(gradient));
      sky.colorSpace = T.SRGBColorSpace;
      studio.add(new T.Mesh(own(new T.SphereGeometry(30, 24, 12)), own(new T.MeshBasicMaterial({ map: sky, side: T.BackSide }))));
      const panel = own(new T.PlaneGeometry(1, 1));
      const softbox = (color: number, power: number, w: number, h: number, x: number, y: number, z: number) => {
        const material = own(new T.MeshBasicMaterial({ color, side: T.DoubleSide }));
        material.color.multiplyScalar(power);
        const mesh = new T.Mesh(panel, material);
        mesh.scale.set(w, h, 1); mesh.position.set(x, y, z); mesh.lookAt(0, 0, 0);
        studio.add(mesh);
      };
      softbox(0xfff4ff, 10, 12, 12, -9, 10, 9);   // key
      softbox(0xffffff, 7, 18, 1.6, 0, 5.5, 13);   // strip: long highlight on glossy fronts
      softbox(0xb07cff, 12, 6, 14, 12, 1, -7);     // violet rim
      softbox(0xe08bff, 6, 6, 10, -12, -2, -8);    // magenta kicker
      softbox(0x6c58c9, 2.5, 16, 16, 0, -10, 2);   // floor bounce
      const pmrem = new T.PMREMGenerator(renderer);
      const target = keep(pmrem.fromScene(studio, 0.03));
      pmrem.dispose();
      local.forEach(item => item.dispose());
      return target.texture;
    };
    scene.environment = makeEnvironment();

    const keyLight = new T.DirectionalLight(0xfff0ff, 2.2); keyLight.position.set(-3, 4, 5);
    const rimLight = new T.DirectionalLight(0x9a5cff, 3); rimLight.position.set(4, 1, -3);
    const fillLight = new T.DirectionalLight(0x8f7cff, 0.6); fillLight.position.set(1, -3, 4);
    scene.add(keyLight, rimLight, fillLight);

    /* ---------- Materials ---------- */
    const physical = (parameters: THREE.MeshPhysicalMaterialParameters) => keep(new T.MeshPhysicalMaterial(parameters));
    const shell = physical({ color: 0x6f41d1, metalness: 0.3, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 1.15 });
    const deep = physical({ color: 0x3d1d73, metalness: 0.85, roughness: 0.26, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.25 });
    const silver = physical({ color: 0x9a90b3, metalness: 0.92, roughness: 0.3, clearcoat: 0.3 });
    const glass = physical({ color: 0x0b0716, metalness: 0.55, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.4 });
    const pale = physical({ color: 0xdccdf7, metalness: 0.05, roughness: 0.42, clearcoat: 0.5 });
    const gem = physical({ color: 0x7b4be0, metalness: 0.4, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, flatShading: true, envMapIntensity: 1.4 });
    const glow = keep(new T.MeshStandardMaterial({ color: 0xcbb2ff, emissive: 0xa77bff, emissiveIntensity: 1.4, roughness: 0.4 }));
    const led = keep(new T.MeshBasicMaterial({ color: 0xf1e7ff, toneMapped: false }));
    const lineStrong = keep(new T.LineBasicMaterial({ color: 0xb79cf0, transparent: true, opacity: 0.42 }));
    const lineFaint = keep(new T.LineBasicMaterial({ color: 0x9d86cf, transparent: true, opacity: 0.14 }));

    const haloCanvas = document.createElement("canvas");
    haloCanvas.width = haloCanvas.height = 64;
    const haloCtx = haloCanvas.getContext("2d");
    if (haloCtx) {
      const radial = haloCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      radial.addColorStop(0, "rgba(255,255,255,1)"); radial.addColorStop(0.35, "rgba(255,255,255,.35)"); radial.addColorStop(1, "rgba(255,255,255,0)");
      haloCtx.fillStyle = radial; haloCtx.fillRect(0, 0, 64, 64);
    }
    const haloTexture = keep(new T.CanvasTexture(haloCanvas));
    const haloMaterial = (opacity: number) => keep(new T.SpriteMaterial({ map: haloTexture, color: 0xb995fa, transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const halo = (parent: THREE.Object3D, size: number, opacity: number, x = 0, y = 0, z = 0) => {
      const sprite = new T.Sprite(haloMaterial(opacity));
      sprite.scale.set(size, size, 1); sprite.position.set(x, y, z);
      parent.add(sprite);
      return sprite;
    };

    /* ---------- Geometry helpers ---------- */
    const add = (parent: THREE.Object3D, geometry: THREE.BufferGeometry, material: THREE.Material, x = 0, y = 0, z = 0) => {
      const mesh = new T.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };

    /** Box with rounded edges and exact normals. Half of the segments go into the corners. */
    const roundedBox = (w: number, h: number, d: number, r: number, segments = 16) => {
      const geometry = keep(new T.BoxGeometry(w, h, d, segments, segments, segments));
      const position = geometry.attributes.position, normal = geometry.attributes.normal;
      const size = [w / 2, h / 2, d / 2];
      const v = [0, 0, 0], inner = [0, 0, 0];
      for (let i = 0; i < position.count; i++) {
        v[0] = position.getX(i); v[1] = position.getY(i); v[2] = position.getZ(i);
        let length = 0;
        for (let axis = 0; axis < 3; axis++) {
          const half = size[axis], flat = (half - r) / half, a = Math.abs(v[axis]) / half;
          const spread = (a <= 0.5 ? a * 2 * flat : flat + (a - 0.5) * 2 * (1 - flat)) * half * Math.sign(v[axis]);
          inner[axis] = Math.max(-(half - r), Math.min(half - r, spread));
          v[axis] = spread - inner[axis];
          length += v[axis] * v[axis];
        }
        length = Math.sqrt(length) || 1;
        const nx = v[0] / length, ny = v[1] / length, nz = v[2] / length;
        position.setXYZ(i, inner[0] + nx * r, inner[1] + ny * r, inner[2] + nz * r);
        normal.setXYZ(i, nx, ny, nz);
      }
      geometry.computeBoundingSphere();
      return geometry;
    };

    /** Smooth normals across faces that meet at less than `angle`, keep harder edges crisp. */
    const crease = (source: THREE.BufferGeometry, angle = 0.75) => {
      const geometry = source.index ? keep(source.toNonIndexed()) : source;
      const position = geometry.attributes.position, count = position.count;
      const faces = new Float32Array(count); // area-weighted face normals, xyz per triangle
      const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3();
      for (let i = 0; i < count; i += 3) {
        a.fromBufferAttribute(position, i); b.fromBufferAttribute(position, i + 1); c.fromBufferAttribute(position, i + 2);
        b.sub(a); c.sub(a); b.cross(c);
        faces[i] = b.x; faces[i + 1] = b.y; faces[i + 2] = b.z;
      }
      const shared = new Map<string, number[]>();
      for (let i = 0; i < count; i++) {
        const key = `${Math.round(position.getX(i) * 1e4)},${Math.round(position.getY(i) * 1e4)},${Math.round(position.getZ(i) * 1e4)}`;
        const list = shared.get(key);
        if (list) list.push(i); else shared.set(key, [i]);
      }
      const normals = new Float32Array(count * 3), limit = Math.cos(angle);
      const own = new T.Vector3(), other = new T.Vector3(), sum = new T.Vector3();
      shared.forEach(list => {
        for (const i of list) {
          const face = Math.floor(i / 3) * 3;
          own.set(faces[face], faces[face + 1], faces[face + 2]).normalize();
          sum.set(0, 0, 0);
          for (const j of list) {
            const neighbour = Math.floor(j / 3) * 3;
            other.set(faces[neighbour], faces[neighbour + 1], faces[neighbour + 2]);
            const length = other.length();
            if (length > 0 && other.dot(own) / length > limit) sum.add(other);
          }
          sum.normalize();
          normals[i * 3] = sum.x; normals[i * 3 + 1] = sum.y; normals[i * 3 + 2] = sum.z;
        }
      });
      geometry.setAttribute("normal", new T.BufferAttribute(normals, 3));
      return geometry;
    };

    const roundedRect = (w: number, h: number, r: number, tail: -1 | 0 | 1 = 0) => {
      const shape = new T.Shape(), x = -w / 2, y = -h / 2, q = Math.PI / 2;
      shape.moveTo(x + r, y);
      if (tail < 0) { shape.lineTo(x + r + 0.04, y); shape.lineTo(x + r - 0.02, y - 0.3); shape.lineTo(x + r + 0.4, y); }
      if (tail > 0) { shape.lineTo(x + w - r - 0.4, y); shape.lineTo(x + w - r + 0.02, y - 0.3); shape.lineTo(x + w - r - 0.04, y); }
      shape.lineTo(x + w - r, y);
      shape.absarc(x + w - r, y + r, r, -q, 0, false);
      shape.lineTo(x + w, y + h - r);
      shape.absarc(x + w - r, y + h - r, r, 0, q, false);
      shape.lineTo(x + r, y + h);
      shape.absarc(x + r, y + h - r, r, q, q * 2, false);
      shape.lineTo(x, y + r);
      shape.absarc(x + r, y + r, r, q * 2, q * 3, false);
      return shape;
    };
    /** Extruded plate with a soft bevel. Spans z from -bevel to depth + bevel. */
    const plate = (shape: THREE.Shape, depth: number, bevel: number) =>
      crease(keep(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 20 })));

    const sphere = keep(new T.SphereGeometry(1, 32, 24));
    const ball = (parent: THREE.Object3D, material: THREE.Material, radius: number, x = 0, y = 0, z = 0) => {
      const mesh = add(parent, sphere, material, x, y, z);
      mesh.scale.setScalar(radius);
      return mesh;
    };

    const pointer = { x: 0, y: 0 }, look = { x: 0, y: 0 };

    /* ---------- 0 · Bot: an original little service robot ---------- */
    const buildBot = (): Model => {
      const group = new T.Group(), body = new T.Group(), head = new T.Group();
      group.add(body); body.add(head);
      head.position.y = 0.36;

      add(head, roundedBox(1.46, 1.08, 1.06, 0.36), shell);
      add(head, plate(roundedRect(1.14, 0.68, 0.26), 0.05, 0.03), glass, 0, 0, 0.5);
      const eyeGeometry = keep(new T.CapsuleGeometry(0.075, 0.15, 8, 20));
      const eyes = [-1, 1].map(side => {
        const eye = add(head, eyeGeometry, led, side * 0.27, 0.03, 0.588);
        eye.scale.z = 0.35;
        halo(head, 0.62, 0.3, side * 0.27, 0.03, 0.64);
        return eye;
      });
      const smile = add(head, keep(new T.TorusGeometry(0.085, 0.013, 8, 24, Math.PI)), led, 0, -0.14, 0.588);
      smile.rotation.z = Math.PI; smile.scale.z = 0.5;

      const podGeometry = keep(new T.CylinderGeometry(0.19, 0.19, 0.12, 40));
      const podRing = keep(new T.TorusGeometry(0.115, 0.018, 10, 40));
      for (const side of [-1, 1]) {
        const pod = add(head, podGeometry, silver, side * 0.77, 0, 0); pod.rotation.z = Math.PI / 2;
        const ring = add(head, podRing, glow, side * 0.835, 0, 0); ring.rotation.y = Math.PI / 2;
      }

      const antenna = new T.Group(); antenna.position.y = 0.53; head.add(antenna);
      add(antenna, keep(new T.CylinderGeometry(0.02, 0.026, 0.32, 12)), silver, 0, 0.16, 0);
      const tip = ball(antenna, glow, 0.07, 0, 0.36, 0);
      halo(antenna, 0.55, 0.45, 0, 0.36, 0);

      add(body, keep(new T.CylinderGeometry(0.2, 0.25, 0.16, 32)), deep, 0, -0.235, 0);
      add(body, roundedBox(1, 0.74, 0.76, 0.25), shell, 0, -0.66, 0);
      add(body, plate(roundedRect(0.6, 0.36, 0.1), 0.03, 0.02), glass, 0, -0.63, 0.355);
      const lights = [0, 1, 2].map(i => {
        const light = ball(body, i === 1 ? glow : led, 0.03, -0.18 + i * 0.1, -0.55, 0.412);
        light.scale.z = 0.012;
        return light;
      });
      const barGeometry = keep(new T.CapsuleGeometry(0.014, 0.3, 4, 10));
      for (const y of [-0.66, -0.72]) { const bar = add(body, barGeometry, silver, 0, y, 0.41); bar.rotation.z = Math.PI / 2; }

      const handGeometry = keep(new T.CapsuleGeometry(0.1, 0.13, 8, 20));
      const hands = [-1, 1].map(side => { const hand = add(body, handGeometry, shell, side * 0.7, -0.66, 0.08); hand.rotation.z = side * 0.3; return hand; });

      add(body, keep(new T.CylinderGeometry(0.3, 0.17, 0.12, 36)), deep, 0, -1.08, 0);
      const thruster = add(group, keep(new T.TorusGeometry(0.4, 0.034, 12, 64)), glow, 0, -1.2, 0); thruster.rotation.x = Math.PI / 2;
      const wake = add(group, keep(new T.TorusGeometry(0.62, 0.011, 8, 72)), silver, 0, -1.27, 0); wake.rotation.x = Math.PI / 2;
      halo(group, 1.3, 0.22, 0, -1.2, 0);

      const packetGeometry = keep(new T.IcosahedronGeometry(0.06, 0));
      const packets = [pale, glow, gem].map(material => add(group, packetGeometry, material));

      return {
        group,
        tick(time) {
          body.position.y = Math.sin(time * 1.3) * 0.05;
          body.rotation.y = Math.sin(time * 0.45) * 0.28 + look.x * 0.22;
          head.rotation.set(-look.y * 0.18 + Math.sin(time * 0.9) * 0.03, look.x * 0.32, Math.sin(time * 0.7) * 0.04);
          const phase = time % 3.7;
          const lid = phase > 3.56 ? 1 - Math.sin(((phase - 3.56) / 0.14) * Math.PI) * 0.9 : 1;
          eyes.forEach((eye, i) => {
            eye.scale.y = lid;
            eye.position.x = (i ? 0.27 : -0.27) + look.x * 0.05;
            eye.position.y = 0.03 + look.y * 0.035;
          });
          antenna.rotation.z = Math.sin(time * 1.7) * 0.09;
          tip.scale.setScalar(0.07 * (1 + Math.sin(time * 3) * 0.12));
          lights.forEach((light, i) => { const pulse = 0.03 * (0.75 + 0.25 * Math.sin(time * 2.4 + i * 1.9)); light.scale.set(pulse, pulse, 0.012); });
          hands.forEach((hand, i) => { hand.position.y = -0.66 + Math.sin(time * 1.3 + 1 + i * 1.6) * 0.045; });
          thruster.scale.setScalar(1 + Math.sin(time * 2.2) * 0.05);
          wake.scale.setScalar(1 + Math.sin(time * 2.2 - 0.9) * 0.08);
          packets.forEach((packet, i) => {
            const angle = time * (0.55 + i * 0.12) + i * 2.1, tilt = 0.5 + i * 0.6;
            packet.position.set(Math.cos(angle) * 1.15, Math.sin(angle) * Math.sin(tilt) * 0.8 - 0.1, Math.sin(angle) * Math.cos(tilt) * 1.15);
            packet.rotation.set(time * 0.8 + i, time * 0.6, 0);
          });
        },
      };
    };

    /* ---------- 1 · Database: stacked storage with rows streaming in ---------- */
    const buildDatabase = (): Model => {
      const group = new T.Group(), stack = new T.Group();
      group.add(stack);
      group.rotation.set(0.2, 0, -0.07);

      const R = 0.95, H = 0.4, F = 0.07, profile: THREE.Vector2[] = [];
      profile.push(new T.Vector2(0, -H / 2), new T.Vector2(R - F - 0.03, -H / 2));
      for (let i = 0; i <= 6; i++) { const t = (i / 6) * (Math.PI / 2); profile.push(new T.Vector2(R - F + Math.sin(t) * F, -H / 2 + F - Math.cos(t) * F)); }
      for (let i = 0; i <= 6; i++) { const t = (i / 6) * (Math.PI / 2); profile.push(new T.Vector2(R - F + Math.cos(t) * F, H / 2 - F + Math.sin(t) * F)); }
      profile.push(new T.Vector2(R - F - 0.03, H / 2), new T.Vector2(0, H / 2));
      const disk = keep(new T.LatheGeometry(profile, 72));
      const trim = keep(new T.TorusGeometry(R + 0.004, 0.011, 8, 96));

      const core = keep(new T.MeshStandardMaterial({ color: 0x8a66dc, emissive: 0x7446dd, emissiveIntensity: 0.75, roughness: 0.5 }));
      add(stack, keep(new T.CylinderGeometry(0.84, 0.84, 1.36, 48, 1, true)), core);
      [deep, shell, deep].forEach((material, i) => {
        const y = (i - 1) * 0.56;
        add(stack, disk, material, 0, y, 0);
        const line = add(stack, trim, silver, 0, y + 0.09, 0); line.rotation.x = Math.PI / 2;
        for (let k = 0; k < 3; k++) {
          const angle = 0.35 + k * 0.16 + i * 2.1;
          const light = ball(stack, k === 0 ? glow : led, 0.026, Math.sin(angle) * (R + 0.002), y - 0.07, Math.cos(angle) * (R + 0.002));
          light.scale.set(0.026, 0.026, 0.026);
        }
      });
      const top = 0.56 + H / 2;
      const cap = add(stack, keep(new T.TorusGeometry(0.6, 0.02, 10, 64)), silver, 0, top + 0.004, 0); cap.rotation.x = Math.PI / 2;
      add(stack, keep(new T.CylinderGeometry(0.3, 0.3, 0.03, 40)), glass, 0, top + 0.012, 0);
      halo(group, 2.6, 0.16);

      const ROWS = 30;
      const rows = new T.InstancedMesh(keep(new T.BoxGeometry(0.075, 0.075, 0.075)), pale, ROWS);
      rows.frustumCulled = false;
      group.add(rows);
      const dummy = new T.Object3D();

      const orbit = new T.Group(); orbit.rotation.set(Math.PI / 2 - 0.42, 0, 0.28); group.add(orbit);
      add(orbit, keep(new T.TorusGeometry(1.5, 0.007, 6, 128)), silver);
      const query = ball(orbit, glow, 0.05);
      const queryHalo = halo(orbit, 0.5, 0.5);

      return {
        group,
        tick(time) {
          stack.rotation.y = time * 0.22 + look.x * 0.3;
          for (let i = 0; i < ROWS; i++) {
            const u = (i / ROWS + time * 0.05) % 1, angle = i * GOLDEN_ANGLE + time * 0.22, radius = 1.27 + Math.sin(i * 1.7) * 0.11;
            dummy.position.set(Math.cos(angle) * radius, -1.2 + u * 2.4, Math.sin(angle) * radius);
            dummy.rotation.set(time * 0.6 + i, time * 0.4 + i * 2, 0);
            dummy.scale.setScalar(Math.sin(u * Math.PI) * (0.65 + (i % 3) * 0.25));
            dummy.updateMatrix();
            rows.setMatrixAt(i, dummy.matrix);
          }
          rows.instanceMatrix.needsUpdate = true;
          const angle = time * 0.8;
          query.position.set(Math.cos(angle) * 1.5, Math.sin(angle) * 1.5, 0);
          queryHalo.position.copy(query.position);
        },
      };
    };

    /* ---------- 2 · Service graph: one hub, eleven services, requests in flight ---------- */
    const buildGraph = (): Model => {
      const group = new T.Group(), graph = new T.Group();
      group.add(graph);

      const hub = add(graph, keep(new T.IcosahedronGeometry(0.34, 0)), gem);
      halo(graph, 1.5, 0.3);

      const COUNT = 11, sizes = [0.15, 0.1, 0.12, 0.09, 0.13, 0.1, 0.11, 0.09, 0.14, 0.1, 0.12], finishes = [shell, silver, glow, pale];
      const points: THREE.Vector3[] = [];
      const ringGeometry = keep(new T.TorusGeometry(1, 0.035, 6, 48));
      for (let i = 0; i < COUNT; i++) {
        const y = 1 - ((i + 0.5) / COUNT) * 2, r = Math.sqrt(1 - y * y), angle = i * GOLDEN_ANGLE;
        const point = new T.Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r).multiplyScalar(1.3);
        points.push(point);
        ball(graph, finishes[i % 4], sizes[i], point.x, point.y, point.z);
        if (i % 4 === 0) {
          const ring = add(graph, ringGeometry, silver, point.x, point.y, point.z);
          ring.scale.setScalar(sizes[i] * 1.75);
          ring.rotation.set(i * 0.9 + 0.6, i * 0.5, 0);
        }
      }
      const segments: number[] = [];
      points.forEach((point, i) => {
        segments.push(0, 0, 0, point.x, point.y, point.z);
        for (let j = i + 1; j < COUNT; j++) if (point.distanceTo(points[j]) < 1.2) segments.push(point.x, point.y, point.z, points[j].x, points[j].y, points[j].z);
      });
      const links = keep(new T.BufferGeometry());
      links.setAttribute("position", new T.Float32BufferAttribute(segments, 3));
      graph.add(new T.LineSegments(links, lineStrong));
      const cage = keep(new T.IcosahedronGeometry(1.62, 1));
      graph.add(new T.LineSegments(keep(new T.EdgesGeometry(cage)), lineFaint));

      const pulses = [0, 2, 3, 5, 6, 8, 10].map(target => ({ target, mesh: ball(graph, led, 0.035) }));

      return {
        group,
        tick(time) {
          graph.rotation.set(Math.sin(time * 0.2) * 0.16 - look.y * 0.15, time * 0.16 + look.x * 0.3, 0);
          hub.rotation.set(time * 0.3, time * 0.42, 0);
          pulses.forEach(({ target, mesh }, i) => {
            const u = (time * 0.32 + i * 0.37) % 1, outbound = Math.floor(time * 0.32 + i * 0.37) % 2 === 0;
            mesh.position.copy(points[target]).multiplyScalar(outbound ? u : 1 - u);
            mesh.scale.setScalar(0.035 * Math.sin(u * Math.PI));
          });
        },
      };
    };

    /* ---------- 3 · Conversation: two bubbles and a message on its way ---------- */
    const buildConversation = (): Model => {
      const group = new T.Group(), bubbles = new T.Group();
      group.add(bubbles);

      const rear = new T.Group(); rear.position.set(0.3, 0.42, -0.3); rear.rotation.y = -0.22; bubbles.add(rear);
      add(rear, plate(roundedRect(1.5, 0.92, 0.26, 1), 0.1, 0.04), deep);
      const textGeometry = keep(new T.CapsuleGeometry(0.035, 1, 4, 12));
      [[0.72, 0.14, -0.2], [0.44, -0.08, -0.34]].forEach(([length, y, x]) => {
        const bar = add(rear, textGeometry, pale, x, y, 0.15);
        bar.rotation.z = Math.PI / 2; bar.scale.set(1, length, 0.5);
      });

      const front = new T.Group(); front.position.set(-0.32, -0.3, 0.24); front.rotation.y = 0.14; bubbles.add(front);
      add(front, plate(roundedRect(1.5, 0.92, 0.26, -1), 0.1, 0.04), shell);
      const dots = [-1, 0, 1].map(i => ball(front, led, 0.072, i * 0.3, 0, 0.17));

      const wing = keep(new T.BufferGeometry());
      const N = [0, 0, 0.3], L = [-0.2, 0.03, -0.22], Rt = [0.2, 0.03, -0.22], CL = [-0.03, 0.035, -0.22], CR = [0.03, 0.035, -0.22], K = [0, -0.1, -0.22];
      wing.setAttribute("position", new T.Float32BufferAttribute([...N, ...L, ...CL, ...N, ...CR, ...Rt, ...N, ...CL, ...K, ...N, ...K, ...CR], 3));
      wing.computeVertexNormals();
      const paper = keep(new T.MeshPhysicalMaterial({ color: 0xe9defc, metalness: 0.05, roughness: 0.5, side: T.DoubleSide, flatShading: true }));
      const plane = add(group, wing, paper);
      plane.scale.setScalar(1.5);
      const TRAIL = 12;
      const trail = Array.from({ length: TRAIL }, () => ball(group, pale, 0.02));

      const path = (angle: number, out: THREE.Vector3) => out.set(Math.cos(angle) * 1.5, Math.sin(angle * 2) * 0.28 + 0.12, Math.sin(angle) * 1.05);
      const here = new T.Vector3(), ahead = new T.Vector3(), right = new T.Vector3(), up = new T.Vector3(), forward = new T.Vector3(), basis = new T.Matrix4();

      return {
        group,
        tick(time) {
          bubbles.rotation.y = Math.sin(time * 0.4) * 0.22 + look.x * 0.25;
          bubbles.rotation.x = -look.y * 0.12;
          rear.position.y = 0.42 + Math.sin(time * 0.9) * 0.04;
          front.position.y = -0.3 + Math.sin(time * 0.9 + 1.6) * 0.04;
          dots.forEach((dot, i) => {
            const phase = (time * 1.25 - i * 0.16 + 10) % 1.5;
            dot.position.y = phase < 0.45 ? Math.sin((phase / 0.45) * Math.PI) * 0.1 : 0;
          });
          const angle = time * 0.75;
          path(angle, here); path(angle + 0.05, ahead);
          forward.copy(ahead).sub(here).normalize();
          right.set(0, 1, 0).cross(forward).normalize();
          up.copy(forward).cross(right);
          basis.makeBasis(right, up, forward);
          plane.position.copy(here);
          plane.quaternion.setFromRotationMatrix(basis);
          plane.rotateZ(-0.45);
          trail.forEach((dot, i) => {
            path(angle - 0.16 - i * 0.085, dot.position);
            dot.scale.setScalar(0.02 * (1 - i / TRAIL));
          });
        },
      };
    };

    /* ---------- Assembly and transitions ---------- */
    const models = [buildBot(), buildDatabase(), buildGraph(), buildConversation()];
    const slots = models.map(model => { const slot = new T.Group(); slot.add(model.group); assembly.add(slot); return slot; });
    const clampSlide = (index: number) => Math.max(0, Math.min(models.length - 1, Math.round(index) || 0));
    let selected = clampSlide(initial.slide), motion = initial.motion, direction = 1;
    const presence: number[] = models.map((_, i) => (i === selected ? 1 : 0));
    let time = 0, last = 0;

    const overshoot = (p: number) => 1 + 2.4 * Math.pow(p - 1, 3) + 1.4 * Math.pow(p - 1, 2);
    const smooth = (p: number) => p * p * (3 - 2 * p);

    const step = (dt: number) => {
      let busy = false;
      const stageClear = presence.every((p, i) => i === selected || p < 0.3);
      slots.forEach((slot, i) => {
        const target = i === selected ? 1 : 0;
        if (!motion) presence[i] = target;
        else if (!target) presence[i] = Math.max(0, presence[i] - dt / 0.3);
        else if (stageClear) presence[i] = Math.min(1, presence[i] + dt / 0.75);
        const p = presence[i];
        if (p !== target) busy = true;
        slot.visible = p > 0.002;
        if (!slot.visible) return;
        const side = target ? direction : -direction, away = 1 - smooth(p);
        slot.scale.setScalar(Math.max(0.001, target ? overshoot(p) : p * p));
        slot.position.set(side * away * 1.1, -away * 0.25, 0);
        slot.rotation.y = side * away * 1.1;
        models[i].tick(time);
      });
      return busy;
    };

    const frame = (now: number) => {
      raf = 0;
      if (disposed) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
      last = now;
      if (motion) {
        time += dt;
        const ease = 1 - Math.exp(-dt * 4);
        look.x += (pointer.x - look.x) * ease; look.y += (pointer.y - look.y) * ease;
      } else { look.x = 0; look.y = 0; }
      const busy = step(dt);
      assembly.rotation.set(0.1 - look.y * 0.07, look.x * 0.14, 0);
      renderer.render(scene, camera);
      if ((motion || busy) && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const refresh = () => { cancelAnimationFrame(raf); last = 0; frame(performance.now()); };

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.position.z = FIT_RADIUS / (Math.tan((FOV * Math.PI) / 360) * Math.min(1, camera.aspect));
      camera.updateProjectionMatrix();
      refresh();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    const onVisibility = () => { if (document.hidden) cancelAnimationFrame(raf); else refresh(); };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = 1 - (event.clientY / window.innerHeight) * 2;
    };
    const onLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(raf); };
    const onRestored = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    cleanups.push(() => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    });

    resize();

    return {
      setSlide(index) {
        const next = clampSlide(index);
        if (disposed || next === selected) return;
        direction = next > selected ? 1 : -1;
        selected = next;
        refresh();
      },
      setMotion(on) {
        if (disposed || on === motion) return;
        motion = on;
        refresh();
      },
      dispose: destroy,
    };
  } catch (error) {
    console.warn("3D scene failed to start; showing the static fallback.", error);
    destroy();
    return null;
  }
}
