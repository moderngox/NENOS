import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { BookDraftProvider } from './context/BookDraftContext';
import { AuthProvider } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { CreateWizard } from './pages/create/CreateWizard';
import { Revelation } from './pages/Revelation';
import { Payment } from './pages/Payment';
import { OrderConfirmed } from './pages/OrderConfirmed';
import { Library } from './pages/Library';
import { BookReader } from './pages/BookReader';
import { Login } from './pages/Login';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BookDraftProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/creer" element={<Navigate to="/creer/1" replace />} />
              <Route path="/creer/:step" element={<CreateWizard />} />
              <Route path="/revelation" element={<Revelation />} />
              <Route path="/paiement" element={<Payment />} />
              <Route path="/commande-confirmee" element={<OrderConfirmed />} />
              <Route path="/mes-livres" element={<Library />} />
              <Route path="/livre/:bookId" element={<BookReader />} />
              <Route path="/connexion" element={<Login />} />
            </Routes>
          </BrowserRouter>
        </BookDraftProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
