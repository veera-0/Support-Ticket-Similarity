import { Link, useLocation } from 'react-router-dom';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import './main.css';

const tickets = [
    {
        id: 'TK-1048',
        subject: 'Unable to reset my password',
        category: 'Account access',
        created: '10 min ago',
        status: 'New',
    },
    {
        id: 'TK-1047',
        subject: 'Invoice for my latest order',
        category: 'Billing',
        created: '32 min ago',
        status: 'In progress',
    },
    {
        id: 'TK-1046',
        subject: 'App closes when uploading a file',
        category: 'Technical',
        created: '1 hour ago',
        status: 'New',
    },
    {
        id: 'TK-1045',
        subject: 'Change the email on my account',
        category: 'Account access',
        created: '2 hours ago',
        status: 'Resolved',
    },
];

const pageTitles = {
    '/tickets': {
        title: 'All tickets',
        description: 'Review and track every support request in one place.',
    },
    '/new-tickets': {
        title: 'New tickets',
        description: 'Start with the latest requests waiting for a response.',
    },
};

function TicketTable({ rows }) {
    return (
        <div className="ticket-table-wrap">
            <table className="ticket-table">
                <thead>
                    <tr>
                        <th scope="col">Ticket</th>
                        <th scope="col">Category</th>
                        <th scope="col">Created</th>
                        <th scope="col">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((ticket) => (
                        <tr key={ticket.id}>
                            <td>
                                <span className="ticket-id">{ticket.id}</span>
                                <span className="ticket-subject">{ticket.subject}</span>
                            </td>
                            <td>{ticket.category}</td>
                            <td>{ticket.created}</td>
                            <td>
                                <span
                                    className={`ticket-status ticket-status--${ticket.status
                                        .toLowerCase()
                                        .replace(' ', '-')}`}
                                >
                                    <span className="ticket-status__dot" />
                                    {ticket.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function Main() {
    const { pathname } = useLocation();
    const page = pageTitles[pathname];
    const displayedTickets = pathname === '/new-tickets'
        ? tickets.filter((ticket) => ticket.status === 'New')
        : tickets;

    return (
        <div className="dashboard">
            <Header />
            <main className="dashboard-main">
                <section className="dashboard-welcome">
                    <div>
                        <p className="eyebrow">SUPPORT OVERVIEW</p>
                        <h2>{page?.title ?? 'Good morning'}</h2>
                        <p className="dashboard-subtitle">
                            {page?.description ?? 'Here’s what’s happening with your support inbox today.'}
                        </p>
                    </div>
                    <Link className="primary-action" to="/new-tickets">
                        <span aria-hidden="true">＋</span>
                        New ticket
                    </Link>
                </section>

                {!page && (
                    <section className="stats-grid" aria-label="Ticket overview">
                        <article className="stat-card stat-card--blue">
                            <div className="stat-card__top">
                                <span className="stat-card__icon" aria-hidden="true">▤</span>
                                <span className="stat-card__label">Total tickets</span>
                            </div>
                            <p className="stat-card__value">248</p>
                            <p className="stat-card__note">Across all requests</p>
                        </article>
                        <article className="stat-card stat-card--amber">
                            <div className="stat-card__top">
                                <span className="stat-card__icon" aria-hidden="true">◷</span>
                                <span className="stat-card__label">New tickets</span>
                            </div>
                            <p className="stat-card__value">12</p>
                            <p className="stat-card__note">Need your attention</p>
                        </article>
                        <article className="stat-card stat-card--green">
                            <div className="stat-card__top">
                                <span className="stat-card__icon" aria-hidden="true">✓</span>
                                <span className="stat-card__label">Resolved today</span>
                            </div>
                            <p className="stat-card__value">18</p>
                            <p className="stat-card__note">Great work, team</p>
                        </article>
                    </section>
                )}

                <section className="ticket-panel" aria-labelledby="ticket-list-title">
                    <div className="ticket-panel__header">
                        <div>
                            <h3 id="ticket-list-title">{page ? page.title : 'Recent tickets'}</h3>
                            <p>
                                {pathname === '/new-tickets'
                                    ? 'Requests that have not been picked up yet'
                                    : 'Keep an eye on the latest customer requests'}
                            </p>
                        </div>
                        {pathname !== '/tickets' && (
                            <Link className="text-action" to="/tickets">
                                View all tickets <span aria-hidden="true">→</span>
                            </Link>
                        )}
                    </div>
                    <TicketTable rows={displayedTickets} />
                </section>

                {!page && (
                    <section className="inbox-tip" aria-label="Support tip">
                        <span className="inbox-tip__icon" aria-hidden="true">✦</span>
                        <div>
                            <h3>Keep your inbox moving</h3>
                            <p>Pick up a new ticket to help customers get a timely answer.</p>
                        </div>
                        <Link to="/new-tickets" className="text-action">
                            See new tickets <span aria-hidden="true">→</span>
                        </Link>
                    </section>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default Main;
