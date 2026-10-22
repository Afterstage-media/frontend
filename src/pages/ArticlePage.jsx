import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Link } from "react-router-dom";
import { Layout, Loading } from "../components/Layout.jsx";
export function ArticlePage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  useEffect(() => {
    setItem(null);
    setError("");
    api(`/api/public/content/${slug}`)
      .then(setItem)
      .catch((requestError) => setError(requestError.message));
  }, [slug]);
  useEffect(() => {
    if (!item) return undefined;
    const title = `${item.seoTitle || item.title} — afterstage`;
    document.title = title;
    const description = item.seoDescription || item.summary;
    const upsertMeta = (selector, attributes, content) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };
    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, item.title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", item.canonicalUrl || window.location.href.split("?")[0]);
    return () => {
      document.title = "afterstage";
    };
  }, [item]);
  if (error)
    return (
      <Layout>
        <section className="page-intro">
          <p className="eyebrow">Archivo editorial</p>
          <h1>Nota no disponible.</h1>
          <p className="muted">No encontramos esta nota o ya no está publicada.</p>
          <p className="error">{error}</p>
          <Link className="button dark" to="/notas">
            Volver al archivo
          </Link>
        </section>
      </Layout>
    );
  if (!item)
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  const share = async (instagram = false) => {
    setShareStatus("");
    const url = window.location.href;
    const instagramText = `${item.title}\n\n${item.summary}\n\n${url}`;
    const payload = {
      title: item.title,
      text: `${item.summary}\n${window.location.href}`,
      url,
    };
    try {
      if (instagram) {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(instagramText);
          setShareStatus("Copy para Instagram copiado.");
        } else {
          window.prompt("Copiá este texto para Instagram", instagramText);
        }
      } else if (navigator.share) {
        await navigator.share(payload);
        setShareStatus("Nota compartida.");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(payload.url);
        setShareStatus("Enlace copiado.");
      } else window.prompt("Copiá este enlace", payload.url);
    } catch (error) {
      if (error?.name !== "AbortError") window.prompt("Copiá este enlace", payload.url);
    }
  };
  return (
    <Layout>
      <article className="article">
        <small>
          {item.type || "Nota"} · {item.author || "afterstage"}
        </small>
        <h1>{item.title}</h1>
        <p className="lead">{item.summary}</p>
        {item.assets?.[0] && (
          <img className="hero-image" src={item.assets[0].url} alt={item.assets[0].altText || item.title} />
        )}
        {item.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <div className="article-share-actions">
          <button className="button article-share-primary" type="button" onClick={() => share(false)}>
            Compartir nota ↗
          </button>
          <button className="article-copy-action" type="button" onClick={() => share(true)}>
            Copiar copy para Instagram
          </button>
        </div>
        {shareStatus && (
          <p className="success" role="status">
            {shareStatus}
          </p>
        )}
        {item.photographer && <p className="muted">Foto: {item.photographer}</p>}
      </article>
    </Layout>
  );
}
