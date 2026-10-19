import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout.jsx";
import { HomePage } from "../pages/HomePage.jsx";
import { NotesPage } from "../pages/NotesPage.jsx";
import { ArticlePage } from "../pages/ArticlePage.jsx";
import { AgendaPage } from "../pages/AgendaPage.jsx";
import { EventPage } from "../pages/EventPage.jsx";
import { CommunityPage, PublishPage } from "../pages/PublicPages.jsx";
import { AdminPage, NewContentPage, ContentPage, PressPage } from "../pages/AdminPages.jsx";
import { PolicyPage, CreditsPage } from "../pages/PolicyPage.jsx";
import { DirectoryPage, AdminDirectoryPage } from "../pages/DirectoryPage.jsx";
import { ReplacementsPage, AdminReplacementsPage } from "../pages/ReplacementsPage.jsx";
import { CollaboratorPage } from "../pages/CollaboratorPage.jsx";
import { AuthGate } from "../components/AuthGate.jsx";
import { MonetizationPage, AdminMonetizationPage } from "../pages/MonetizationPage.jsx";

function NotFoundPage() {
  return (
    <Layout>
      <section className="page-intro">
        <p className="eyebrow">Señal perdida</p>
        <h1>Página no encontrada.</h1>
        <p className="muted">La dirección que buscás no existe o ya no está disponible.</p>
        <Link className="button dark" to="/">
          Volver al inicio
        </Link>
      </section>
    </Layout>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/notas" element={<NotesPage />} />
      <Route path="/notas/:slug" element={<ArticlePage />} />
      <Route path="/agenda" element={<AgendaPage />} />
      <Route path="/agenda/evento/:id" element={<EventPage />} />
      <Route path="/directorio" element={<DirectoryPage />} />
      <Route path="/comunidad" element={<CommunityPage />} />
      <Route path="/publicar" element={<PublishPage />} />
      <Route path="/reemplazos" element={<ReplacementsPage />} />
      <Route path="/politica-editorial" element={<PolicyPage />} />
      <Route path="/codigo-de-creditos" element={<CreditsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/colaborador" element={<CollaboratorPage />} />
      <Route path="/monetizar" element={<MonetizationPage />} />
      <Route
        path="/admin/monetizacion"
        element={
          <AuthGate allowedRoles={["admin", "editor"]}>
            <AdminMonetizationPage />
          </AuthGate>
        }
      />
      <Route path="/admin/nueva" element={<NewContentPage />} />
      <Route path="/admin/contenido/:id" element={<ContentPage />} />
      <Route path="/admin/prensa" element={<PressPage />} />
      <Route path="/admin/reemplazos" element={<AdminReplacementsPage />} />
      <Route path="/admin/directorio" element={<AdminDirectoryPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
