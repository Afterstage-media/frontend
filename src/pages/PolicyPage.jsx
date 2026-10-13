import { Layout } from "../components/Layout.jsx";

export function PolicyPage() {
  return (
    <Layout>
      <article className="article">
        <p className="eyebrow">Medio Under</p>
        <h1>Política editorial.</h1>
        <p className="lead">
          Periodismo musical independiente con fuentes claras, créditos completos y respeto por las escenas que
          cubrimos.
        </p>
        <h2>Cómo trabajamos</h2>
        <p>
          Verificamos nombres, fechas, lugares y citas antes de publicar. Cuando un dato necesita confirmación lo
          indicamos explícitamente. No presentamos material promocional como información independiente.
        </p>
        <h2>Correcciones</h2>
        <p>
          Si encontrás un error, escribinos con la URL y la información verificable. Registramos las correcciones y
          actualizamos la nota manteniendo transparencia sobre cambios relevantes.
        </p>
        <h2>Acreditaciones</h2>
        <p>
          Las solicitudes de prensa se realizan con información honesta sobre la cobertura prevista. Una acreditación no
          garantiza una reseña positiva: garantiza trabajo periodístico responsable.
        </p>
        <h2>Privacidad</h2>
        <p>
          Los datos de contactos de prensa y colaboradores se usan para coordinación editorial y no se publican salvo
          autorización.
        </p>
      </article>
    </Layout>
  );
}

export function CreditsPage() {
  return (
    <Layout>
      <article className="article">
        <p className="eyebrow">Medio Under</p>
        <h1>Código de créditos.</h1>
        <p className="lead">Reconocemos a las personas y organizaciones que hacen posible cada cobertura.</p>
        <h2>Fotografía y video</h2>
        <p>
          Cada imagen debe indicar autoría. No removemos marcas ni reutilizamos material sin permiso. Si una foto fue
          cedida por una banda, sala, productora o agencia, se indica su procedencia.
        </p>
        <h2>Fuentes</h2>
        <p>
          Las fuentes oficiales, comunicados y enlaces de referencia se conservan en la ficha editorial. Las citas se
          atribuyen y no se fabrican.
        </p>
        <h2>Colaboradores</h2>
        <p>
          Noteros, fotógrafos, cronistas y reemplazos reciben crédito visible en la nota y en la publicación social
          cuando el formato lo permite.
        </p>
        <h2>Correcciones de crédito</h2>
        <p>
          Si falta o está mal escrito un crédito, contactá al medio para corregirlo. La autoría no se considera un
          detalle opcional.
        </p>
      </article>
    </Layout>
  );
}
