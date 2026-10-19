

const API_URL = 'http://localhost:3000/api';

export async function getAllTickets() {
    return fetch(`${API_URL}/tickets`)
        .then(response => response.json())
        .catch(error => {
            console.error('Error fetching tickets:', error);
            throw error;
        });
}

export async function getTicketById(ticketId) {
    return fetch(`${API_URL}/tickets/${ticketId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching ticket with ID ${ticketId}: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`Error fetching ticket with ID ${ticketId}:`, error);
            throw error;
        });
    }

export async function createTicket(ticketData) {
    return fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
        })
        .then(response => {     
         if (!response.ok) {
                throw new Error(`Error creating ticket: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error creating ticket:', error);
            throw error;
        });
    }

export async function healthCheck() {
    return fetch(`${API_URL}/health`)
        .then(response => response.json())
        .catch(error => {
            console.error('Error performing health check:', error);
            throw error;
        });
}

export async function semanticSearch(query) {
    return fetch(`${API_URL}/semantic-search`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error performing semantic search: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error performing semantic search:', error);
            throw error;
        });
    }

export async function updateTicket(ticket_id, updatedTicket) {
    return fetch(`${API_URL}/update/ticket/${ticket_id}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedTicket),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error updating ticket: ${response.statusText}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error updating ticket:', error);
            throw error;
        });
}