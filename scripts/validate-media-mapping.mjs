import fs from 'node:fs';

const dataTs = fs.readFileSync(new URL('../constants/data.ts', import.meta.url), 'utf8');
const guidesTs = fs.readFileSync(new URL('../constants/part-guides.ts', import.meta.url), 'utf8');
const mediaTs = fs.readFileSync(new URL('../constants/exercise-media.ts', import.meta.url), 'utf8');

const parseMapping = (name) => {
  const match = mediaTs.match(new RegExp(`const\\s+${name}:\\s*Record<string,\\s*string>\\s*=\\s*\\{([\\s\\S]*?)\\n\\};`));
  if (!match) return {};
  const body = match[1];
  const entries = [...body.matchAll(/\s*([a-z0-9_\-']+)\s*:\s*'([^']+)'/gi)];
  const map = {};
  for (const item of entries) {
    const key = item[1].replace(/^'|'+$/g, '');
    map[key] = item[2];
  }
  return map;
};

const EXERCISE_MEDIA_MAPPING = parseMapping('EXERCISE_TO_DB_ID');
const GUIDE_MEDIA_MAPPING = parseMapping('GUIDE_TO_DB_ID');

const exerciseIds = [...dataTs.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);
const guideIds = [...guidesTs.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

const missingExercise = exerciseIds.filter((id) => !EXERCISE_MEDIA_MAPPING[id]);
const missingGuide = guideIds.filter((id) => !GUIDE_MEDIA_MAPPING[id]);

console.log(`exercise ids: ${exerciseIds.length}`);
console.log(`guide ids: ${guideIds.length}`);

if (missingExercise.length) {
  console.error('Missing exercise mappings:', missingExercise.join(', '));
}
if (missingGuide.length) {
  console.error('Missing guide mappings:', missingGuide.join(', '));
}

if (missingExercise.length || missingGuide.length) {
  process.exit(1);
}

console.log('Media mapping validation passed.');
