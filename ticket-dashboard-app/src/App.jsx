import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Main from './components/main/Main';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/home" element={<Main />} />
                <Route path="/tickets" element={<Main />} />
                <Route path="/new-tickets" element={<Main />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
