// Mapeia o preset de enquadramento escolhido pelo admin (topo/centro/base)
// para o valor CSS correspondente (object-position para <img>,
// background-position para elementos com imagem de fundo). Resolve fotos
// cortadas de forma ruim em boxes de proporção fixa (card, banner) sem
// precisar editar a imagem original.
const FOCAL_POINT_CSS = {
  top: 'center top',
  center: 'center center',
  bottom: 'center bottom',
};

export function focalPointToCss(focalPoint) {
  return FOCAL_POINT_CSS[focalPoint] || 'center center';
}

export const FOCAL_POINT_OPTIONS = [
  ['top', 'Topo'],
  ['center', 'Centro'],
  ['bottom', 'Base'],
];
