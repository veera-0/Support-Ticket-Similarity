import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../footer/Footer';
import Header from '../header/Header';
import TicketProp from '../main/ticketProp/TicketProp';
import {
    getTicketById,
    semanticSearch,
    updateTicket,
} from '../../service/SemanticSearchService';
import '../../App.css';

function hasStatus(ticket, expectedStatus) {
    return typeof ticket?.status === 'string' &&
        ticket.status.trim().toLowerCase() === expectedStatus;
}

function TicketDetails() {
    const { ticketId } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [similarTickets, setSimilarTickets] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [updatingFromTicketId, setUpdatingFromTicketId] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [updateSuccess, setUpdateSuccess] = useState('');
    const [isManualResolutionOpen, setIsManualResolutionOpen] = useState(false);
    const [manualResolution, setManualResolution] = useState('');
    const [isSavingManualResolution, setIsSavingManualResolution] = useState(false);

    const needsManualResolution =
        hasSearched &&
        (similarTickets.length === 0 ||
            similarTickets.every((similarTicket) => similarTicket.score < 0.75));

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
                topK: 5,
            });
            setSimilarTickets(
                searchResult.results.filter(
                    (result) =>
                        result.ticket_id !== ticket.ticket_id &&
                        hasStatus(result, 'resolved')
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

    async function handleApplyResolution(similarTicket) {
        if (!ticket?.ticket_id || !similarTicket.resolution_notes) {
            setUpdateError('This ticket or historical resolution is missing required information.');
            return;
        }

        setUpdatingFromTicketId(similarTicket.ticket_id);
        setUpdateError('');
        setUpdateSuccess('');

        try {
            const updatedTicket = await updateTicket(ticket.ticket_id, {
                status: 'resolved',
                resolution_notes: similarTicket.resolution_notes,
            });
            setTicket((currentTicket) => ({ ...currentTicket, ...updatedTicket }));
            setUpdateSuccess(
                `Ticket ${ticket.ticket_id} was resolved using the resolution from ${similarTicket.ticket_id}.`
            );
        } catch (error) {
            console.error('Error resolving ticket from historical resolution:', error);
            setUpdateError(error.message || 'Unable to update this ticket. Please try again.');
        } finally {
            setUpdatingFromTicketId('');
        }
    }

    async function handleSaveManualResolution(event) {
        event.preventDefault();
        const resolutionNotes = manualResolution.trim();

        if (!ticket?.ticket_id || !resolutionNotes) {
            setUpdateError('Enter a resolution before saving.');
            return;
        }

        setIsSavingManualResolution(true);
        setUpdateError('');
        setUpdateSuccess('');

        try {
            const updatedTicket = await updateTicket(ticket.ticket_id, {
                status: 'resolved',
                resolution_notes: resolutionNotes,
            });
            setTicket((currentTicket) => ({ ...currentTicket, ...updatedTicket }));
            setManualResolution(resolutionNotes);
            setIsManualResolutionOpen(false);
            setUpdateSuccess(`Ticket ${ticket.ticket_id} was resolved with your resolution notes.`);
        } catch (error) {
            console.error('Error saving manual ticket resolution:', error);
            setUpdateError(error.message || 'Unable to save the resolution. Please try again.');
        } finally {
            setIsSavingManualResolution(false);
        }
    }

    useEffect(() => {
            document.title = 'View Ticket Details';
        }, []);

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
                                    disabled={
                                        isSearching ||
                                        Boolean(updatingFromTicketId) ||
                                        isSavingManualResolution
                                    }
                                >
                                    {isSearching ? 'Searching history...' : 'Find similar tickets'}
                                </button>
                            </div>

                            {searchError && (
                                <p className="view-tickets-message" role="alert">
                                    {searchError}
                                </p>
                            )}

                            {updateError && (
                                <p className="view-tickets-message" role="alert">
                                    {updateError}
                                </p>
                            )}

                            {updateSuccess && (
                                <p className="ticket-update-success" role="status">
                                    {updateSuccess}
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
                                                <div className="similar-ticket-result__actions">
                                                    {similarTicket.status && (
                                                        <span className="similar-ticket-result__status">
                                                            {similarTicket.status}
                                                        </span>
                                                    )}
                                                    {hasStatus(ticket, 'open') &&
                                                        hasStatus(similarTicket, 'resolved') &&
                                                        similarTicket.score > 0.75 &&
                                                        similarTicket.resolution_notes && (
                                                            <button
                                                                className="similar-ticket-result__apply"
                                                                type="button"
                                                                onClick={() => handleApplyResolution(similarTicket)}
                                                                disabled={
                                                                    Boolean(updatingFromTicketId) ||
                                                                    isSavingManualResolution
                                                                }
                                                            >
                                                                {updatingFromTicketId === similarTicket.ticket_id
                                                                    ? 'Resolving...'
                                                                    : 'Use resolution & resolve'}
                                                            </button>
                                                        )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="view-tickets-message" role="status">
                                        No similar historical tickets were found.
                                    </p>
                                )
                            )}

                            {needsManualResolution && hasStatus(ticket, 'open') && (
                                <section className="manual-resolution" aria-labelledby="manual-resolution-title">
                                    <div className="manual-resolution__intro">
                                        <div>
                                            <h3 id="manual-resolution-title">
                                                No strong historical match
                                            </h3>
                                            <p>
                                                All resolved matches scored below 75%. Add the resolution
                                                yourself to close this ticket.
                                            </p>
                                        </div>
                                        {!isManualResolutionOpen && (
                                            <button
                                                className="manual-resolution__toggle"
                                                type="button"
                                                onClick={() => {
                                                    setIsManualResolutionOpen(true);
                                                    setUpdateError('');
                                                }}
                                            >
                                                Add resolution manually
                                            </button>
                                        )}
                                    </div>

                                    {isManualResolutionOpen && (
                                        <form
                                            className="manual-resolution__form"
                                            onSubmit={handleSaveManualResolution}
                                        >
                                            <label htmlFor="manual-resolution-notes">
                                                Resolution notes <span aria-hidden="true">*</span>
                                            </label>
                                            <textarea
                                                id="manual-resolution-notes"
                                                value={manualResolution}
                                                onChange={(event) => setManualResolution(event.target.value)}
                                                placeholder="Describe how the issue was resolved..."
                                                rows={5}
                                                required
                                            />
                                            <div className="manual-resolution__actions">
                                                <button
                                                    className="manual-resolution__cancel"
                                                    type="button"
                                                    onClick={() => {
                                                        setIsManualResolutionOpen(false);
                                                        setUpdateError('');
                                                    }}
                                                    disabled={isSavingManualResolution}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    className="manual-resolution__save"
                                                    type="submit"
                                                    disabled={isSavingManualResolution || !manualResolution.trim()}
                                                >
                                                    {isSavingManualResolution
                                                        ? 'Saving resolution...'
                                                        : 'Save resolution & resolve'}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </section>
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
