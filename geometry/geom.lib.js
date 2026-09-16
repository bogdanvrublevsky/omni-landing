/**
 * Goldberg-polyhedron planet generator.
 *
 * Pure geometry library: no DOM, no rendering, no third-party dependencies.
 * Pipeline: icosahedron -> geodesic subdivision (Class I Goldberg-Coxeter,
 * parameter `frequency`) -> dual polyhedron. The dual always has exactly 12
 * pentagonal faces (a consequence of Euler's formula for trivalent polyhedra
 * made only of pentagons and hexagons) plus (10*frequency^2 - 10) hexagonal
 * faces, for a total of n = 10*frequency^2 + 2 faces.
 *
 * Rendering lives outside this library (see render.js) — this module only
 * produces plain vertex/face data.
 */

/** @typedef {[number, number, number]} Vec3 */

/**
 * @typedef {Object} Planet
 * @property {string} name Human-readable debug label — not part of the stable data contract.
 * @property {number} frequency Goldberg-Coxeter subdivision frequency (integer >= 1) used to generate this planet.
 * @property {Vec3[]} vertex Cell-center positions on the unit sphere, indexed by cell ID.
 * @property {number[][]} face One entry per cell: an ordered ring of vertex indices (5 for the 12 pentagons, 6 for every other cell) describing the cell's boundary.
 * @property {Object[]} cells Parallel array to `face`/`vertex` — one object per cell, reserved for future gameplay properties (terrain, resources, ...). The array index is a stable cell ID: generation is deterministic, so the same `frequency` always produces cells in the same order.
 */

const PHI = (1 + Math.sqrt(5)) / 2;

/** @param {Vec3} v @returns {Vec3} */
function normalize([x, y, z]) {
  const length = Math.sqrt(x * x + y * y + z * z);
  return [x / length, y / length, z / length];
}

// 12 vertices, 20 triangular faces of a regular icosahedron. Face vertex
// order gives an outward-facing normal (checked numerically during development).
function icosahedronBase() {
  const vertex = [
    [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
    [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
    [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
  ].map(normalize);

  const face = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  return { vertex, face };
}

// Geodesic subdivision (Class I Goldberg-Coxeter): each of the 20 base faces
// is split into frequency^2 small triangles on a barycentric grid, and points
// are projected back onto the unit sphere. Vertices shared by neighboring
// faces are deduplicated by rounded coordinates.
function subdivideIcosahedron(frequency) {
  const { vertex: baseVertex, face: baseFace } = icosahedronBase();

  const vertex = [];
  const indexByKey = new Map();

  function addVertex(point) {
    const p = normalize(point);
    const key = p.map((c) => c.toFixed(6)).join(',');
    let index = indexByKey.get(key);
    if (index === undefined) {
      index = vertex.length;
      vertex.push(p);
      indexByKey.set(key, index);
    }
    return index;
  }

  const face = [];

  for (const [ia, ib, ic] of baseFace) {
    const A = baseVertex[ia];
    const B = baseVertex[ib];
    const C = baseVertex[ic];

    // grid[i][j]: barycentric weights (frequency-i-j, i, j) over (A, B, C)
    const grid = [];
    for (let i = 0; i <= frequency; i++) {
      grid.push([]);
      for (let j = 0; j <= frequency - i; j++) {
        const k = frequency - i - j;
        grid[i][j] = addVertex([
          (A[0] * k + B[0] * i + C[0] * j) / frequency,
          (A[1] * k + B[1] * i + C[1] * j) / frequency,
          (A[2] * k + B[2] * i + C[2] * j) / frequency,
        ]);
      }
    }

    for (let i = 0; i < frequency; i++) {
      for (let j = 0; j < frequency - i; j++) {
        face.push([grid[i][j], grid[i + 1][j], grid[i][j + 1]]);
        if (j < frequency - i - 1) {
          face.push([grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]);
        }
      }
    }
  }

  return { vertex, face };
}

// Dual polyhedron: every vertex of the triangulated sphere becomes a face
// (pentagon at the 12 "poles" inherited from the icosahedron, hexagon
// everywhere else), and every triangular face becomes a vertex (its
// centroid, projected back onto the sphere).
function buildDual({ vertex, face }) {
  const incidentByVertex = vertex.map(() => []);

  face.forEach((f, faceIndex) => {
    for (let corner = 0; corner < 3; corner++) {
      const v = f[corner];
      const outgoing = f[(corner + 1) % 3];
      const incoming = f[(corner + 2) % 3];
      incidentByVertex[v].push({ incoming, outgoing, faceIndex });
    }
  });

  const dualVertex = face.map(([i, j, k]) => normalize([
    (vertex[i][0] + vertex[j][0] + vertex[k][0]) / 3,
    (vertex[i][1] + vertex[j][1] + vertex[k][1]) / 3,
    (vertex[i][2] + vertex[j][2] + vertex[k][2]) / 3,
  ]));

  const dualFace = incidentByVertex.map((edges) => {
    const byIncoming = new Map(edges.map((e) => [e.incoming, e]));
    let current = edges[0];
    const ring = [current.faceIndex];
    for (let step = 1; step < edges.length; step++) {
      current = byIncoming.get(current.outgoing);
      ring.push(current.faceIndex);
    }
    // Walking (incoming -> outgoing) traces the opposite direction from the
    // faces' original CCW winding — reverse so the normal points outward
    // (checked numerically: without reverse() 100% of dual faces were inward).
    return ring.reverse();
  });

  return { vertex: dualVertex, face: dualFace };
}

/**
 * Generates a Goldberg polyhedron GP(frequency, 0) — a sphere tiled with
 * exactly 12 pentagonal cells and (10*frequency^2 - 10) hexagonal cells.
 * frequency=1 is a degenerate but valid case: a regular dodecahedron
 * (12 pentagons, 0 hexagons).
 *
 * @param {number} frequency Subdivision frequency, integer >= 1. Total cell count n = 10*frequency^2 + 2.
 * @returns {Planet}
 * @throws {RangeError} If frequency is not an integer >= 1.
 */
export function generatePlanet(frequency) {
  if (!Number.isInteger(frequency) || frequency < 1) {
    throw new RangeError(`generatePlanet: frequency must be an integer >= 1, got ${frequency}`);
  }

  const sphere = subdivideIcosahedron(frequency);
  const { vertex, face } = buildDual(sphere);
  return {
    name: `Planet (frequency=${frequency}, n=${face.length})`,
    frequency,
    vertex,
    face,
    cells: face.map(() => ({})),
  };
}

/**
 * @typedef {Object} PlanetFile
 * @property {"anltx-planet"} format
 * @property {number} version
 * @property {number} frequency
 * @property {Vec3[]} vertex
 * @property {number[][]} face
 * @property {Object[]} cells
 */

// File format: a full snapshot (geometry + cells), not just `frequency`. This
// way a saved planet doesn't depend on future edits to the generation
// algorithm — loading never recomputes geometry, it's taken from the file
// as-is, so it can't drift from what the player saw at save time.
const PLANET_FORMAT = 'anltx-planet';
const PLANET_FORMAT_VERSION = 1;

/**
 * Serializes a Planet into a plain JSON-serializable snapshot.
 *
 * @param {Planet} planet
 * @returns {PlanetFile}
 * @throws {TypeError} If planet is missing vertex/face/cells.
 */
export function exportPlanet(planet) {
  if (!planet || !Array.isArray(planet.vertex) || !Array.isArray(planet.face) || !Array.isArray(planet.cells)) {
    throw new TypeError('exportPlanet: planet must have vertex/face/cells arrays.');
  }

  return {
    format: PLANET_FORMAT,
    version: PLANET_FORMAT_VERSION,
    frequency: planet.frequency,
    vertex: planet.vertex,
    face: planet.face,
    cells: planet.cells,
  };
}

/**
 * Parses and validates a PlanetFile (e.g. loaded from disk) back into a
 * Planet usable by the rest of the library/consumers.
 *
 * @param {PlanetFile} data
 * @returns {Planet}
 * @throws {Error} If data is not a recognized/compatible planet file.
 */
export function importPlanet(data) {
  if (!data || data.format !== PLANET_FORMAT) {
    throw new Error('Does not look like a planet file (expected format: "anltx-planet").');
  }
  if (data.version !== PLANET_FORMAT_VERSION) {
    throw new Error(`Unsupported planet file version: ${data.version}`);
  }
  if (!Array.isArray(data.vertex) || !Array.isArray(data.face)) {
    throw new Error('Corrupted planet file: missing vertex/face.');
  }

  const cells = Array.isArray(data.cells) && data.cells.length === data.face.length
    ? data.cells
    : data.face.map(() => ({}));

  return {
    name: `Planet (frequency=${data.frequency}, n=${data.face.length})`,
    frequency: data.frequency,
    vertex: data.vertex,
    face: data.face,
    cells,
  };
}
