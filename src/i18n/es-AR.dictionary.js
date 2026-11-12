export const mobileNavigationEs = {
  account: "Cuenta",
  admin: "Administración",
  applyForCoverage: "Postularse a coberturas",
  calendar: "Agenda",
  closeMenu: "Cerrar menú",
  closeMoreMenu: "Cerrar menú ampliado",
  community: "Comunidad",
  credits: "Código de créditos",
  directory: "Directorio",
  explore: "Explorar Afterstage",
  home: "Inicio",
  iaAccess: "Accesos IA",
  instagram: "Cuenta de Instagram",
  mail: "Correo",
  manageCoverages: "Gestionar coberturas",
  marketplace: "Marketplace",
  more: "Más",
  moreSections: "Más secciones",
  moreWorkspaceSections: "Más secciones del espacio",
  network: "Red",
  networkWork: "Red de trabajo",
  newPost: "Nueva publicación",
  notes: "Notas",
  navigation: "Navegación móvil",
  operations: "Operaciones de plataforma",
  policy: "Política editorial",
  press: "Prensa",
  propose: "Proponer contenido",
  publish: "Publicar",
  replacements: "Coberturas",
  services: "Servicios",
  sessionClose: "Cerrar sesión",
  shield: "Seguros",
  social: "Redes",
  socialSeries: "Historias y series",
  sitePublic: "Ver sitio público",
  transport: "Traslados",
  viewProfile: "Ver perfil",
  users: "Usuarios",
  workWithAfterstage: "Colaborá con Afterstage",
  howItWorks: "Cómo funciona",
};

export const authMessagesEs = {
  logoutUnconfirmed:
    "Se cerró la sesión en este navegador, pero no pudimos confirmar la revocación en el servidor. Si el acceso sigue activo, volvé a cerrar sesión.",
  passwordUpdated: "Contraseña actualizada. Ya podés iniciar sesión.",
  recoveryUnavailable: "La recuperación de acceso no está disponible temporalmente.",
};

export const agendaMessagesEs = {
  eventsOnMap: ({ count }) => `${count} ${count === 1 ? "fecha" : "fechas"} en el mapa`,
  eventsInAgenda: ({ count }) => `${count} ${count === 1 ? "evento" : "eventos"} en la agenda`,
};

export const pressMessagesEs = {
  accreditationSending: "Enviando…",
  sendAccreditationConfirm: ({ recipient, subject, event }) =>
    `Vas a enviar un correo a ${recipient} con el asunto «${subject}» para solicitar acreditación de ${event}. ¿Querés enviarlo ahora?`,
  accreditationSendPending:
    "Ya existe un intento de envío para esta solicitud. No se envió otra copia. Revisá su estado y consultá a una persona administradora antes de volver a enviarla.",
};
