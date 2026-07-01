import fs from 'node:fs';
import path from 'node:path';
import { MeshoptSimplifier } from 'meshoptimizer';

const inputGlb = process.argv[2] || path.resolve('D:/love1/.tmp_astronaut/source/Astronaut.glb');
const outputDir = process.argv[3] || path.resolve('D:/love1/public/models/astronaut-lite');
const simplificationRatio = Number(process.argv[4] || 0.12);
const outputTexturesDir = path.join(outputDir, 'textures');
const outputGltf = path.join(outputDir, 'Astronaut.gltf');
const outputBin = path.join(outputDir, 'Astronaut.bin');

await MeshoptSimplifier.ready;

const glb = fs.readFileSync(inputGlb);
const magic = glb.toString('utf8', 0, 4);
if (magic !== 'glTF') {
  throw new Error('Input is not a GLB file.');
}

const jsonLength = glb.readUInt32LE(12);
const jsonStart = 20;
const jsonEnd = jsonStart + jsonLength;
const json = JSON.parse(glb.toString('utf8', jsonStart, jsonEnd));
const jsonChunkPaddedEnd = jsonStart + pad4(jsonLength);

const binType = glb.toString('utf8', jsonChunkPaddedEnd + 4, jsonChunkPaddedEnd + 8);
if (binType !== 'BIN\0') {
  throw new Error('Expected BIN chunk in the GLB.');
}
const binLength = glb.readUInt32LE(jsonChunkPaddedEnd);
const binStart = jsonChunkPaddedEnd + 8;
const bin = glb.subarray(binStart, binStart + binLength);

fs.mkdirSync(outputTexturesDir, { recursive: true });

const COMPONENT_TYPES = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
};

const COMPONENT_READERS = {
  5120: (view, offset) => view.getInt8(offset),
  5121: (view, offset) => view.getUint8(offset),
  5122: (view, offset, little) => view.getInt16(offset, little),
  5123: (view, offset, little) => view.getUint16(offset, little),
  5125: (view, offset, little) => view.getUint32(offset, little),
  5126: (view, offset, little) => view.getFloat32(offset, little),
};

const COMPONENT_WRITERS = {
  5120: (view, offset, value, little) => view.setInt8(offset, value),
  5121: (view, offset, value, little) => view.setUint8(offset, value),
  5122: (view, offset, value, little) => view.setInt16(offset, value, little),
  5123: (view, offset, value, little) => view.setUint16(offset, value, little),
  5125: (view, offset, value, little) => view.setUint32(offset, value, little),
  5126: (view, offset, value, little) => view.setFloat32(offset, value, little),
};

const TYPE_COMPONENTS = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
};

function pad4(n) {
  return (n + 3) & ~3;
}

function getAccessorInfo(accessorIndex) {
  const accessor = json.accessors[accessorIndex];
  const bufferView = json.bufferViews[accessor.bufferView];
  const componentType = accessor.componentType;
  const components = TYPE_COMPONENTS[accessor.type];
  const bytesPerComponent = COMPONENT_TYPES[componentType].BYTES_PER_ELEMENT;
  const itemByteLength = components * bytesPerComponent;
  const stride = bufferView.byteStride || itemByteLength;
  const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0);
  return {
    accessor,
    bufferView,
    componentType,
    components,
    bytesPerComponent,
    itemByteLength,
    stride,
    byteOffset,
  };
}

function readAccessor(accessorIndex) {
  const info = getAccessorInfo(accessorIndex);
  const ArrayType = COMPONENT_TYPES[info.componentType];
  const out = new ArrayType(info.accessor.count * info.components);
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  let dst = 0;

  for (let i = 0; i < info.accessor.count; i++) {
    const base = info.byteOffset + i * info.stride;
    for (let c = 0; c < info.components; c++) {
      out[dst++] = COMPONENT_READERS[info.componentType](view, base + c * info.bytesPerComponent, true);
    }
  }

  return out;
}

function writeTypedArray(array, componentType) {
  const ArrayType = COMPONENT_TYPES[componentType];
  const bytes = new ArrayBuffer(array.length * ArrayType.BYTES_PER_ELEMENT);
  const view = new DataView(bytes);
  let offset = 0;
  for (const value of array) {
    COMPONENT_WRITERS[componentType](view, offset, value, true);
    offset += ArrayType.BYTES_PER_ELEMENT;
  }
  return new Uint8Array(bytes);
}

function mergeFloatAttributes(attributeArrays, vertexCount) {
  const parts = attributeArrays.filter(Boolean);
  const weights = parts.map((entry) => entry.weight);
  const totalStride = parts.reduce((sum, entry) => sum + entry.stride, 0);
  const merged = new Float32Array(vertexCount * totalStride);

  for (let v = 0; v < vertexCount; v++) {
    let base = v * totalStride;
    for (const part of parts) {
      const srcBase = v * part.stride;
      for (let i = 0; i < part.stride; i++) {
        merged[base++] = part.data[srcBase + i];
      }
    }
  }

  return { merged, totalStride, weights };
}

function compactionMap(indices) {
  const map = new Map();
  const remap = new Uint32Array(indices.length);
  let next = 0;

  for (let i = 0; i < indices.length; i++) {
    const oldIndex = indices[i];
    let newIndex = map.get(oldIndex);
    if (newIndex === undefined) {
      newIndex = next++;
      map.set(oldIndex, newIndex);
    }
    remap[i] = newIndex;
  }

  return { map, remap, vertexCount: next };
}

function compactAccessor(accessorIndex, usedMap, newIndexCount, vertexCount) {
  const info = getAccessorInfo(accessorIndex);
  const src = readAccessor(accessorIndex);
  const ArrayType = COMPONENT_TYPES[info.componentType];
  const out = new ArrayType(vertexCount * info.components);

  for (const [oldIndex, newIndex] of usedMap.entries()) {
    for (let c = 0; c < info.components; c++) {
      out[newIndex * info.components + c] = src[oldIndex * info.components + c];
    }
  }

  return {
    data: out,
    accessorPatch: {
      bufferView: null,
      byteOffset: 0,
      componentType: info.componentType,
      count: vertexCount,
      type: info.accessor.type,
      normalized: info.accessor.normalized || false,
      min: info.accessor.min,
      max: info.accessor.max,
    },
  };
}

function encodeImage(bufferViewIndex, fileName) {
  const bufferView = json.bufferViews[bufferViewIndex];
  const start = (bufferView.byteOffset || 0);
  const end = start + bufferView.byteLength;
  const imageBytes = Buffer.from(bin.subarray(start, end));
  const outPath = path.join(outputTexturesDir, fileName);
  fs.writeFileSync(outPath, imageBytes);
}

const imageNames = [
  'gltf_embedded_0.png',
  'gltf_embedded_1.png',
  'gltf_embedded_2.png',
  'gltf_embedded_3.png',
  'gltf_embedded_4.png',
  'gltf_embedded_5.png',
  'gltf_embedded_6.png',
  'gltf_embedded_7.png',
];

json.images.forEach((image, index) => {
  encodeImage(image.bufferView, imageNames[index]);
  delete image.bufferView;
  image.mimeType = 'image/png';
  image.uri = `textures/${imageNames[index]}`;
});

const rewrittenAccessors = new Array(json.accessors.length);
const rewrittenMeshes = JSON.parse(JSON.stringify(json.meshes));
const processedAccessorIds = new Set();
const indexAccessorIds = new Set();
const vertexAccessorIds = new Set();
const outputBuffers = [];

function addAccessorData(accessorIndex, data, componentType, type) {
  const bufferViewIndex = accessorIndex;
  const byteOffset = outputBuffers.reduce((sum, item) => sum + item.length, 0);
  const byteLength = data.length * COMPONENT_TYPES[componentType].BYTES_PER_ELEMENT;
  outputBuffers.push({
    index: bufferViewIndex,
    data,
    componentType,
    type,
    byteOffset,
    byteLength,
  });

  rewrittenAccessors[accessorIndex] = {
    ...json.accessors[accessorIndex],
    bufferView: bufferViewIndex,
    byteOffset: 0,
    componentType,
    count: data.length / TYPE_COMPONENTS[type],
    type,
  };
}

for (const mesh of json.meshes) {
  for (const primitive of mesh.primitives) {
    const positionAccessor = primitive.attributes.POSITION;
    const indexAccessor = primitive.indices;
    const position = readAccessor(positionAccessor);
    const indicesRaw = readAccessor(indexAccessor);
    const indices = new Uint32Array(indicesRaw.length);
    indices.set(indicesRaw);
    const vertexCount = position.length / 3;

    const attributeParts = [];
    const attrWeights = [];

    for (const [name, accessorIndex] of Object.entries(primitive.attributes)) {
      if (name === 'POSITION') continue;
      const info = getAccessorInfo(accessorIndex);
      if (info.accessor.type === 'SCALAR') continue;
      const data = readAccessor(accessorIndex);
      attributeParts.push({ name, data, stride: info.components });
      attrWeights.push(name === 'NORMAL' ? 1 : name === 'TANGENT' ? 0.8 : name.startsWith('TEXCOORD') ? 0.75 : 0.9);
    }

    const merged = mergeFloatAttributes(
      attributeParts.map((part, i) => ({ data: part.data, stride: part.stride, weight: attrWeights[i] })),
      vertexCount
    );

    const targetIndexCount = Math.max(3, Math.min(indices.length, Math.floor((indices.length * simplificationRatio) / 3) * 3));
    const targetError = MeshoptSimplifier.getScale(position, 3) * 0.0035;
    const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(
      indices,
      position,
      3,
      merged.merged,
      merged.totalStride,
      attrWeights,
      null,
      targetIndexCount,
      targetError,
      ['Sparse', 'LockBorder']
    );

    const { map: usedMap, vertexCount: compactVertexCount } = compactionMap(simplified);
    const remappedIndices = new Uint32Array(simplified.length);
    for (let i = 0; i < simplified.length; i++) remappedIndices[i] = usedMap.get(simplified[i]);

    const indexComponentType = compactVertexCount <= 65535 ? 5123 : 5125;
    const IndexArrayType = COMPONENT_TYPES[indexComponentType];
    const finalIndices = new IndexArrayType(remappedIndices);

    // write indices
    rewrittenAccessors[indexAccessor] = {
      ...json.accessors[indexAccessor],
      bufferView: indexAccessor,
      byteOffset: 0,
      componentType: indexComponentType,
      count: finalIndices.length,
      type: 'SCALAR',
      normalized: false,
    };
    outputBuffers.push({
      index: indexAccessor,
      data: finalIndices,
      componentType: indexComponentType,
      type: 'SCALAR',
      byteOffset: 0,
      byteLength: finalIndices.length * IndexArrayType.BYTES_PER_ELEMENT,
    });

    processedAccessorIds.add(indexAccessor);
    indexAccessorIds.add(indexAccessor);

    // write vertex attributes
    for (const [name, accessorIndex] of Object.entries(primitive.attributes)) {
      if (name === 'POSITION') {
        const compacted = new Float32Array(compactVertexCount * 3);
        for (const [oldIndex, newIndex] of usedMap.entries()) {
          compacted.set(position.subarray(oldIndex * 3, oldIndex * 3 + 3), newIndex * 3);
        }
        rewrittenAccessors[accessorIndex] = {
          ...json.accessors[accessorIndex],
          bufferView: accessorIndex,
          byteOffset: 0,
          componentType: 5126,
          count: compactVertexCount,
          type: 'VEC3',
        };
        outputBuffers.push({
          index: accessorIndex,
          data: compacted,
          componentType: 5126,
          type: 'VEC3',
          byteOffset: 0,
          byteLength: compacted.length * 4,
        });
        processedAccessorIds.add(accessorIndex);
        vertexAccessorIds.add(accessorIndex);
        continue;
      }

      const info = getAccessorInfo(accessorIndex);
      const src = readAccessor(accessorIndex);
      const ArrayType = COMPONENT_TYPES[info.componentType];
      const compacted = new ArrayType(compactVertexCount * info.components);
      for (const [oldIndex, newIndex] of usedMap.entries()) {
        compacted.set(
          src.subarray(oldIndex * info.components, oldIndex * info.components + info.components),
          newIndex * info.components
        );
      }

      rewrittenAccessors[accessorIndex] = {
        ...json.accessors[accessorIndex],
        bufferView: accessorIndex,
        byteOffset: 0,
        componentType: info.componentType,
        count: compactVertexCount,
        type: info.accessor.type,
        normalized: info.accessor.normalized || false,
      };
      outputBuffers.push({
        index: accessorIndex,
        data: compacted,
        componentType: info.componentType,
        type: info.accessor.type,
        byteOffset: 0,
        byteLength: compacted.length * ArrayType.BYTES_PER_ELEMENT,
      });
      processedAccessorIds.add(accessorIndex);
      vertexAccessorIds.add(accessorIndex);
    }

    primitive.extensions = primitive.extensions || {};
    primitive.extras = primitive.extras || {};
    primitive.extras.simplifiedError = error;
  }
}

for (let i = 0; i < json.accessors.length; i++) {
  if (processedAccessorIds.has(i)) continue;
  const info = getAccessorInfo(i);
  const data = readAccessor(i);
  const ArrayType = COMPONENT_TYPES[info.componentType];
  const copy = new ArrayType(data);
  rewrittenAccessors[i] = {
    ...json.accessors[i],
    bufferView: i,
    byteOffset: 0,
    componentType: info.componentType,
    count: info.accessor.count,
    type: info.accessor.type,
    normalized: info.accessor.normalized || false,
  };
  outputBuffers.push({
    index: i,
    data: copy,
    componentType: info.componentType,
    type: info.accessor.type,
    byteOffset: 0,
    byteLength: copy.length * ArrayType.BYTES_PER_ELEMENT,
  });
}

outputBuffers.sort((a, b) => a.index - b.index);

let binChunks = [];
let cursor = 0;
const rewrittenBufferViews = new Array(outputBuffers.length);

for (const item of outputBuffers) {
  const paddedOffset = pad4(cursor);
  if (paddedOffset > cursor) {
    binChunks.push(Buffer.alloc(paddedOffset - cursor));
    cursor = paddedOffset;
  }

  const bytes = Buffer.from(writeTypedArray(item.data, item.componentType));
  rewrittenBufferViews[item.index] = {
    buffer: 0,
    byteOffset: cursor,
    byteLength: bytes.length,
    target: indexAccessorIds.has(item.index) ? 34963 : vertexAccessorIds.has(item.index) ? 34962 : undefined,
  };
  binChunks.push(bytes);
  cursor += bytes.length;
}

const binOut = Buffer.concat(binChunks);

const gltf = {
  asset: {
    version: '2.0',
    generator: 'love-gallery astronaut optimizer',
  },
  scenes: json.scenes,
  scene: json.scene,
  nodes: json.nodes,
  meshes: rewrittenMeshes,
  materials: json.materials,
  textures: json.textures,
  images: json.images,
  skins: json.skins,
  animations: json.animations,
  samplers: json.samplers,
  cameras: json.cameras,
  accessors: rewrittenAccessors,
  bufferViews: rewrittenBufferViews,
  buffers: [{ byteLength: binOut.length, uri: 'Astronaut.bin' }],
  extensionsUsed: json.extensionsUsed,
  extensionsRequired: json.extensionsRequired,
  extras: json.extras,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputBin, binOut);
fs.writeFileSync(outputGltf, JSON.stringify(gltf, null, 2));

console.log(`Wrote ${outputGltf}`);
console.log(`Wrote ${outputBin}`);
console.log(`Textures in ${outputTexturesDir}`);
