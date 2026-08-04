import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', 'src', 'content', 'posts');
const MAX_DIM = 2400;
const JPEG_QUALITY = 82;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files = files.concat(await walk(full));
    } else if (/\.(jpe?g|png)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

function relFromPostDir(filePath) {
  const afterRoot = path.relative(ROOT, filePath);
  const [slug, ...restParts] = afterRoot.split(path.sep);
  const rel = './' + restParts.join('/');
  return { postDir: path.join(ROOT, slug), slug, rel };
}

async function processFile(filePath, stats) {
  const before = (await fs.stat(filePath)).size;
  const ext = path.extname(filePath).toLowerCase();
  const isPng = ext === '.png';

  const meta = await sharp(filePath, { failOn: 'none' }).metadata();
  const needsResize = Math.max(meta.width, meta.height) > MAX_DIM;

  let pipeline = sharp(filePath, { failOn: 'none' }).rotate();
  if (needsResize) {
    pipeline = pipeline.resize({
      width: meta.width >= meta.height ? MAX_DIM : undefined,
      height: meta.height > meta.width ? MAX_DIM : undefined,
      withoutEnlargement: true,
    });
  }
  pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });

  const tmpPath = filePath + '.tmp';
  await pipeline.toFile(tmpPath);
  const after = (await fs.stat(tmpPath)).size;

  let finalPath = filePath;
  if (isPng) {
    finalPath = filePath.replace(/\.png$/i, '.jpg');
    await fs.rename(tmpPath, finalPath);
    await fs.unlink(filePath);
  } else {
    await fs.rename(tmpPath, filePath);
  }

  stats.before += before;
  stats.after += after;
  stats.count++;

  if (isPng) {
    const { postDir, rel } = relFromPostDir(filePath);
    const newRel = rel.replace(/\.png$/i, '.jpg');
    stats.renames.push({ postDir, oldRel: rel, newRel });
  }
}

async function main() {
  const files = await walk(ROOT);
  console.log(`Found ${files.length} images`);
  const stats = { before: 0, after: 0, count: 0, renames: [] };

  const CONCURRENCY = 8;
  let idx = 0;
  async function worker() {
    while (idx < files.length) {
      const i = idx++;
      const f = files[i];
      try {
        await processFile(f, stats);
      } catch (err) {
        console.error('FAILED', f, err.message);
      }
      if (stats.count % 100 === 0) {
        console.log(`Processed ${stats.count}/${files.length}...`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log('--- DONE ---');
  console.log(`Files processed: ${stats.count}`);
  console.log(`Before: ${(stats.before / 1e9).toFixed(2)} GB`);
  console.log(`After:  ${(stats.after / 1e9).toFixed(2)} GB`);
  console.log(`PNG->JPG renames: ${stats.renames.length}`);

  const byPost = new Map();
  for (const r of stats.renames) {
    if (!byPost.has(r.postDir)) byPost.set(r.postDir, []);
    byPost.get(r.postDir).push(r);
  }
  for (const [postDir, renames] of byPost) {
    const mdxPath = path.join(postDir, 'index.mdx');
    let content;
    try {
      content = await fs.readFile(mdxPath, 'utf-8');
    } catch {
      continue;
    }
    let changed = false;
    for (const { oldRel, newRel } of renames) {
      if (content.includes(oldRel)) {
        content = content.split(oldRel).join(newRel);
        changed = true;
      }
    }
    if (changed) {
      await fs.writeFile(mdxPath, content, 'utf-8');
      console.log('Updated refs in', mdxPath);
    }
  }

  await fs.writeFile(
    path.join(import.meta.dirname, 'recompress-report.json'),
    JSON.stringify(stats, null, 2)
  );
}

main();
