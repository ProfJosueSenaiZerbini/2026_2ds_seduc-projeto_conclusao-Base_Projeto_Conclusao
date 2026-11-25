export const perfilUrl = (handle: string) =>
  "/p/" + encodeURIComponent(handle.replace(/^@/, ""));

export function enderecoObra(handle: string, id: string) {
  const chave = encodeURIComponent(id);
  return perfilUrl(handle) + "?obra=" + chave + "#obra-" + chave;
}
