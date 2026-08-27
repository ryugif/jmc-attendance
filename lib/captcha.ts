export type CaptchaData = {
    code: string;
    image: string;
};

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChar(): string {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

export function generateCaptcha(length = 5): CaptchaData {
    const code = Array.from({ length }, () => randomChar()).join("");

    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80" role="img" aria-label="Security captcha">
      <defs>
        <linearGradient id="captcha-bg" x1="0" x2="1">
          <stop offset="0%" stop-color="#f8fafc" />
          <stop offset="100%" stop-color="#e2e8f0" />
        </linearGradient>
      </defs>

      <rect width="240" height="80" fill="url(#captcha-bg)" rx="12" />

      <g fill="none" stroke="#94a3b8" stroke-width="1.5" opacity="0.55">
        <path d="M0 18 L240 18" />
        <path d="M0 38 L240 38" />
        <path d="M0 58 L240 58" />
      </g>

      <g stroke="#cbd5e1" stroke-width="2" opacity="0.9">
        <path d="M12 14 Q54 28 95 12" />
        <path d="M120 18 Q155 8 190 20" />
        <path d="M55 66 Q96 52 134 64" />
        <path d="M145 68 Q186 58 220 72" />
      </g>

      <g fill="#0f172a" font-family="monospace" font-size="30" font-weight="700">
        <text x="18" y="51" transform="rotate(-8 18 51)">${code[0]}</text>
        <text x="58" y="47" transform="rotate(8 58 47)">${code[1]}</text>
        <text x="98" y="52" transform="rotate(-6 98 52)">${code[2]}</text>
        <text x="138" y="46" transform="rotate(9 138 46)">${code[3]}</text>
        <text x="178" y="54" transform="rotate(-10 178 54)">${code[4]}</text>
      </g>
    </svg>
  `;

    return {
        code,
        image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    };
}

export function verifyCaptcha(input: string, expected: string): boolean {
    return input.trim().toLowerCase() === expected.trim().toLowerCase();
}
