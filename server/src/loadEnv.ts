import dotenv from 'dotenv';
import path from 'path';

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  dotenv.config({ path: path.join(__dirname, '..', '.env') });
  dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });
  dotenv.config();
  loaded = true;
}
