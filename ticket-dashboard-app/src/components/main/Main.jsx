import Footer from '../footer/Footer';
import Header from '../header/Header';
import './main.css';

function Main() {
    return (
        <div className="landing-page">
            <Header />
            <main className="landing-main">
                <section className="intro-hero">
                    <div className="intro-copy">
                        <p className="intro-eyebrow">
                            <span className="intro-eyebrow__dot" />
                            SMARTER SUPPORT STARTS HERE
                        </p>
                        <h2>
                            Every ticket has
                            <br />
                            <span>a story we’ve seen before.</span>
                        </h2>
                        <p className="intro-description">
                            Find support tickets with similar meaning, not just matching words.
                            Use past resolutions to understand new issues and help customers
                            get answers sooner.
                        </p>
                    </div>

                    <div className="similarity-visual" aria-label="Example of matching a new support request with similar past tickets">
                        <div className="similarity-visual__heading">
                            <span className="similarity-visual__spark" aria-hidden="true">✦</span>
                            <div>
                                <p className="similarity-visual__label">SEMANTIC TICKET MATCHING</p>
                                <p className="similarity-visual__title">Understand the issue</p>
                            </div>
                        </div>

                        <div className="issue-card">
                            <span className="issue-card__tag">NEW SUPPORT REQUEST</span>
                            <p>“I can’t get into my account after changing my phone.”</p>
                        </div>

                        <div className="match-divider">
                            <span />
                            <span className="match-divider__label">SIMILAR PAST ISSUES</span>
                            <span />
                        </div>

                        <div className="match-card">
                            <span className="match-card__icon" aria-hidden="true">↗</span>
                            <p>Two-factor login unavailable after device change</p>
                            <span className="match-card__score">96% match</span>
                        </div>
                        <div className="match-card match-card--secondary">
                            <span className="match-card__icon" aria-hidden="true">↗</span>
                            <p>Help restoring access to a locked account</p>
                            <span className="match-card__score">89% match</span>
                        </div>
                    </div>
                </section>

                <section className="intro-benefits" aria-label="How ticket similarity helps">
                    <article className="benefit">
                        <span className="benefit__number">01</span>
                        <div>
                            <h3>Search by meaning</h3>
                            <p>Connect tickets that describe the same problem in different words.</p>
                        </div>
                    </article>
                    <article className="benefit">
                        <span className="benefit__number">02</span>
                        <div>
                            <h3>Learn from past resolutions</h3>
                            <p>Bring relevant history closer to the people helping customers.</p>
                        </div>
                    </article>
                    <article className="benefit">
                        <span className="benefit__number">03</span>
                        <div>
                            <h3>Respond with confidence</h3>
                            <p>Spend less time starting from scratch on familiar issues.</p>
                        </div>
                    </article>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Main;
