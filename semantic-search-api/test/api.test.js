import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { after, before, test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverEntry = path.join(apiRoot, 'src', 'Server.js');
const tempDir = mkdtempSync(path.join(tmpdir(), 'support-ticket-similarity-'));
const baseUrl = 'http://127.0.0.1:8081';

let server;
let serverOutput = '';

async function waitForApi() {
  const deadline = Date.now() + 300_000;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`API process exited during startup:\n${serverOutput}`);
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return response.json();
    } catch {
      await delay(500);
    }
  }

  throw new Error(`API did not become ready within five minutes:\n${serverOutput}`);
}

async function requestJson(route, options) {
  const response = await fetch(`${baseUrl}${route}`, options);
  return { response, body: await response.json() };
}

before(async () => {
  server = spawn(process.execPath, [serverEntry], {
    cwd: tempDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk; });
  server.stderr.setEncoding('utf8').on('data', (chunk) => { serverOutput += chunk; });

  const health = await waitForApi();
  assert.equal(health.status, 'ok');
  assert.ok(health.tickets > 0, 'expected the API to seed its ticket database');
}, { timeout: 360_000 });

after(async () => {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise((resolve) => server.once('exit', resolve));
    server.kill();
    await exited;
  }
  rmSync(tempDir, { recursive: true, force: true });
});

test('health endpoint returns status and the seeded ticket count', async () => {
  const { response, body } = await requestJson('/api/health');

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.ok(body.tickets > 0);
});

test('ticket listing returns ticket data without embedding vectors', async () => {
  const { response, body } = await requestJson('/api/tickets');

  assert.equal(response.status, 200);
  assert.equal(body.count, body.tickets.length);
  assert.ok(body.count > 0);
  assert.equal('vector' in body.tickets[0], false);
});

test('ticket listing filters results by category', async () => {
  const allTickets = await requestJson('/api/tickets');
  const category = allTickets.body.tickets[0].category;
  const filtered = await requestJson(`/api/tickets?category=${encodeURIComponent(category)}`);

  assert.equal(filtered.response.status, 200);
  assert.ok(filtered.body.count > 0);
  assert.ok(filtered.body.tickets.every((ticket) => ticket.category === category));
});

test('ticket lookup returns an existing ticket and 404 for an unknown ticket', async () => {
  const list = await requestJson('/api/tickets');
  const existingId = list.body.tickets[0].ticket_id;
  const found = await requestJson(`/api/tickets/${encodeURIComponent(existingId)}`);
  const missing = await requestJson('/api/tickets/UNKNOWN-TICKET');

  assert.equal(found.response.status, 200);
  assert.equal(found.body.ticket_id, existingId);
  assert.equal('vector' in found.body, false);
  assert.equal(missing.response.status, 404);
  assert.deepEqual(missing.body, { error: 'Ticket not found' });
});

test('similarity search ranks the identical ticket first and respects topK', async () => {
  const list = await requestJson('/api/tickets');
  const ticket = list.body.tickets[0];
  const { response, body } = await requestJson('/api/tickets/similar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: ticket.subject, description: ticket.description, topK: 1 }),
  });

  assert.equal(response.status, 200);
  assert.equal(body.results.length, 1);
  assert.equal(body.results[0].ticket_id, ticket.ticket_id);
  assert.ok(body.results[0].score >= 0.99);
  assert.equal('vector' in body.results[0], false);
});

test('similarity search applies minScore and rejects a missing subject', async () => {
  const noMatches = await requestJson('/api/tickets/similar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: 'Unrelated query', minScore: 1.1 }),
  });
  const invalid = await requestJson('/api/tickets/similar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'Subject was not provided' }),
  });

  assert.equal(noMatches.response.status, 200);
  assert.deepEqual(noMatches.body.results, []);
  assert.equal(invalid.response.status, 400);
  assert.deepEqual(invalid.body, { error: 'Invalid subject' });
});

test('ticket creation requires a subject', async () => {
  const { response, body } = await requestJson('/api/add/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description: 'No subject' }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(body, { error: '"subject" (string) is required' });
});

test('ticket creation persists the ticket and makes it searchable', async () => {
  const created = await requestJson('/api/add/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject: 'Test-only ticket for persistence verification',
      description: 'Created by the API integration test.',
      category: 'test',
      tags: ['automated-test'],
    }),
  });

  assert.equal(created.response.status, 201);
  assert.equal(created.body.status, 'open');

  const fetched = await requestJson(`/api/tickets/${encodeURIComponent(created.body.ticket_id)}`);
  assert.equal(fetched.response.status, 200);
  assert.equal(fetched.body.subject, created.body.subject);

  const search = await requestJson('/api/tickets/similar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject: created.body.subject, description: created.body.description, topK: 1 }),
  });
  assert.equal(search.response.status, 200);
  assert.equal(search.body.results[0].ticket_id, created.body.ticket_id);
});

test('ticket update persists resolution status and notes; unknown IDs return 404', async () => {
  const list = await requestJson('/api/tickets');
  const ticket = list.body.tickets.find((item) => item.status === 'open');
  assert.ok(ticket, 'expected at least one open ticket to update');

  const updated = await requestJson(`/api/update/ticket/${encodeURIComponent(ticket.ticket_id)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'resolved', resolution_notes: 'Resolved by the integration test.' }),
  });
  const missing = await requestJson('/api/update/ticket/UNKNOWN-TICKET', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'resolved' }),
  });

  assert.equal(updated.response.status, 200);
  assert.equal(updated.body.status, 'resolved');
  assert.equal(updated.body.resolution_notes, 'Resolved by the integration test.');

  const fetched = await requestJson(`/api/tickets/${encodeURIComponent(ticket.ticket_id)}`);
  assert.equal(fetched.body.status, 'resolved');
  assert.equal(fetched.body.resolution_notes, 'Resolved by the integration test.');
  assert.equal(missing.response.status, 404);
});
