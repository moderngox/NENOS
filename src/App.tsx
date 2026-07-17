import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { BookDraftProvider } from './context/BookDraftContext';
import { AuthProvider } from './context/AuthContext';
import { Landing } from './pages/Landing';
import { HowItWorks } from './pages/HowItWorks';
import { CreateWizard } from './pages/create/CreateWizard';
import { CreateAvatarWizard } from './pages/create/CreateAvatarWizard';
import { AvatarReady } from './pages/AvatarReady';
import { Revelation } from './pages/Revelation';
import { Payment } from './pages/Payment';
import { OrderConfirmed } from './pages/OrderConfirmed';
import { Account } from './pages/Account';
import { OrderDetail } from './pages/OrderDetail';
import { BookReader } from './pages/BookReader';
import { Login } from './pages/Login';
import { Examples } from './pages/Examples';
import { ExampleReader } from './pages/ExampleReader';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BookDraftProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/comment-ca-marche" element={<HowItWorks />} />
              <Route path="/creer" element={<Navigate to="/creer/1" replace />} />
              <Route path="/creer/:step" element={<CreateWizard />} />
              <Route path="/creer-avatar" element={<Navigate to="/creer-avatar/1" replace />} />
              <Route path="/creer-avatar/:step" element={<CreateAvatarWizard />} />
              <Route path="/avatar-pret/:bookId" element={<AvatarReady />} />
              <Route path="/revelation" element={<Revelation />} />
              <Route path="/paiement" element={<Payment />} />
              <Route path="/commande-confirmee" element={<OrderConfirmed />} />
              <Route path="/mes-livres" element={<Navigate to="/mon-compte?tab=books" replace />} />
              <Route path="/mon-compte" element={<Account />} />
              <Route path="/mon-compte/commandes/:bookId" element={<OrderDetail />} />
              <Route path="/livre/:bookId" element={<BookReader />} />
              <Route path="/connexion" element={<Login />} />
              <Route path="/exemples" element={<Examples />} />
              <Route path="/exemples/:slug" element={<ExampleReader />} />
            </Routes>
          </BrowserRouter>
        </BookDraftProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
