import { NavLink } from 'react-router-dom';
import './header.css';

function Header() {
    return (
        <header className="site-header">
            <nav className="site-nav" aria-label="Main navigation">
                <h1 className="site-nav__title">Smart Ticket Dashboard</h1>
                <div className="site-nav__links">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            isActive ? 'site-nav__link active' : 'site-nav__link'
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/view-all-tickets"
                        className={({ isActive }) =>
                            isActive ? 'site-nav__link active' : 'site-nav__link'
                        }
                    >
                        Tickets
                    </NavLink>
                    <NavLink
                        to="/new-ticket"
                        className={({ isActive }) =>
                            isActive ? 'site-nav__link active' : 'site-nav__link'
                        }
                    >
                        Create Ticket
                    </NavLink>
                </div>
            </nav>
        </header>
    );
}

export default Header;