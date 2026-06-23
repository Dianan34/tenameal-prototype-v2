/**
 * Mock QR code visual — deterministic pattern per value.
 * Not a real scannable QR, but reads as one in the UI.
 */
export function QRCode({ value, size = 160 }: { value: string; size?: number }) {
  const grid = 21;
  // simple hash
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  const cells: boolean[] = [];
  for (let i = 0; i < grid * grid; i++) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    cells.push((h & 1) === 1);
  }
  const cell = size / grid;
  const isFinder = (r: number, c: number) => {
    const inBox = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, grid - 7) || inBox(grid - 7, 0);
  };
  const finderFill = (r: number, c: number) => {
    const inner = (br: number, bc: number) => {
      const rr = r - br;
      const cc = c - bc;
      if (rr < 0 || rr > 6 || cc < 0 || cc > 6) return null;
      if (rr === 0 || rr === 6 || cc === 0 || cc === 6) return true;
      if (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    };
    return inner(0, 0) ?? inner(0, grid - 7) ?? inner(grid - 7, 0);
  };
  return (
    <div className="inline-block p-3 bg-white rounded-xl shadow-soft border border-border">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {Array.from({ length: grid }).map((_, r) =>
          Array.from({ length: grid }).map((__, c) => {
            const idx = r * grid + c;
            const fill = isFinder(r, c) ? finderFill(r, c) : cells[idx];
            if (!fill) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill="oklch(0.22 0.04 155)"
              />
            );
          }),
        )}
      </svg>
      <div className="text-[10px] font-mono text-center mt-1 text-muted-foreground tracking-wider">
        {value}
      </div>
    </div>
  );
}
