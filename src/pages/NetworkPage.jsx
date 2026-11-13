import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout } from "../components/Layout.jsx";
import { ErrorMessage } from "../components/Layout.jsx";
import { EmptyState, LoadingState } from "../components/UiState.jsx";
import { SignalTicker } from "../components/EditorialPrimitives.jsx";
import { Button, ButtonLink } from "../components/ui/Button.jsx";
import { Dialog } from "../components/ui/Dialog.jsx";
import { IconButton } from "../components/ui/IconButton.jsx";
import { ItemList } from "../components/ui/ItemList.jsx";
import { Notice } from "../components/ui/Notice.jsx";
import { networkPageEs as text } from "../i18n/es-AR.dictionary.js";
import { clearStableIdempotencyKey, getStableIdempotencyKey } from "../utils/idempotency.js";

const emptyPhotographer = {
  name: "",
  city: "",
  specialties: "",
  portfolioUrl: "",
  portfolioUrls: "",
  instagram: "",
  bio: "",
  sampleCount: "",
  availability: "",
  contactEmail: "",
};

const emptyCoverage = {
  title: "",
  description: "",
  requesterName: "",
  requesterEmail: "",
  organization: "",
  city: "",
  budget: "",
  deadlineAt: "",
};

function FormNotice({ message, error }) {
  return error ? <Notice tone="error">{error}</Notice> : message ? <Notice tone="success">{message}</Notice> : null;
}

export function NetworkPage() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get("eventId") || "";
  const [photographers, setPhotographers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photographerForm, setPhotographerForm] = useState(emptyPhotographer);
  const [coverageForm, setCoverageForm] = useState(emptyCoverage);
  const [photographerNotice, setPhotographerNotice] = useState("");
  const [coverageNotice, setCoverageNotice] = useState("");
  const [photographerError, setPhotographerError] = useState("");
  const [coverageError, setCoverageError] = useState("");
  const [networkMode, setNetworkMode] = useState("browse");
  const [applicationFor, setApplicationFor] = useState(null);
  const [application, setApplication] = useState({
    photographerId: "",
    applicantName: "",
    applicantEmail: "",
    portfolioUrl: "",
    message: "",
  });

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      api("/api/public/photographers?limit=60"),
      api(`/api/public/coverage-requests?limit=60${eventId ? `&eventId=${eventId}` : ""}`),
    ])
      .then(([nextPhotographers, nextRequests]) => {
        setPhotographers(nextPhotographers);
        setRequests(nextRequests);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const submitPhotographer = async (event) => {
    event.preventDefault();
    setPhotographerError("");
    setPhotographerNotice("");
    try {
      const payload = {
        ...photographerForm,
        specialties: photographerForm.specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        portfolioUrls: photographerForm.portfolioUrls
          .split(/\r?\n|,/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 10),
        sampleCount: Number(photographerForm.sampleCount || 0),
      };
      const scope = "photographer-profile";
      const idempotencyKey = await getStableIdempotencyKey(scope, payload);
      const result = await api("/api/public/photographers", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      setPhotographerNotice(result.message);
      setPhotographerForm(emptyPhotographer);
      clearStableIdempotencyKey(scope);
    } catch (requestError) {
      setPhotographerError(requestError.message);
    }
  };

  const submitCoverage = async (event) => {
    event.preventDefault();
    setCoverageError("");
    setCoverageNotice("");
    try {
      const payload = {
        ...coverageForm,
        eventId: eventId || null,
        deadlineAt: coverageForm.deadlineAt ? new Date(coverageForm.deadlineAt).toISOString() : null,
      };
      const scope = "coverage-request";
      const idempotencyKey = await getStableIdempotencyKey(scope, payload);
      const result = await api("/api/public/coverage-requests", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(payload),
      });
      setCoverageNotice(result.message);
      setCoverageForm(emptyCoverage);
      clearStableIdempotencyKey(scope);
      load();
    } catch (requestError) {
      setCoverageError(requestError.message);
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setCoverageError("");
    try {
      const scope = `coverage-application-${applicationFor.id}`;
      const idempotencyKey = await getStableIdempotencyKey(scope, application);
      const result = await api(`/api/public/coverage-requests/${applicationFor.id}/applications`, {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify(application),
      });
      setCoverageNotice(result.message);
      setApplicationFor(null);
      setApplication({ photographerId: "", applicantName: "", applicantEmail: "", portfolioUrl: "", message: "" });
      clearStableIdempotencyKey(scope);
    } catch (requestError) {
      setCoverageError(requestError.message);
    }
  };

  return (
    <Layout>
      <SignalTicker items={text.tickerItems} />
      <section className="page-intro network-intro">
        <p className="eyebrow">{text.introEyebrow}</p>
        <h1>{text.introTitle}</h1>
        <p>{text.introDescription}</p>
      </section>

      <nav className="network-mode-switcher" aria-label={text.actionNavigationLabel}>
        <p className="eyebrow">{text.choosePath}</p>
        <div role="tablist" aria-label={text.actionListLabel}>
          <button
            aria-selected={networkMode === "browse"}
            className={networkMode === "browse" ? "is-active" : ""}
            onClick={() => setNetworkMode("browse")}
            role="tab"
            type="button"
          >
            {text.browseTab}
          </button>
          <button
            aria-selected={networkMode === "photographer"}
            className={networkMode === "photographer" ? "is-active" : ""}
            onClick={() => setNetworkMode("photographer")}
            role="tab"
            type="button"
          >
            {text.photographerTab}
          </button>
          <button
            aria-selected={networkMode === "coverage"}
            className={networkMode === "coverage" ? "is-active" : ""}
            onClick={() => setNetworkMode("coverage")}
            role="tab"
            type="button"
          >
            {text.coverageTab}
          </button>
        </div>
      </nav>

      <section className="network-layout">
        <div className="network-main">
          <div className="section-head">
            <div>
              <p className="eyebrow">{text.directoryEyebrow}</p>
              <h2>{text.photographersTitle}</h2>
            </div>
            <span className="network-count">{text.publishedProfiles(photographers.length)}</span>
          </div>
          {loading ? (
            <LoadingState label={text.loadingPhotographers} />
          ) : error ? (
            <ErrorMessage error={error} />
          ) : photographers.length === 0 ? (
            <EmptyState title={text.emptyNetworkTitle} message={text.emptyNetworkMessage} />
          ) : (
            <ItemList
              className="network-profile-grid"
              items={photographers}
              renderItem={(photographer) => (
                <article className="network-profile-card" key={photographer.id}>
                  <span className="network-card-index">
                    {text.photoCount(String(photographer.sampleCount || 0).padStart(2, "0"))}
                  </span>
                  <h3>{photographer.name}</h3>
                  <p className="network-profile-meta">
                    {photographer.city} · {(photographer.specialties || []).join(" · ") || text.coverageSpecialty}
                  </p>
                  {photographer.bio && <p>{photographer.bio}</p>}
                  {!!photographer.portfolioUrls?.length && (
                    <div className="network-portfolio-grid" aria-label={text.photographerPortfolio(photographer.name)}>
                      {photographer.portfolioUrls.slice(0, 10).map((photoUrl) => (
                        <a href={photoUrl} key={photoUrl} rel="noreferrer" target="_blank">
                          <img alt={text.portfolioPhoto(photographer.name)} loading="lazy" src={photoUrl} />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="network-profile-links">
                    {photographer.portfolioUrl && (
                      <a href={photographer.portfolioUrl} target="_blank" rel="noreferrer">
                        {text.portfolioLink}
                      </a>
                    )}
                    {photographer.instagram && <span>{photographer.instagram}</span>}
                  </div>
                </article>
              )}
            />
          )}

          <div className="section-head network-subsection-head">
            <div>
              <p className="eyebrow">{text.opportunitiesEyebrow}</p>
              <h2>{text.coverageSearchesTitle}</h2>
            </div>
            {eventId && (
              <ButtonLink className="ghost" to={`/agenda/evento/${eventId}`}>
                {text.backToEvent}
              </ButtonLink>
            )}
          </div>
          <ItemList
            className="network-request-list"
            empty={<EmptyState title={text.emptyCoverageTitle} message={text.emptyCoverageMessage} />}
            items={requests}
            renderItem={(request) => (
              <article className="network-request-card" key={request.id}>
                <div>
                  <span className="eyebrow">
                    {request.city || text.scene} · {request.organization || text.afterstage}
                  </span>
                  <h3>{request.title}</h3>
                  <p>{request.description}</p>
                  <small>
                    {request.budget || text.budgetToCoordinate}
                    {request.deadlineAt
                      ? ` · ${text.deadline(new Date(request.deadlineAt).toLocaleDateString("es-AR"))}`
                      : ""}
                  </small>
                </div>
                <Button onClick={() => setApplicationFor(request)} variant="dark" type="button">
                  {text.apply}
                </Button>
              </article>
            )}
          />
        </div>

        <aside className="network-forms" aria-label={text.selectedAction}>
          {networkMode === "browse" && (
            <div className="network-form network-form-guide">
              <p className="eyebrow">{text.findCollaborators}</p>
              <h2>{text.exploreNetworkTitle}</h2>
              <p>{text.exploreNetworkDescription}</p>
              <Button
                onClick={() =>
                  document.querySelector(".network-subsection-head")?.scrollIntoView({ behavior: "smooth" })
                }
                variant="dark"
                type="button"
              >
                {text.viewOpenSearches}
              </Button>
            </div>
          )}
          {networkMode === "photographer" && (
            <form className="form network-form" onSubmit={submitPhotographer}>
              <p className="eyebrow">{text.addProfile}</p>
              <h2>{text.workWithNetwork}</h2>
              <p>{text.photographerIntro}</p>
              <label>
                {text.name}
                <input
                  required
                  value={photographerForm.name}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, name: event.target.value })}
                />
              </label>
              <label>
                {text.city}
                <input
                  required
                  value={photographerForm.city}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, city: event.target.value })}
                />
              </label>
              <label>
                {text.specialties}
                <input
                  required
                  placeholder={text.specialtiesPlaceholder}
                  value={photographerForm.specialties}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, specialties: event.target.value })}
                />
              </label>
              <label>
                {text.portfolio}
                <input
                  type="url"
                  value={photographerForm.portfolioUrl}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, portfolioUrl: event.target.value })}
                />
              </label>
              <details className="form-optional-fields">
                <summary>{text.optionalPortfolioAndAvailability}</summary>
                <div className="form-optional-fields-content">
                  <label>
                    {text.portfolioPhotos}
                    <textarea
                      placeholder={text.portfolioPhotoPlaceholder}
                      rows="3"
                      value={photographerForm.portfolioUrls}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, portfolioUrls: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {text.instagram}
                    <input
                      value={photographerForm.instagram}
                      onChange={(event) => setPhotographerForm({ ...photographerForm, instagram: event.target.value })}
                    />
                  </label>
                  <label>
                    {text.bio}
                    <textarea
                      rows="3"
                      value={photographerForm.bio}
                      onChange={(event) => setPhotographerForm({ ...photographerForm, bio: event.target.value })}
                    />
                  </label>
                  <label>
                    {text.referencePhotoCount}
                    <input
                      min="0"
                      type="number"
                      value={photographerForm.sampleCount}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, sampleCount: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    {text.availability}
                    <input
                      placeholder={text.availabilityPlaceholder}
                      value={photographerForm.availability}
                      onChange={(event) =>
                        setPhotographerForm({ ...photographerForm, availability: event.target.value })
                      }
                    />
                  </label>
                </div>
              </details>
              <label>
                {text.contactEmail}
                <input
                  required
                  type="email"
                  value={photographerForm.contactEmail}
                  onChange={(event) => setPhotographerForm({ ...photographerForm, contactEmail: event.target.value })}
                />
              </label>
              <Button variant="dark" type="submit">
                {text.submitProfile}
              </Button>
              <FormNotice error={photographerError} message={photographerNotice} />
            </form>
          )}
          {networkMode === "coverage" && (
            <form className="form network-form" onSubmit={submitCoverage}>
              <p className="eyebrow">{text.publishSearch}</p>
              <h2>{text.needCoverage}</h2>
              <label>
                {text.title}
                <input
                  required
                  value={coverageForm.title}
                  onChange={(event) => setCoverageForm({ ...coverageForm, title: event.target.value })}
                />
              </label>
              <label>
                {text.whatDoYouNeed}
                <textarea
                  required
                  minLength="10"
                  rows="4"
                  value={coverageForm.description}
                  onChange={(event) => setCoverageForm({ ...coverageForm, description: event.target.value })}
                />
              </label>
              <label>
                {text.name}
                <input
                  required
                  value={coverageForm.requesterName}
                  onChange={(event) => setCoverageForm({ ...coverageForm, requesterName: event.target.value })}
                />
              </label>
              <label>
                {text.email}
                <input
                  required
                  type="email"
                  value={coverageForm.requesterEmail}
                  onChange={(event) => setCoverageForm({ ...coverageForm, requesterEmail: event.target.value })}
                />
              </label>
              <label>
                {text.productionOrBand}
                <input
                  value={coverageForm.organization}
                  onChange={(event) => setCoverageForm({ ...coverageForm, organization: event.target.value })}
                />
              </label>
              <label>
                {text.city}
                <input
                  value={coverageForm.city}
                  onChange={(event) => setCoverageForm({ ...coverageForm, city: event.target.value })}
                />
              </label>
              <label>
                {text.budget}
                <input
                  value={coverageForm.budget}
                  onChange={(event) => setCoverageForm({ ...coverageForm, budget: event.target.value })}
                />
              </label>
              <label>
                {text.deadlineLabel}
                <input
                  type="datetime-local"
                  value={coverageForm.deadlineAt}
                  onChange={(event) => setCoverageForm({ ...coverageForm, deadlineAt: event.target.value })}
                />
              </label>
              <Button type="submit">{text.submitCoverageSearch}</Button>
              <FormNotice error={coverageError} message={coverageNotice} />
            </form>
          )}
        </aside>
      </section>

      {applicationFor && (
        <Dialog
          labelledBy="network-application-title"
          onClose={() => setApplicationFor(null)}
          panelAs="form"
          panelClassName="form network-application-modal"
          onSubmit={submitApplication}
        >
          <IconButton label={text.close} onClick={() => setApplicationFor(null)}>
            ×
          </IconButton>
          <p className="eyebrow">{text.application}</p>
          <h2 id="network-application-title">{applicationFor.title}</h2>
          <label>
            {text.publishedProfileOptional}
            <select
              value={application.photographerId}
              onChange={(event) => setApplication({ ...application, photographerId: event.target.value })}
            >
              <option value="">{text.sendDetailsManually}</option>
              {photographers.map((photographer) => (
                <option key={photographer.id} value={photographer.id}>
                  {photographer.name} · {photographer.city}
                </option>
              ))}
            </select>
          </label>
          <label>
            {text.name}
            <input
              required
              value={application.applicantName}
              onChange={(event) => setApplication({ ...application, applicantName: event.target.value })}
            />
          </label>
          <label>
            {text.email}
            <input
              required
              type="email"
              value={application.applicantEmail}
              onChange={(event) => setApplication({ ...application, applicantEmail: event.target.value })}
            />
          </label>
          <label>
            {text.portfolio}
            <input
              type="url"
              value={application.portfolioUrl}
              onChange={(event) => setApplication({ ...application, portfolioUrl: event.target.value })}
            />
          </label>
          <label>
            {text.message}
            <textarea
              rows="4"
              value={application.message}
              onChange={(event) => setApplication({ ...application, message: event.target.value })}
            />
          </label>
          <Button variant="dark" type="submit">
            {text.submitApplication}
          </Button>
          <FormNotice error={coverageError} message={coverageNotice} />
        </Dialog>
      )}
    </Layout>
  );
}
