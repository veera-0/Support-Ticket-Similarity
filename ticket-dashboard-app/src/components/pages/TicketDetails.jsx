import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import TicketProp from '../main/ticketProp/TicketProp';
import { getTicketById, semanticSearch } from '../../service/SemanticSearchService';
import '../../App.css';

function TicketDetails() {
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [similarTickets, setSimilarTickets] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

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

    async function handleFindSimilarTickets() {
        if (!ticket?.subject) {
            setSearchError('This ticket does not have a subject to search with.');
            return;
        }

        setIsSearching(true);
        setSearchError('');
        setHasSearched(false);

        try {
            const searchResult = await semanticSearch({
                subject: ticket.subject,
                description: ticket.description || '',
                topK: 20,
            });
            setSimilarTickets(
                searchResult.results.filter(
                    (result) => result.ticket_id !== ticket.ticket_id
                )
            );
            setHasSearched(true);
        } catch (error) {
            console.error('Error finding similar tickets:', error);
            setSearchError(error.message || 'Unable to find similar tickets. Please try again.');
        } finally {
            setIsSearching(false);
        }
    }

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
                    <>
                        <TicketProp ticket={ticket} expandable={false} showOpenAction={false} />
                        <section className="similar-tickets-section" aria-labelledby="similar-tickets-title">
                            <div className="similar-tickets-intro">
                                <div>
                                    <p className="view-tickets-eyebrow">TICKET HISTORY</p>
                                    <h3 id="similar-tickets-title">Find related tickets</h3>
                                    <p>
                                        Compare this issue with historical tickets to find similar cases
                                        and past resolutions.
                                    </p>
                                </div>
                                <button
                                    className="similar-tickets-button"
                                    type="button"
                                    onClick={handleFindSimilarTickets}
                                    disabled={isSearching}
                                >
                                    {isSearching ? 'Searching history...' : 'Find similar tickets'}
                                </button>
                            </div>

                            {searchError && (
                                <p className="view-tickets-message" role="alert">
                                    {searchError}
                                </p>
                            )}

                            {hasSearched && !searchError && (
                                similarTickets.length > 0 ? (
                                    <div className="similar-tickets-list">
                                        {similarTickets.map((similarTicket) => (
                                            <article
                                                className="similar-ticket-result"
                                                key={similarTicket.ticket_id}
                                            >
                                                <div className="similar-ticket-result__score">
                                                    <span>{Math.round(similarTicket.score * 100)}%</span>
                                                    <small>similar</small>
                                                </div>
                                                <div className="similar-ticket-result__content">
                                                    <p className="similar-ticket-result__id">
                                                        {similarTicket.ticket_id}
                                                    </p>
                                                    <h4>{similarTicket.subject}</h4>
                                                    {similarTicket.resolution_notes && (
                                                        <p className="similar-ticket-result__resolution">
                                                            <strong>Past resolution:</strong>{' '}
                                                            {similarTicket.resolution_notes}
                                                        </p>
                                                    )}
                                                </div>
                                                {similarTicket.status && (
                                                    <span className="similar-ticket-result__status">
                                                        {similarTicket.status}
                                                    </span>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="view-tickets-message" role="status">
                                        No similar historical tickets were found.
                                    </p>
                                )
                            )}
                        </section>
                    </>
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
