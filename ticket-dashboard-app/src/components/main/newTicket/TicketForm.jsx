import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createTicket } from '../../../service/SemanticSearchService';
import Footer from '../../footer/Footer';
import Header from '../../header/Header';
import './addTicket.css';

const initialForm = {
    subject: '',
    description: '',
    category: '',
    tags: '',
};

function TicketForm() {
    const [form, setForm] = useState(initialForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [createdTicket, setCreatedTicket] = useState(null);

    function handleChange(event) {
        const { name, value } = event.target;
        setForm((currentForm) => ({ ...currentForm, [name]: value }));
        setErrorMessage('');
        setCreatedTicket(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage('');
        setCreatedTicket(null);

        if (!form.subject.trim() || !form.description.trim()) {
            setErrorMessage('Please enter a subject and describe the issue before submitting.');
            return;
        }

        setIsSubmitting(true);
        const ticketData = {
            subject: form.subject.trim(),
            description: form.description.trim(),
            category: form.category.trim() || null,
            tags: form.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
        };

        try {
            const ticket = await createTicket(ticketData);
            setCreatedTicket(ticket);
            setForm(initialForm);
        } catch (error) {
            setErrorMessage(error.message || 'Could not create the ticket. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="add-ticket-page">
            <Header />
            <main className="add-ticket-content">
                <header className="add-ticket-heading">
                    <p className="add-ticket-eyebrow">SUPPORT INBOX</p>
                    <h2>Create a support ticket</h2>
                    <p>
                        Share the issue details and we’ll add your request to the support inbox.
                    </p>
                </header>

                {createdTicket && (
                    <section className="add-ticket-feedback add-ticket-feedback--success" role="status">
                        <span className="add-ticket-feedback__icon" aria-hidden="true">✓</span>
                        <div>
                            <h3>Ticket created successfully</h3>
                            <p>
                                Your ticket ID is <strong>{createdTicket.ticket_id}</strong>.
                                It has been added to the open tickets.
                            </p>
                            <Link to="/view-all-tickets">View all tickets</Link>
                        </div>
                    </section>
                )}

                {errorMessage && (
                    <p className="add-ticket-feedback add-ticket-feedback--error" role="alert">
                        {errorMessage}
                    </p>
                )}

                <form className="add-ticket-form" onSubmit={handleSubmit}>
                    <div className="add-ticket-form__intro">
                        <span className="add-ticket-form__step">NEW REQUEST</span>
                        <p>Fields marked with <span aria-hidden="true">*</span> are required.</p>
                    </div>

                    <div className="add-ticket-field">
                        <label htmlFor="ticket-subject">Subject <span>*</span></label>
                        <input
                            id="ticket-subject"
                            name="subject"
                            type="text"
                            value={form.subject}
                            onChange={handleChange}
                            placeholder="Briefly summarize the issue"
                            maxLength={160}
                            required
                        />
                        <small>A short, clear title makes the issue easier to recognize.</small>
                    </div>

                    <div className="add-ticket-field">
                        <label htmlFor="ticket-description">Description <span>*</span></label>
                        <textarea
                            id="ticket-description"
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Describe what happened and what you were trying to do..."
                            rows={6}
                            maxLength={5000}
                            required
                        />
                        <small>Include any details that could help the support team understand the issue.</small>
                    </div>

                    <div className="add-ticket-form__row">
                        <div className="add-ticket-field">
                            <label htmlFor="ticket-category">Category</label>
                            <select
                                id="ticket-category"
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                            >
                                <option value="">Choose a category (optional)</option>
                                <option value="Account access">Account access</option>
                                <option value="Billing">Billing</option>
                                <option value="Technical">Technical</option>
                                <option value="Product question">Product question</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="add-ticket-field">
                            <label htmlFor="ticket-tags">Tags</label>
                            <input
                                id="ticket-tags"
                                name="tags"
                                type="text"
                                value={form.tags}
                                onChange={handleChange}
                                placeholder="login, mobile, urgent"
                            />
                            <small>Optional; separate tags with commas.</small>
                        </div>
                    </div>

                    <div className="add-ticket-form__footer">
                        <p className="add-ticket-status-note">
                            New tickets are added with an Open status.
                        </p>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <span className="add-ticket-spinner" aria-hidden="true" />
                                    Creating ticket...
                                </>
                            ) : (
                                'Submit ticket'
                            )}
                        </button>
                    </div>
                </form>
            </main>
            <Footer />
        </div>
    );
}

export default TicketForm;
