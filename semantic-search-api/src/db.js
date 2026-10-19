import Database from 'better-sqlite3';

const db = new Database('ticket-knowledgebase.db');

const createQuery = `
  CREATE TABLE IF NOT EXISTS tickets (
    ticket_id        TEXT PRIMARY KEY,
    category         TEXT,
    subject          TEXT NOT NULL,
    description      TEXT,
    resolution_notes TEXT,
    tags             TEXT,            
    created_at       TEXT,
    status           TEXT DEFAULT 'OPEN',
    vector           BLOB NOT NULL
  )
`

db.exec(createQuery);

// converting number array to blob for storage
export const toBlob = (vector) => Buffer.from(new Float32Array(vector).buffer);

//Buffer to float32 array
export const fromBlob = (blob) =>
  new Float32Array(blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength));

const insertStmt = db.prepare(`
  INSERT INTO tickets
    (ticket_id, category, subject, description, resolution_notes, tags, created_at, status, vector)
  VALUES
    (@ticket_id, @category, @subject, @description, @resolution_notes, @tags, @created_at, @status, @vector)
`);

export function insertTicket(t, vector) {
  insertStmt.run({
    ticket_id: t.ticket_id,
    category: t.category ?? null,
    subject: t.subject,
    description: t.description ?? '',
    resolution_notes: t.resolution_notes ?? null,
    tags: JSON.stringify(t.tags ?? []),
    created_at: t.created_at ?? new Date().toISOString().slice(0, 10),
    status: t.status ?? 'open',
    vector: toBlob(vector),
  });
}

export const insertTicketsData = db.transaction((tickets, vectors) => {
    tickets.forEach((t, i) => insertTicket(t, vectors[i]));
})


export const getTicketsCount = () => db.prepare('SELECT COUNT(*) AS n FROM tickets').get().n;


// load all tickets with their vectors from db
export function loadAllTickets() {
    return db.prepare('select * from tickets').all().map(rowToTicket);
}


export function getTicketById(ticket_id){
    const row = db.prepare('select * from tickets where ticket_id = ?')
            .get(ticket_id);

    return row ? rowToTicket(row) : null;
}

export function updateTicket(ticket_id, ticketData) {
  const existingTicket = getTicketById(ticket_id);
  if (!existingTicket) {
    throw new Error(`Ticket with ID ${ticket_id} not found`);
  }
  const updateStmt = db.prepare(`
    UPDATE tickets
    SET category = @category,
        resolution_notes = @resolution_notes,
        tags = @tags,
        status = @status
    WHERE ticket_id = @ticket_id
  `);
  updateStmt.run({
    ...ticketData,
    ticket_id: ticket_id
  });
}

export function rowToTicket(r) {
  return {
    ticket_id: r.ticket_id,
    category: r.category,
    subject: r.subject,
    description: r.description,
    resolution_notes: r.resolution_notes,
    tags: JSON.parse(r.tags || '[]'),
    created_at: r.created_at,
    status: r.status,
    vector: fromBlob(r.vector),
  };
}

export default db;

