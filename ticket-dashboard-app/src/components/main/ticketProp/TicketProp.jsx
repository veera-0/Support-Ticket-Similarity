import Chip from '@mui/material/Chip';
import './TicketProp.css';

const ticketFields = [
    ['ticket_id', 'Ticket ID'],
    ['category', 'Category'],
    ['subject', 'Subject'],
    ['description', 'Description'],
    ['resolution_notes', 'Resolution notes'],
    ['created_at', 'Created'],
    ['status', 'Status'],
];

function hasValue(value) {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return true;
}

export default function TicketProp({ ticket }) {
    if (!ticket) {
        return null;
    }

    const visibleFields = ticketFields.filter(([field]) => hasValue(ticket[field]));
    const tags = Array.isArray(ticket.tags)
        ? ticket.tags.filter((tag) => hasValue(tag))
        : [];

    if (visibleFields.length === 0 && tags.length === 0) {
        return null;
    }

    return (
        <article className="ticket-prop">
            {visibleFields.map(([field, label]) => (
                <div className="ticket-prop__field" key={field}>
                    <span className="ticket-prop__label">{label}</span>
                    <span className={`ticket-prop__value ticket-prop__value--${field}`}>
                        {ticket[field]}
                    </span>
                </div>
            ))}

            {tags.length > 0 && (
                <div className="ticket-prop__field">
                    <span className="ticket-prop__label">Tags</span>
                    <div className="ticket-prop__tags">
                        {tags.map((tag, index) => (
                            <Chip
                                key={`${tag}-${index}`}
                                label={tag}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
}
