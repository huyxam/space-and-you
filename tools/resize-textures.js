import * as Jimp from 'jimp';
import fs from 'node:fs';
import path from 'node:path';

const textureDir = process.argv[2] || path.resolve('public/models/astronaut-lite/textures');
const maxSize = Number(process.argv[3] || 512);

const files = fs.readdirSync(textureDir).filter((name) => name.toLowerCase().endsWith('.png'));

for (const file of files) {
  const filePath = path.join(textureDir, file);
  const image = await Jimp.Jimp.read(filePath);
  const { width, height } = image.bitmap;

  if (width <= maxSize && height <= maxSize) {
    console.log(`Skipping ${file} (${width}x${height})`);
    continue;
  }

  const scale = Math.min(maxSize / width, maxSize / height);
  const newWidth = Math.round(width * scale);
  const newHeight = Math.round(height * scale);

  image.resize({ w: newWidth, h: newHeight, mode: Jimp.ResizeStrategy.BILINEAR }).write(filePath);
  console.log(`Resized ${file}: ${width}x${height} -> ${newWidth}x${newHeight}`);
}

console.log(`Done resizing ${files.length} textures in ${textureDir}`);
