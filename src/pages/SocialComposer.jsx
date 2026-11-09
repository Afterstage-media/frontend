import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { ErrorMessage, Layout } from "../components/Layout.jsx";
import "../styles/pages/social-composer.css";

const emptySlide = () => ({ file: null, text: "", altText: "", credit: "" });
const imageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const imageMaxBytes = 2.5 * 1024 * 1024;

const publicationFromItem = (item) => ({
  id: item.id,
  status: item.status,
  title: item.title,
  instagramCopy: item.instagramCopy,
  templateId: item.socialTemplateId || "",
  templateVersion: item.socialTemplateVersion,
  images: (item.assets || []).map((asset, index) => ({
    slide: index + 1,
    url: asset.url,
    altText: asset.altText || `Lámina ${index + 1}`,
    credit: asset.credit || "",
  })),
  slides: item.socialSlides?.length
    ? item.socialSlides.map((slide, index) => ({
        slide: index + 1,
        sourceAssetId: slide.source.id,
        imageUrl: slide.source.url,
        text: slide.text,
        altText: slide.source.altText,
        credit: slide.source.credit,
      }))
    : (item.assets || []).map((asset, index) => ({
        slide: index + 1,
        sourceAssetId: "",
        imageUrl: asset.url,
        text: slideTextsFromBody(item.body)[index] || "",
        altText: asset.altText,
        credit: asset.credit,
        isRenderedArtwork: true,
      })),
});

const slideTextsFromBody = (body = "") =>
  [...body.matchAll(/^Lámina\s+\d+:\s*(.+)$/gm)].map((match) => match[1].trim());

function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = () => reject(new Error(`No pudimos leer ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

function SocialComposer({ publication: existingItem = null, initialTemplateId = "" }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedTemplateId = searchParams.get("templateId");
  const isEditing = Boolean(existingItem?.id);
  const isLegacy = isEditing && !existingItem?.socialSlides?.length;
  const existingPublication = existingItem ? publicationFromItem(existingItem) : null;
  const existingSlides = existingItem?.socialSlides?.length
    ? existingItem.socialSlides.map((slide) => ({
        file: null,
        sourceUrl: slide.source.url,
        sourceAssetId: slide.source.id,
        text: slide.text,
        altText: slide.source.altText || "",
        credit: slide.source.credit || "",
      }))
    : (existingItem?.assets || []).map((asset, index) => ({
        file: null,
        sourceUrl: asset.url,
        sourceAssetId: "",
        isRenderedArtwork: true,
        text: slideTextsFromBody(existingItem.body)[index] || "",
        altText: asset.altText || "",
        credit: asset.credit || "",
      }));
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(existingItem?.socialTemplateId || initialTemplateId || "");
  const [title, setTitle] = useState(existingItem?.title || "");
  const [instagramCopy, setInstagramCopy] = useState(existingItem?.instagramCopy || "");
  const [source, setSource] = useState(existingItem?.source || "");
  const [author, setAuthor] = useState(existingItem?.author || "");
  const [photographer, setPhotographer] = useState(existingItem?.photographer || "");
  const [slides, setSlides] = useState(
    existingSlides.length ? existingSlides : [emptySlide(), emptySlide(), emptySlide()],
  );
  const [activeSlide, setActiveSlide] = useState(0);
  const [publication, setPublication] = useState(existingPublication);
  const [view, setView] = useState(searchParams.get("view") === "review" && existingPublication ? "review" : "edit");
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const selectedTemplate = templates.find((item) => item.id === templateId);
  const selectedSlide = slides[activeSlide] || slides[0];
  const objectUrls = useMemo(
    () => slides.map((slide) => (slide.file ? URL.createObjectURL(slide.file) : slide.sourceUrl || "")),
    [slides],
  );

  useEffect(() => () => objectUrls.forEach((url) => url && URL.revokeObjectURL(url)), [objectUrls]);
  useEffect(() => {
    let active = true;
    api("/api/social-templates?type=carousel&channel=instagram")
      .then((available) => {
        if (!active) return;
        setTemplates(available);
        const requested = available.find((item) => item.id === (requestedTemplateId || initialTemplateId));
        const existing = available.find((item) => item.id === existingItem?.socialTemplateId);
        setTemplateId((current) => current || existing?.id || requested?.id || available[0]?.id || "");
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => active && setLoadingTemplates(false));
    return () => {
      active = false;
    };
  }, [requestedTemplateId, initialTemplateId, existingItem?.socialTemplateId]);

  const setSlide = (index, patch) =>
    setSlides((current) => current.map((slide, position) => (position === index ? { ...slide, ...patch } : slide)));
  const selectFiles = (fileList) => {
    const incoming = [...fileList];
    const emptyIndexes = slides.map((slide, index) => (!slide.file ? index : -1)).filter((index) => index >= 0);
    const extraSlides = Math.max(0, incoming.length - emptyIndexes.length);
    const capacity = 9 - slides.length;
    if (extraSlides > capacity) {
      setError(`Podés sumar hasta ${emptyIndexes.length + capacity} imágenes en esta carga. El máximo es 9.`);
      return;
    }
    setError("");
    const updated = slides.map((slide) => ({ ...slide }));
    incoming.forEach((file, index) => {
      if (emptyIndexes[index] !== undefined) updated[emptyIndexes[index]].file = file;
      else updated.push({ ...emptySlide(), file });
    });
    setSlides(updated);
    if (incoming.length) setActiveSlide(emptyIndexes[0] ?? slides.length);
  };

  const moveSlide = (direction) => {
    const target = activeSlide + direction;
    if (target < 0 || target >= slides.length) return;
    setSlides((current) => {
      const next = [...current];
      [next[activeSlide], next[target]] = [next[target], next[activeSlide]];
      return next;
    });
    setActiveSlide(target);
  };

  const imagePayload = async (slide) => {
    const file = slide.file;
    if (!file) throw new Error("Elegí una imagen para cada lámina.");
    if (!imageTypes.has(file.type)) throw new Error("Usá imágenes JPG, PNG o WebP.");
    if (file.size <= 0 || file.size > imageMaxBytes) throw new Error("Cada imagen puede pesar hasta 2,5 MiB.");
    return {
      base64: await fileData(file),
      mimeType: file.type,
      filename: file.name,
      altText: slide.altText.trim(),
      credit: slide.credit.trim(),
    };
  };

  const visualHasChanges = Boolean(
    publication &&
    (title !== publication.title ||
      templateId !== publication.templateId ||
      slides.length !== publication.images.length ||
      slides.some(
        (slide, index) =>
          slide.file ||
          slide.sourceAssetId !== publication.slides?.[index]?.sourceAssetId ||
          slide.text !== publication.slides?.[index]?.text,
      )),
  );
  const hasUnsavedChanges = Boolean(
    isEditing &&
    (visualHasChanges ||
      instagramCopy !== existingItem.instagramCopy ||
      source !== existingItem.source ||
      author !== existingItem.author ||
      photographer !== existingItem.photographer),
  );

  const saveCarousel = async (event) => {
    event.preventDefault();
    setError("");
    setStatusMessage("");
    setSaving(true);
    try {
      for (const [index, slide] of slides.entries()) {
        if (!slide.file && !slide.sourceUrl) throw new Error(`Elegí una imagen para la lámina ${index + 1}.`);
        if (!isLegacy || visualHasChanges) {
          if (!slide.text.trim()) throw new Error(`Completá el texto de la lámina ${index + 1}.`);
          if (!slide.altText.trim())
            throw new Error(`Describí la imagen de la lámina ${index + 1} para accesibilidad.`);
        }
      }
      if (!source.trim()) throw new Error("Agregá la fuente que usaste para verificar la información.");
      if (isLegacy && visualHasChanges && slides.some((slide) => !slide.file)) {
        throw new Error(
          "Este borrador anterior no conserva las fotos originales. Para cambiar el diseño, cargá una imagen nueva en cada lámina.",
        );
      }

      const common = {
        templateId,
        title: title.trim(),
        instagramCopy: instagramCopy.trim(),
        source: source.trim(),
        author: author.trim(),
        photographer: photographer.trim(),
        tags: existingItem?.tags || [],
      };
      let result;
      if (isLegacy && !visualHasChanges) {
        const updatedItem = await api(`/api/content/${existingItem.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            instagramCopy: common.instagramCopy,
            source: common.source,
            author: common.author,
            photographer: common.photographer,
          }),
        });
        result = publicationFromItem(updatedItem);
      } else {
        const payloadSlides = await Promise.all(
          slides.map(async (slide) => ({
            ...(slide.file ? { image: await imagePayload(slide) } : {}),
            ...(!slide.file && slide.sourceAssetId ? { sourceAssetId: slide.sourceAssetId } : {}),
            text: slide.text.trim(),
          })),
        );
        result = await api(isEditing ? `/api/social-carousel/${existingItem.id}` : "/api/social-carousel", {
          method: isEditing ? "PUT" : "POST",
          body: JSON.stringify({ ...common, slides: payloadSlides }),
        });
      }
      setPublication(result);
      setActiveSlide(0);
      setView("review");
      setStatusMessage(
        isEditing ? "Cambios guardados en el borrador." : "Borrador creado. Revisá cómo se ve en Instagram.",
      );
      navigate(`/admin/contenido/${result.id}?mode=instagram&view=review`, { replace: !isEditing });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <main className="social-composer-page">
        <header className="social-composer-topbar">
          <Link className="social-composer-back" to="/admin">
            ← Espacio editorial
          </Link>
          <span className="social-composer-draft">
            <i /> Borrador · no se publica automáticamente
          </span>
        </header>

        <section className="social-composer-intro">
          <div>
            <p className="eyebrow">ESTUDIO DE PUBLICACIONES / INSTAGRAM</p>
            <h1>{isEditing ? "Tu publicación" : "Nueva publicación"}</h1>
            <p>Elegí una plantilla, cargá tus imágenes y revisá el resultado como se verá en Instagram.</p>
          </div>
          <div className="social-composer-format-note">
            <span>4:5</span>
            <small>
              1080 × 1350
              <br />
              feed de Instagram
            </small>
          </div>
        </section>

        {publication && (
          <nav className="composer-mode-switch" aria-label="Modo de publicación">
            <button className={view === "edit" ? "is-active" : ""} onClick={() => setView("edit")} type="button">
              Editar
            </button>
            <button className={view === "review" ? "is-active" : ""} onClick={() => setView("review")} type="button">
              Vista previa
            </button>
          </nav>
        )}
        <form className="social-composer-form" onSubmit={saveCarousel}>
          {view === "review" && publication ? (
            <section className="instagram-review" aria-label="Vista previa de publicación de Instagram">
              <div className="instagram-review-heading">
                <div>
                  <p className="eyebrow">BORRADOR · NO PUBLICADO</p>
                  <h2>Así se verá en Instagram</h2>
                </div>
                <button type="button" onClick={() => setView("edit")}>
                  Seguir editando
                </button>
              </div>
              <article className="instagram-post">
                <header className="instagram-post-account">
                  <span className="instagram-avatar">A</span>
                  <div>
                    <b>afterstage.ar</b>
                    <small>Publicación sugerida</small>
                  </div>
                  <span aria-hidden="true">•••</span>
                </header>
                <div className="instagram-post-image-wrap">
                  <img
                    src={publication.images?.[activeSlide]?.url}
                    alt={publication.images?.[activeSlide]?.altText || `Lámina ${activeSlide + 1}`}
                  />
                  {publication.images?.length > 1 && (
                    <span className="instagram-post-count">
                      {activeSlide + 1}/{publication.images.length}
                    </span>
                  )}
                </div>
                <div className="instagram-post-controls">
                  <button
                    aria-label="Lámina anterior"
                    disabled={activeSlide === 0}
                    onClick={() => setActiveSlide((index) => Math.max(0, index - 1))}
                    type="button"
                  >
                    ‹
                  </button>
                  <div>
                    {publication.images?.map((image, index) => (
                      <button
                        key={image.url}
                        className={activeSlide === index ? "is-active" : ""}
                        aria-label={`Ver lámina ${index + 1}`}
                        onClick={() => setActiveSlide(index)}
                        type="button"
                      />
                    ))}
                  </div>
                  <button
                    aria-label="Lámina siguiente"
                    disabled={activeSlide >= (publication.images?.length || 1) - 1}
                    onClick={() =>
                      setActiveSlide((index) => Math.min((publication.images?.length || 1) - 1, index + 1))
                    }
                    type="button"
                  >
                    ›
                  </button>
                </div>
                <div className="instagram-post-actions" aria-hidden="true">
                  <span>♡　♧　➤</span>
                  <span>♧</span>
                </div>
                <p className="instagram-post-caption">
                  <b>afterstage.ar</b>{" "}
                  {instagramCopy || "Sumá el copy de Instagram para ver cómo acompaña a las imágenes."}
                </p>
                <small className="instagram-post-date">BORRADOR · {publication.images?.length || 0} LÁMINAS</small>
              </article>
              <p className="instagram-review-note">
                {hasUnsavedChanges
                  ? visualHasChanges
                    ? "Hay cambios sin guardar. Guardá para regenerar las imágenes y ver la versión final."
                    : "Hay cambios sin guardar. Guardalos para actualizar el borrador."
                  : "Vista previa de las imágenes finales generadas por Afterstage."}
              </p>
              <footer className="composer-savebar">
                <div>
                  <ErrorMessage error={error} />
                  {statusMessage && (
                    <p className="composer-save-success" role="status">
                      {statusMessage}
                    </p>
                  )}
                  <span>El borrador queda guardado en Afterstage.</span>
                </div>
                <button className="button dark composer-save-button" disabled={saving} type="submit">
                  {saving ? "Guardando…" : "Guardar cambios"}
                  <b aria-hidden="true">↗</b>
                </button>
              </footer>
            </section>
          ) : (
            <>
              <div className="social-composer-workspace">
                <div className="social-composer-editor">
                  <section className="composer-section">
                    <div className="composer-section-title">
                      <span>01</span>
                      <div>
                        <h2>Elegí una plantilla</h2>
                        <p>Las plantillas están en Afterstage y llevan la identidad visual del medio.</p>
                      </div>
                    </div>
                    {loadingTemplates ? (
                      <p className="composer-loading">Cargando plantillas…</p>
                    ) : (
                      <div className="composer-template-list">
                        {templates.map((template, index) => (
                          <button
                            aria-pressed={templateId === template.id}
                            className={`composer-template-option ${templateId === template.id ? "is-selected" : ""}`}
                            key={template.id}
                            onClick={() => setTemplateId(template.id)}
                            type="button"
                          >
                            <span className="composer-template-index">{String(index + 1).padStart(2, "0")}</span>
                            <span className="composer-template-copy">
                              <strong>{template.name}</strong>
                              <small>{template.description}</small>
                            </span>
                            <span className="composer-template-count">4:5</span>
                            <span className="composer-template-check" aria-hidden="true">
                              {templateId === template.id ? "✓" : ""}
                            </span>
                          </button>
                        ))}
                        {!templates.length && !error && (
                          <p className="composer-loading">No hay plantillas disponibles para carrusel.</p>
                        )}
                      </div>
                    )}
                    {selectedTemplate?.editorialGuidance && (
                      <details className="composer-guidance">
                        <summary>Guía editorial para esta plantilla</summary>
                        <p>
                          <b>Enfoque:</b> {selectedTemplate.editorialGuidance.angle}
                        </p>
                        <ul>
                          {selectedTemplate.editorialGuidance.verify.map((rule) => (
                            <li key={rule}>{rule}</li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </section>

                  <section className="composer-section">
                    <div className="composer-section-title">
                      <span>02</span>
                      <div>
                        <h2>Completá la publicación</h2>
                        <p>Una idea por lámina. Ordená las imágenes al seleccionarlas.</p>
                      </div>
                    </div>
                    {isLegacy && (
                      <p className="composer-legacy-note" role="status">
                        Este borrador es anterior al guardado de fotos originales. La vista muestra las láminas finales;
                        para rehacer el diseño, cargá la foto original en cada lámina.
                      </p>
                    )}
                    <label className="composer-field composer-title-field">
                      <span>Título interno</span>
                      <input
                        maxLength={180}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Ej.: Ciro en La Paternal"
                        required
                        value={title}
                      />
                    </label>
                    <div className="composer-slide-tabs" role="tablist" aria-label="Láminas del carrusel">
                      {slides.map((slide, index) => (
                        <button
                          aria-selected={activeSlide === index}
                          className={activeSlide === index ? "is-active" : ""}
                          key={index}
                          onClick={() => setActiveSlide(index)}
                          role="tab"
                          type="button"
                        >
                          {objectUrls[index] ? (
                            <img alt="" className="composer-slide-tab-image" src={objectUrls[index]} />
                          ) : (
                            <i />
                          )}
                          <span>{String(index + 1).padStart(2, "0")}</span>
                        </button>
                      ))}
                      {slides.length < 9 && (
                        <button
                          aria-label="Agregar lámina"
                          className="composer-add-slide"
                          onClick={() => {
                            setSlides((current) => [...current, emptySlide()]);
                            setActiveSlide(slides.length);
                          }}
                          type="button"
                        >
                          ＋
                        </button>
                      )}
                    </div>
                    <label className="composer-batch-upload">
                      ＋ Cargar varias fotos en orden
                      <input
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        onChange={(event) => {
                          selectFiles(event.target.files);
                          event.target.value = "";
                        }}
                        type="file"
                      />
                    </label>
                    <div className="composer-slide-order">
                      <button disabled={activeSlide === 0} onClick={() => moveSlide(-1)} type="button">
                        ← Mover antes
                      </button>
                      <button disabled={activeSlide === slides.length - 1} onClick={() => moveSlide(1)} type="button">
                        Mover después →
                      </button>
                    </div>
                    <div className="composer-slide-fields">
                      <div className="composer-slide-heading">
                        <b>LÁMINA {String(activeSlide + 1).padStart(2, "0")}</b>
                        <span>{slides.length}/9</span>
                      </div>
                      <div className="composer-slide-assembly">
                        <div className="composer-slide-photo-column">
                          <p className="composer-slide-photo-label">FOTO DE ESTA LÁMINA</p>
                          <div className="composer-slide-photo-preview">
                            {objectUrls[activeSlide] ? (
                              <img
                                src={objectUrls[activeSlide]}
                                alt={`Vista de la foto de la lámina ${activeSlide + 1}`}
                              />
                            ) : (
                              <span>4:5</span>
                            )}
                          </div>
                          <label className="composer-slide-photo-upload">
                            <b>{selectedSlide.file ? "Cambiar imagen" : "＋ Cargar imagen"}</b>
                            <small>JPG, PNG o WebP · hasta 2,5 MiB</small>
                            <input
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(event) => {
                                setSlide(activeSlide, {
                                  file: event.target.files?.[0] || null,
                                  isRenderedArtwork: false,
                                });
                                event.target.value = "";
                              }}
                              type="file"
                            />
                          </label>
                        </div>
                        <div className="composer-slide-copy-fields">
                          <label className="composer-field">
                            <span>
                              Texto sobre la imagen<small>{selectedSlide.text.length}/180</small>
                            </span>
                            <textarea
                              disabled={isLegacy && !selectedSlide.file}
                              maxLength={180}
                              onChange={(event) => setSlide(activeSlide, { text: event.target.value })}
                              placeholder={
                                isLegacy && !selectedSlide.file
                                  ? "Cargá la foto original para editar el diseño"
                                  : "Escribí el texto que va dentro de esta lámina"
                              }
                              required={!isLegacy || Boolean(selectedSlide.file)}
                              rows={3}
                              value={selectedSlide.text}
                            />
                          </label>
                          <label className="composer-field">
                            <span>
                              Descripción de imagen<small>Texto alternativo accesible</small>
                            </span>
                            <textarea
                              disabled={isLegacy && !selectedSlide.file}
                              maxLength={500}
                              onChange={(event) => setSlide(activeSlide, { altText: event.target.value })}
                              placeholder={
                                isLegacy && !selectedSlide.file
                                  ? "Cargá la foto original para editar esta descripción"
                                  : "Describí lo que se ve en la foto"
                              }
                              required={!isLegacy || Boolean(selectedSlide.file)}
                              rows={2}
                              value={selectedSlide.altText}
                            />
                          </label>
                          <label className="composer-field">
                            <span>Crédito de esta foto</span>
                            <input
                              disabled={isLegacy && !selectedSlide.file}
                              maxLength={500}
                              onChange={(event) => setSlide(activeSlide, { credit: event.target.value })}
                              placeholder="Nombre de quien tomó la foto"
                              value={selectedSlide.credit}
                            />
                          </label>
                          {slides.length > 2 && (
                            <button
                              className="composer-remove-slide"
                              onClick={() => {
                                setSlides((current) => current.filter((_, index) => index !== activeSlide));
                                setActiveSlide(Math.max(0, activeSlide - 1));
                              }}
                              type="button"
                            >
                              Quitar esta lámina
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="composer-section">
                    <div className="composer-section-title">
                      <span>03</span>
                      <div>
                        <h2>Copy y créditos</h2>
                        <p>El texto que acompaña al carrusel y sus referencias.</p>
                      </div>
                    </div>
                    <label className="composer-field">
                      <span>
                        Copy de Instagram<small>{instagramCopy.length}/2200</small>
                      </span>
                      <textarea
                        maxLength={2200}
                        onChange={(event) => setInstagramCopy(event.target.value)}
                        placeholder="Sumá contexto, créditos y una invitación a conversar…"
                        required
                        rows={5}
                        value={instagramCopy}
                      />
                    </label>
                    <label className="composer-field">
                      <span>Fuente consultada</span>
                      <textarea
                        maxLength={500}
                        onChange={(event) => setSource(event.target.value)}
                        placeholder="Enlace o referencia que permita verificar la información"
                        required
                        rows={2}
                        value={source}
                      />
                    </label>
                    <div className="composer-credit-grid">
                      <label className="composer-field">
                        <span>Autoría</span>
                        <input
                          maxLength={180}
                          onChange={(event) => setAuthor(event.target.value)}
                          placeholder="Nombre y apellido"
                          value={author}
                        />
                      </label>
                      <label className="composer-field">
                        <span>Crédito fotográfico general</span>
                        <input
                          maxLength={180}
                          onChange={(event) => setPhotographer(event.target.value)}
                          placeholder="Nombre y apellido"
                          value={photographer}
                        />
                      </label>
                    </div>
                  </section>
                </div>

                <aside className="composer-preview-column">
                  <div className="composer-preview-heading">
                    <div>
                      <p className="eyebrow">VISTA PREVIA</p>
                      <h2>Así queda</h2>
                      <small className="composer-preview-linked">
                        Vinculada a la lámina {String(activeSlide + 1).padStart(2, "0")}
                      </small>
                    </div>
                    <span>
                      {String(activeSlide + 1).padStart(2, "0")} <i>/</i> {String(slides.length).padStart(2, "0")}
                    </span>
                  </div>
                  {publication?.images?.[activeSlide] && (!visualHasChanges || (isLegacy && !selectedSlide.file)) ? (
                    <img
                      className="composer-rendered-artwork"
                      src={publication.images[activeSlide].url}
                      alt={publication.images[activeSlide].altText || `Lámina ${activeSlide + 1}`}
                    />
                  ) : (
                    <div className="composer-artboard">
                      {objectUrls[activeSlide] && (
                        <img alt="" className="composer-artboard-photo" src={objectUrls[activeSlide]} />
                      )}
                      <div className="composer-artboard-shade" />
                      <div className="composer-artboard-content">
                        <div className="composer-artboard-brand">
                          <b>AFTERSTAGE</b>
                          <i />
                        </div>
                        <div className="composer-artboard-main">
                          <span>
                            {selectedTemplate?.slides?.[activeSlide % (selectedTemplate.slides.length || 1)]?.eyebrow ||
                              `LÁMINA ${activeSlide + 1}`}
                          </span>
                          <h3>{selectedSlide.text || "Tu texto aparece acá"}</h3>
                        </div>
                        <div className="composer-artboard-footer">
                          <b>AFTERSTAGE.AR</b>
                          <span>
                            {String(activeSlide + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="composer-preview-controls">
                    <button
                      aria-label="Lámina anterior"
                      disabled={slides.length < 2}
                      onClick={() => setActiveSlide((current) => (current - 1 + slides.length) % slides.length)}
                      type="button"
                    >
                      ←
                    </button>
                    <div>
                      {slides.map((_, index) => (
                        <button
                          aria-label={`Ver lámina ${index + 1}`}
                          aria-pressed={activeSlide === index}
                          className={activeSlide === index ? "is-active" : ""}
                          key={index}
                          onClick={() => setActiveSlide(index)}
                          type="button"
                        />
                      ))}
                    </div>
                    <button
                      aria-label="Lámina siguiente"
                      disabled={slides.length < 2}
                      onClick={() => setActiveSlide((current) => (current + 1) % slides.length)}
                      type="button"
                    >
                      →
                    </button>
                  </div>
                  <div className="composer-preview-caption">
                    <span className="composer-preview-dot" />
                    <p>
                      4:5 · 1080 × 1350
                      <br />
                      <small>Violeta, carbón y tipografías de Afterstage</small>
                    </p>
                  </div>
                </aside>
              </div>
              <footer className="composer-savebar">
                <div>
                  <ErrorMessage error={error} />
                  {statusMessage && (
                    <p className="composer-save-success" role="status">
                      {statusMessage}
                    </p>
                  )}
                  <span>{slides.length} láminas · se guarda como borrador</span>
                </div>
                <button
                  className="button dark composer-save-button"
                  disabled={saving || loadingTemplates || !templates.length}
                  type="submit"
                >
                  {saving ? "Guardando…" : isEditing ? "Guardar y revisar" : "Crear borrador"}
                  <b aria-hidden="true">↗</b>
                </button>
              </footer>
            </>
          )}
        </form>
      </main>
    </Layout>
  );
}

export { SocialComposer };
