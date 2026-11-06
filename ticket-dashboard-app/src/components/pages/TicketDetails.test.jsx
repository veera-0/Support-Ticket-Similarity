import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import {
    getTicketById,
    semanticSearch,
    updateTicket,
} from '../../service/SemanticSearchService';
import TicketDetails from './TicketDetails';

vi.mock('../../service/SemanticSearchService', () => ({
    getTicketById: vi.fn(),
    semanticSearch: vi.fn(),
    updateTicket: vi.fn(),
}));

vi.mock('../header/Header', () => ({ default: () => <header /> }));
vi.mock('../footer/Footer', () => ({ default: () => <footer /> }));
vi.mock('../main/ticketProp/TicketProp', () => ({
    default: ({ ticket }) => <div data-testid="ticket-summary">{ticket.subject}</div>,
}));

const currentTicket = {
    ticket_id: 'T-2001',
    subject: 'Cannot export report',
    description: 'CSV export fails',
    status: 'open',
};

const similarResolvedTicket = {
    ticket_id: 'T-2002',
    subject: 'CSV download fails',
    description: 'Export endpoint returns an error',
    status: 'resolved',
    score: 0.9,
    resolution_notes: 'Regenerated the export and cleared the stale report cache.',
};

function renderTicketDetails() {
    return render(
        <MemoryRouter initialEntries={['/view/tickets/T-2001']}>
            <Routes>
                <Route path="/view/tickets/:ticketId" element={<TicketDetails />} />
            </Routes>
        </MemoryRouter>
    );
}

async function loadAndSearch(user) {
    renderTicketDetails();
    await screen.findByText(currentTicket.subject);
    await user.click(screen.getByRole('button', { name: 'Find similar tickets' }));
}

describe('TicketDetails', () => {
    beforeEach(() => {
        getTicketById.mockReset().mockResolvedValue(currentTicket);
        semanticSearch.mockReset().mockResolvedValue({
            results: [
                { ...currentTicket, score: 1 },
                similarResolvedTicket,
                {
                    ticket_id: 'T-2003',
                    subject: 'Open similar case',
                    status: 'open',
                    score: 0.9,
                },
            ],
        });
        updateTicket.mockReset().mockImplementation(async (_id, update) => ({
            ...currentTicket,
            ...update,
        }));
    });

    it('searches with the current ticket and displays only other resolved matches', async () => {
        const user = userEvent.setup();
        await loadAndSearch(user);

        expect(semanticSearch).toHaveBeenCalledWith({
            subject: currentTicket.subject,
            description: currentTicket.description,
            topK: 5,
        });
        expect(await screen.findByText(similarResolvedTicket.subject)).toBeInTheDocument();
        expect(screen.queryByText('Open similar case')).not.toBeInTheDocument();
        expect(screen.getByText(similarResolvedTicket.resolution_notes)).toBeInTheDocument();
    });

    it('applies a strong historical resolution and reports success', async () => {
        const user = userEvent.setup();
        await loadAndSearch(user);
        await user.click(await screen.findByRole('button', { name: 'Use resolution & resolve' }));

        expect(updateTicket).toHaveBeenCalledWith(currentTicket.ticket_id, {
            status: 'resolved',
            resolution_notes: similarResolvedTicket.resolution_notes,
        });
        expect(await screen.findByText(
            `Ticket ${currentTicket.ticket_id} was resolved using the resolution from ${similarResolvedTicket.ticket_id}.`
        )).toBeInTheDocument();
    });

    it('allows an agent to enter and save a manual resolution when no matches exist', async () => {
        const user = userEvent.setup();
        semanticSearch.mockResolvedValue({ results: [] });
        await loadAndSearch(user);

        await user.click(await screen.findByRole('button', { name: 'Add resolution manually' }));
        await user.type(
            screen.getByLabelText(/resolution notes/i),
            'Rebuilt the report and retried the export.'
        );
        await user.click(screen.getByRole('button', { name: 'Save resolution & resolve' }));

        expect(updateTicket).toHaveBeenCalledWith(currentTicket.ticket_id, {
            status: 'resolved',
            resolution_notes: 'Rebuilt the report and retried the export.',
        });
        expect(await screen.findByText(
            `Ticket ${currentTicket.ticket_id} was resolved with your resolution notes.`
        )).toBeInTheDocument();
    });

    it('shows a search failure to the agent', async () => {
        const user = userEvent.setup();
        semanticSearch.mockRejectedValue(new Error('Search service unavailable'));
        await loadAndSearch(user);

        expect(await screen.findByRole('alert')).toHaveTextContent('Search service unavailable');
    });
});
