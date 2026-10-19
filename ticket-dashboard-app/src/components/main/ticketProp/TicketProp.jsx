import Chip from '@mui/material/Chip';
import { Link } from 'react-router-dom';
import './TicketProp.css';

function hasValue(value) {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    return true;
}

function formatStatus(status) {
    if (!hasValue(status)) {
        return '';
    }

    return String(status)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function TicketProp({
    ticket,
    showTicketId = true,
    expandable = true,
    showOpenAction = true,
}) {
    if (!ticket) {
        return null;
    }

    const tags = Array.isArray(ticket.tags)
        ? ticket.tags.filter(hasValue)
        : [];
    const detailFields = [
        ['description', 'Description'],
        ['resolution_notes', 'Resolution notes'],
    ].filter(([field]) => hasValue(ticket[field]));
    const hasDetails = detailFields.length > 0 || tags.length > 0;
    const status = formatStatus(ticket.status);
    const statusClass = String(ticket.status || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-');

    if (
        !hasValue(ticket.subject) &&
        !hasValue(ticket.ticket_id) &&
        !hasValue(ticket.category) &&
        !hasValue(ticket.created_at) &&
        !status &&
        !hasDetails
    ) {
        return null;
    }

    return (
        <article className="ticket-prop">
            <header className="ticket-prop__header">
                <div className="ticket-prop__title-group">
                    <h3 className="ticket-prop__subject">
                        {hasValue(ticket.subject) ? ticket.subject : 'Support request'}
                    </h3>
                    {showTicketId && hasValue(ticket.ticket_id) && (
                        <span className="ticket-prop__id">{ticket.ticket_id}</span>
                    )}
                </div>
                {status && (
                    <span className={`ticket-prop__status ticket-prop__status--${statusClass}`}>
                        <span className="ticket-prop__status-dot" aria-hidden="true" />
                        {status}
                    </span>
                )}
            </header>

            {(hasValue(ticket.category) || hasValue(ticket.created_at)) && (
                <div className="ticket-prop__meta">
                    {hasValue(ticket.category) && (
                        <span className="ticket-prop__category">{ticket.category}</span>
                    )}
                    {hasValue(ticket.created_at) && (
                        <time className="ticket-prop__date">{ticket.created_at}</time>
                    )}
                </div>
            )}

            {hasDetails && expandable && (
                <details className="ticket-prop__disclosure">
                    <summary aria-label="Show or hide ticket details">
                        <span className="ticket-prop__disclosure-label" aria-hidden="true" />
                        <span className="ticket-prop__chevron" aria-hidden="true" />
                    </summary>
                    <TicketDetails fields={detailFields} ticket={ticket} tags={tags} />
                </details>
            )}

            {hasDetails && !expandable && (
                <TicketDetails fields={detailFields} ticket={ticket} tags={tags} />
            )}

            {showOpenAction &&
                String(ticket.status || '').trim().toLowerCase() === 'open' &&
                hasValue(ticket.ticket_id) && (
                    <Link
                        className="ticket-prop__open-link"
                        to={`/view/tickets/${encodeURIComponent(ticket.ticket_id)}`}
                    >
                        View ticket <span aria-hidden="true">→</span>
                    </Link>
                )}
        </article>
    );
}

function TicketDetails({ fields, ticket, tags }) {
    return (
        <div className="ticket-prop__details">
            {fields.map(([field, label]) => (
                <div className="ticket-prop__field" key={field}>
                    <span className="ticket-prop__label">{label}</span>
                    <p className={`ticket-prop__value ticket-prop__value--${field}`}>
                        {ticket[field]}
                    </p>
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
        </div>
    );
}