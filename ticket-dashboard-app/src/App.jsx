import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Main from './components/main/Main';
import Home from './components/pages/Home';
import ViewTickets from './components/pages/viewTickets';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/view-all-tickets" element={<ViewTickets />} />
                <Route path="/new-tickets" element={<Main />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
