
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { embed , ticketText } from './embedder.js';
import { getTicketsCount, insertTicketsData } from './db.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedIfEmpty() {
  if (getTicketsCount() > 0) return;
 
  const file = path.join(__dirname, 'data', 'tickets.json');
  if (!fs.existsSync(file)) {
    console.warn('No tickets.json found and DB is empty - starting with no tickets.');
    return;
  }
 
  const { tickets } = JSON.parse(fs.readFileSync(file, 'utf-8'));
  console.log(`Seeding ${tickets.length} tickets (embedding in one batch)...`);
 
  const vectors = await embed(tickets.map(ticketText));
  insertTicketsData(tickets, vectors);
  console.log('Seeding done.');
}

export default seedIfEmpty;

export function cosine_similarity(vecA, vecB) {
    let s = 0;
    for (let i = 0; i < vecA.length; i++) s += vecA[i] * vecB[i];
    return s;
}

export function matchLabel(score) {
  if (score >= 0.75) return 'strong';  
  if (score >= 0.5) return 'related';   
  return 'weak';                        
}

export function nextTicketId(tickets) {
  const max = tickets.reduce((m, t) => {
    const n = parseInt(t.ticket_id.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 1000);
  return `T-${max + 1}`;
}
