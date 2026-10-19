
import { getAllTickets } from "../../service/SemanticSearchService"
import { useState, useEffect } from "react";
import TicketProp from "../main/ticketProp/TicketProp";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import "../../App.css";

function ViewTickets() {

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    const hasStatus = (ticket, status) =>
        typeof ticket.status === "string" &&
        ticket.status.trim().toLowerCase() === status;

    const openTickets = tickets.filter(
        (ticket) => hasStatus(ticket, "open")
    );
    
    const resolvedTickets = tickets.filter(
        (ticket) => hasStatus(ticket, "resolved")
    );

    useEffect(() => {
        const getTickets = async () => {
            setLoading(true);
            try {
                const results = await getAllTickets();
                setTickets(results);
            } catch (error) {
                console.error('Error getting tickets:', error);
                setLoadError('Unable to load tickets. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        getTickets();
    }, []);

    return (
        <div className="view-tickets-page">
            <Header />
            <main className="view-tickets-content">
                <header className="view-tickets-heading">
                    <p className="view-tickets-eyebrow">SUPPORT INBOX</p>
                    <h2>All tickets</h2>
                    <p className="view-tickets-description">
                        Browse support requests and the details shared by customers.
                    </p>
                </header>
                {loading ? (
                    <p className="view-tickets-message" role="status">
                        Loading tickets...
                    </p>
                ) : loadError ? (
                    <p className="view-tickets-message" role="alert">
                        {loadError}
                    </p>
                ) : (
                    <>
                        <section className="ticket-status-section" aria-labelledby="open-tickets-title">
                            <header className="ticket-status-section__heading">
                                <div>
                                    <h3 id="open-tickets-title">Open tickets</h3>
                                    <p>Tickets that still need attention</p>
                                </div>
                                <span className="ticket-status-count">{openTickets.length}</span>
                            </header>
                            {openTickets.length > 0 ? (
                                <div className="view-tickets-grid">
                                    {openTickets.map((ticket) => (
                                        <TicketProp key={ticket.ticket_id} ticket={ticket} />
                                    ))}
                                </div>
                            ) : (
                                <p className="view-tickets-message">
                                    No open tickets right now.
                                </p>
                            )}
                        </section>

                        <section className="ticket-status-section" aria-labelledby="resolved-tickets-title">
                            <header className="ticket-status-section__heading">
                                <div>
                                    <h3 id="resolved-tickets-title">Resolved tickets</h3>
                                    <p>Tickets that have been completed</p>
                                </div>
                                <span className="ticket-status-count ticket-status-count--resolved">
                                    {resolvedTickets.length}
                                </span>
                            </header>
                            {resolvedTickets.length > 0 ? (
                                <div className="resolved-ticket-list">
                                    {resolvedTickets.map((ticket) => (
                                        <details className="resolved-ticket" key={ticket.ticket_id}>
                                            <summary className="resolved-ticket__summary">
                                                <span className="resolved-ticket__identity">
                                                    <span className="resolved-ticket__id">
                                                        {ticket.ticket_id || 'Ticket ID unavailable'}
                                                    </span>
                                                    {ticket.category && (
                                                        <span className="resolved-ticket__category">
                                                            {ticket.category}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="resolved-ticket__toggle">
                                                    <span className="resolved-ticket__toggle-label">
                                                        View details
                                                    </span>
                                                    <span
                                                        className="resolved-ticket__chevron"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            </summary>
                                            <div className="resolved-ticket__details">
                                                <TicketProp
                                                    ticket={ticket}
                                                    showTicketId={false}
                                                    expandable={false}
                                                />
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            ) : (
                                <p className="view-tickets-message">
                                    No resolved tickets yet.
                                </p>
                            )}
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );

}

export default ViewTickets;