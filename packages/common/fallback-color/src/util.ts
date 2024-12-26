function stringToColor(string: string) {
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
}

function hexToRgb(hex: string) {
  hex = hex.replace(/^#/, '');

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return [r, g, b];
}
function luminance(color: number[]): number {
  const rgb = color.map((c: number) => {
    c /= 255;
    return c < 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return (
    21.26 * rgb[0] + // red
    71.52 * rgb[1] + // green
    7.22 * rgb[2] // blue
  );
}

function getContrastingColor(color: number[]): string {
  const luminanceValue = luminance(color);

  // Если яркость выше 50%, возвращаем черный цвет, иначе - белый
  return luminanceValue > 50 ? '#000000' : '#ffffff';
}


export const getFallbackColor = (fallBackName: string = '') => {
    const fallbackBackgroundColor = stringToColor(fallBackName);
    const rgbForFallbackBackground = hexToRgb(fallbackBackgroundColor);
    const fallbackNameColor = getContrastingColor(rgbForFallbackBackground);

    return {
        fallbackBackgroundColor,
        fallbackNameColor
    }
}