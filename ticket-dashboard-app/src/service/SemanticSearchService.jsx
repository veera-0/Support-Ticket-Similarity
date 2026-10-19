

const API_URL = 'http://localhost:8081/api';

export async function getAllTickets() {
    try {
        const response = await fetch(`${API_URL}/tickets`);
        if (!response.ok) {
            throw new Error(`Error fetching tickets: ${response.statusText}`);
        }

        const result = await response.json();
        if (!Array.isArray(result.tickets)) {
            throw new Error('Invalid tickets response: expected a tickets array');
        }

        return result.tickets;
    } catch (error) {
        console.error('Error fetching tickets:', error);
        throw error;
    }
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
    const response = await fetch(`${API_URL}/add/ticket`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
    });

    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error || `Error creating ticket: ${response.statusText}`);
    }

    return result;
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