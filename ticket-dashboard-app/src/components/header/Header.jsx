import { NavLink } from 'react-router-dom';
import './header.css';

function Header() {
    return (
        <header className="site-header">
            <nav className="site-nav" aria-label="Main navigation">
                <h1 className="site-nav__title">Ticket Dashboard</h1>
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
                        to="/tickets"
                        className={({ isActive }) =>
                            isActive ? 'site-nav__link active' : 'site-nav__link'
                        }
                    >
                        All Tickets
                    </NavLink>
                    <NavLink
                        to="/new-tickets"
                        className={({ isActive }) =>
                            isActive ? 'site-nav__link active' : 'site-nav__link'
                        }
                    >
                        New Tickets
                    </NavLink>
                </div>
            </nav>
        </header>
    );
}

export default Header;