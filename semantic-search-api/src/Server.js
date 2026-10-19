import express from 'express';
import cors from 'cors';

import { embed, ticketText } from './embedder.js';
import { insertTicket, loadAllTickets, getTicketById } from './db.js';
import seedIfEmpty, { cosine_similarity, matchLabel, nextTicketId } from './Utils.js';


const port = 8081;
const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'] })); // React dev servers
app.use(express.json());


//load seed data based on the tickets.json
await seedIfEmpty();

//load all tickets into memory
let index = loadAllTickets();
console.log(`Loaded ${index.length} tickets into memory`);

//vector will be removed from response
const sharedTicket = ({ vector, ...rest}) => rest;

// health check
app.get('/api/health', (_req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', tickets: index.length });
});

// list all tickets
app.get('/api/tickets', (req, res) => {
  const { category } = req.query;
  const list = index
    .filter((t) => !category || t.category === category)
    .map(sharedTicket);
  res.json({ count: list.length, tickets: list });
});


//get ticket by id
app.get('/api/tickets/:id', (req, res) => {
  console.log(`Received request to get ticket with ID: ${req.params.id}`);
  const t = getTicketById(req.params.id);
  if (!t) return res.status(404).json({ error: 'Ticket not found' });
  res.json(sharedTicket(t));
});

// post to check the similar tickets
app.post('/api/tickets/similar', async (req, res) => {
    console.log('Received request to find similar tickets:', req.body);
    try{
        const { subject, description='', topK=5, minScore = 0} = req.body;

        if(!subject || typeof subject !== 'string'){
            return res.status(400).json({ error: 'Invalid subject' });
        }

        if(index.length === 0){
            return res.json({query: {subject, description}, results: []});
        }

        const [queryVector] = await embed(ticketText({ subject, description }));

        const results = index
            .map((t) => ({ t, score: cosine_similarity(queryVector, t.vector) }))
            .filter(({ score }) => score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, Math.min(Number(topK) || 3, 20))
            .map(({ t, score }) => ({
                ticket_id: t.ticket_id,
                category: t.category,
                subject: t.subject,
                description: t.description,
                resolution_notes: t.resolution_notes,
                tags: t.tags,
                created_at: t.created_at,
                status: t.status,
                score: Number(score.toFixed(3)),
                match: matchLabel(score),
            }));

        console.log(`Found ${results.length} similar tickets for subject: "${subject}"`);
        res.json({
            query: { subject, description },
            possible_duplicate: results.length > 0 && results[0].score >= 0.75,
            results,
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

//post to create a new ticket
app.post('/api/add/ticket', async (req, res) => {
  console.log('Received request to add ticket:', req.body);
  try {
    const { subject, description = '' } = req.body;
    if (!subject || typeof subject !== 'string') {
      return res.status(400).json({ error: '"subject" (string) is required' });
    }
 
    const ticket = {
      ticket_id: nextTicketId(index),
      category: req.body.category ?? null,
      subject,
      description,
      resolution_notes: req.body.resolution_notes ?? null,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      created_at: req.body.created_at ?? new Date().toISOString().slice(0, 10),
      status: req.body.status ?? 'open',
    };
 
    if (index.some((t) => t.ticket_id === ticket.ticket_id)) {
      return res.status(409).json({ error: `Ticket ${ticket.ticket_id} already exists` });
    }
 
    const [vec] = await embed(ticketText(ticket));
    console.log('inserting new ticket data into database:', ticket);
    insertTicket(ticket, vec);                                  
    index.push({ ...ticket, vector: Float32Array.from(vec) });  
 
    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add ticket' });
  }
});

//update the existing ticket based on the anslysis
app.post('/api/update/ticket/:id', async (req, res) => {
  console.log(`Received request to update ticket ${req.params.id}:`, req.body);
  try{
    const ticketId = req.params.id;
    const retlatedTicket = getTicketById(ticketId);
    if (!retlatedTicket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const ticket = {
      ...retlatedTicket,
      category: req.body.category ?? retlatedTicket.category,
      resolution_notes: req.body.resolution_notes ?? retlatedTicket.resolution_notes,
      tags: Array.isArray(req.body.tags) ? req.body.tags : retlatedTicket.tags,
      status: req.body.status ?? retlatedTicket.status,
    }

    //update the record in the db
    console.log(`Updating ticket ${ticketId} in the database with data:`, ticket);
    updateTicket(ticketId, ticket);
    index.push({ ...ticket, vector: retlatedTicket.vector }); 
    res.status(200).json(ticket);

  } catch(err){
    console.error(err);
    res.status(500).json({ error: 'Could not update ticket' });
  }
});
 
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
