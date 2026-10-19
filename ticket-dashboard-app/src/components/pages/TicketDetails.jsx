import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import TicketProp from '../main/ticketProp/TicketProp';
import { getTicketById } from '../../service/SemanticSearchService';
import '../../App.css';

function TicketDetails() {
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isCurrent = true;

        async function loadTicket() {
            setLoading(true);
            setErrorMessage('');

            try {
                const result = await getTicketById(ticketId);
                if (isCurrent) {
                    setTicket(result);
                }
            } catch (error) {
                console.error('Error getting ticket:', error);
                if (isCurrent) {
                    setErrorMessage(error.message || 'Unable to load this ticket.');
                }
            } finally {
                if (isCurrent) {
                    setLoading(false);
                }
            }
        }

        loadTicket();

        return () => {
            isCurrent = false;
        };
    }, [ticketId]);

    return (
        <div className="view-tickets-page">
            <Header />
            <main className="view-tickets-content ticket-detail-page">
                <Link className="ticket-detail-back" to="/view-all-tickets">
                    <span aria-hidden="true">←</span> Back to all tickets
                </Link>
                <header className="view-tickets-heading">
                    <p className="view-tickets-eyebrow">SUPPORT INBOX</p>
                    <h2>Ticket details</h2>
                    <p className="view-tickets-description">
                        Review the request and its current status.
                    </p>
                </header>
                {loading ? (
                    <p className="view-tickets-message" role="status">Loading ticket...</p>
                ) : errorMessage ? (
                    <p className="view-tickets-message" role="alert">{errorMessage}</p>
                ) : ticket ? (
                    <TicketProp ticket={ticket} expandable={false} showOpenAction={false} />
                ) : (
                    <p className="view-tickets-message" role="status">
                        Ticket not found.
                    </p>
                )}
            </main>
            <Footer />
        </div>
    );
}

export default TicketDetails;
