import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api.js";
import { Layout, Loading } from "../components/Layout.jsx";
export function ArticlePage() {
  const { slug } = useParams();
  const [item, setItem] = useState(null);
  useEffect(() => {
    api(`/api/public/content/${slug}`)
      .then(setItem)
      .catch(() => {});
  }, [slug]);
  if (!item)
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  const share = async (instagram = false) => {
    const payload = {
      title: item.title,
      text: `${item.summary}\n${window.location.href}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else if (navigator.clipboard) await navigator.clipboard.writeText(payload.url);
      else window.prompt("Copiá este enlace", payload.url);
    } catch (error) {
      if (error?.name !== "AbortError") window.prompt("Copiá este enlace", payload.url);
    }
  };
  return (
    <Layout>
      <article className="article">
        <small>
          {item.type || "Nota"} · {item.author || "Medio Under"}
        </small>
        <h1>{item.title}</h1>
        <p className="lead">{item.summary}</p>
        {item.assets?.[0] && (
          <img className="hero-image" src={item.assets[0].url} alt={item.assets[0].altText || item.title} />
        )}
        {item.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <div className="actions">
          <button className="button" onClick={() => share(false)}>
            Compartir desde el celular ↗
          </button>
          <button className="button ghost" onClick={() => share(true)}>
            Compartir en Instagram ↗
          </button>
        </div>
        {item.photographer && <p className="muted">Foto: {item.photographer}</p>}
      </article>
    </Layout>
  );
}
