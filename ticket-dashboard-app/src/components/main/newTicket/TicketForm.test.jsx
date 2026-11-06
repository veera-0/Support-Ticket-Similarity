import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { createTicket } from '../../../service/SemanticSearchService';
import TicketForm from './TicketForm';

vi.mock('../../../service/SemanticSearchService', () => ({
    createTicket: vi.fn(),
}));

function renderTicketForm() {
    return render(
        <MemoryRouter>
            <TicketForm />
        </MemoryRouter>
    );
}

describe('TicketForm', () => {
    beforeEach(() => {
        createTicket.mockReset();
    });

    it('shows validation feedback and does not submit whitespace-only required fields', async () => {
        const user = userEvent.setup();
        renderTicketForm();

        await user.type(screen.getByLabelText(/subject/i), '   ');
        await user.type(screen.getByLabelText(/description/i), '   ');
        await user.click(screen.getByRole('button', { name: /submit ticket/i }));

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Please enter a subject and describe the issue before submitting.'
        );
        expect(createTicket).not.toHaveBeenCalled();
    });

    it('submits trimmed ticket details and displays the created ticket ID', async () => {
        const user = userEvent.setup();
        createTicket.mockResolvedValue({ ticket_id: 'T-1042' });
        renderTicketForm();

        await user.type(screen.getByLabelText(/subject/i), '  Login issue  ');
        await user.type(screen.getByLabelText(/description/i), '  Cannot sign in  ');
        await user.selectOptions(screen.getByLabelText(/category/i), 'Account access');
        await user.type(screen.getByLabelText(/tags/i), ' login, urgent , ');
        await user.click(screen.getByRole('button', { name: /submit ticket/i }));

        expect(createTicket).toHaveBeenCalledWith({
            subject: 'Login issue',
            description: 'Cannot sign in',
            category: 'Account access',
            tags: ['login', 'urgent'],
        });
        expect(await screen.findByText('T-1042')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('Ticket created successfully');
    });

    it('shows the API error when ticket creation fails', async () => {
        const user = userEvent.setup();
        createTicket.mockRejectedValue(new Error('Ticket service unavailable'));
        renderTicketForm();

        await user.type(screen.getByLabelText(/subject/i), 'Login issue');
        await user.type(screen.getByLabelText(/description/i), 'Cannot sign in');
        await user.click(screen.getByRole('button', { name: /submit ticket/i }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Ticket service unavailable');
    });
});
