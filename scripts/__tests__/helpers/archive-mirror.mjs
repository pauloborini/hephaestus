// Espelho do archive (DEC-002): artefato concluído sai da pasta viva e vai
// para a pasta correspondente em `.app-work/archive/` — mover, não duplicar:
//   .app-work/archive/guides/<NOME>_GUIDE/   (pack concluído preservado)
//   .app-work/archive/guides/<arquivo>       (guide solto)
// Sem segmentação temporal. Path já no espelho é canônico; legado sob
// `.app-work/done/` (removido da lista fechada) migra na próxima execução.

/** Nome do pack `*_GUIDE` presente no path, se houver. */
export const guidePackName = (sourcePath) => {
  const parts = sourcePath.split("/");
  return parts.find((p) => /_GUIDE$/i.test(p)) ?? null;
};

/** Origem já no espelho canônico `archive/guides/`. */
export const isCanonicalArchiveGuidePath = (sourcePath) =>
  sourcePath.startsWith(".app-work/archive/guides/");

/** Legado: sob `.app-work/done/` (removido da lista fechada) — precisa migrar. */
export const isLegacyDonePath = (sourcePath) =>
  sourcePath.startsWith(".app-work/done/");

/** Destino-raiz do catálogo (guia concluído), antes da expansão do pack. */
export const isArchiveGuideCatalogRoot = (destination) =>
  destination === ".app-work/archive/guides/" ||
  destination === ".app-work/archive/guides";

/**
 * Destino-pasta (termina em `/`) para relocate de guide concluído.
 * Pack preserva `<NOME>_GUIDE/`; arquivo solto cai na raiz de `archive/guides/`.
 * Origem já no espelho é canônico — destino = diretório do arquivo (keep).
 */
export const resolveArchiveGuideDestination = (sourcePath) => {
  if (isCanonicalArchiveGuidePath(sourcePath)) {
    const dir = sourcePath.endsWith("/")
      ? sourcePath
      : `${sourcePath.slice(0, sourcePath.lastIndexOf("/") + 1)}`;
    return dir;
  }
  const pack = guidePackName(sourcePath);
  return pack ? `.app-work/archive/guides/${pack}/` : `.app-work/archive/guides/`;
};
