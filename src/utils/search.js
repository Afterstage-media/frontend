const combiningMarks = /[\u0300-\u036f]/g;

export const normalizeSearchText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(combiningMarks, "")
    .toLocaleLowerCase("es");
