export class Ticket {
  constructor({
    ticket_id = null,
    category = null,
    subject = '',
    description = '',
    resolution_notes = null,
    tags = [],
    created_at = null,
    status = 'open',
  } = {}) {
    this.ticket_id = ticket_id
    this.category = category
    this.subject = subject
    this.description = description
    this.resolution_notes = resolution_notes
    this.tags = Array.isArray(tags) ? [...tags] : []
    this.created_at = created_at
    this.status = status
  }
}
