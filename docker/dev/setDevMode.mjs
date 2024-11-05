import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envFilePath = join(__dirname, '.env');
const mode = process.argv[2] || 'hot-reload';

function updateDevEnvVariable() {
  let envContent = readFileSync(envFilePath, 'utf8');

  if (envContent.includes('DEV_MODE=')) {
    envContent = envContent.replace(/DEV_MODE=.*/g, `DEV_MODE=${mode}`);
  } else {
    envContent += `\nDEV_MODE=${mode}`;
  }

  writeFileSync(envFilePath, envContent.trim() + '\n');
}

updateDevEnvVariable();
