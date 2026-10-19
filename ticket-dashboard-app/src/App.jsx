import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from './components/pages/Home';
import ViewTickets from './components/pages/viewTickets';
import AddTicket from './components/main/newTicket/TicketForm';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/view-all-tickets" element={<ViewTickets />} />
                <Route path="/new-ticket" element={<AddTicket />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
