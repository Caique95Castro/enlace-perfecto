/**
 * Cliente Open-Meteo (gratuito, sem chave). Puro: sem segredos nem acesso a browser,
 * então pode ser importado tanto pela função de servidor quanto por testes.
 */

export type WeatherResult =
  | {
      ok: true;
      kind: "forecast" | "climate";
      date: string;
      tempMin: number;
      tempMax: number;
      rainChance: number | null;
      code: number;
      label: string;
      tip: string;
      place: string | null;
    }
  | { ok: false; reason: "no_location" | "no_date" | "unavailable" };

type Input = { date: string; address?: string; latitude?: number; longitude?: number };

const WMO: Record<number, { label: string; tip: string }> = {
  0: { label: "Céu limpo", tip: "Dia ensolarado — vale levar óculos de sol." },
  1: { label: "Predominantemente limpo", tip: "Tempo firme, ótimo para fotos ao ar livre." },
  2: { label: "Parcialmente nublado", tip: "Algumas nuvens, mas sem sustos." },
  3: { label: "Nublado", tip: "Céu encoberto — luz suave para as fotos." },
  45: { label: "Névoa", tip: "Neblina possível; saia com um pouco de antecedência." },
  48: { label: "Névoa com geada", tip: "Manhã fria e enevoada." },
  51: { label: "Garoa fraca", tip: "Um guarda-chuva pequeno não faz mal." },
  53: { label: "Garoa", tip: "Leve um guarda-chuva por precaução." },
  55: { label: "Garoa forte", tip: "Prefira sapatos que aguentem umidade." },
  61: { label: "Chuva fraca", tip: "Leve guarda-chuva e chegue um pouco antes." },
  63: { label: "Chuva", tip: "Guarda-chuva indispensável." },
  65: { label: "Chuva forte", tip: "Reserve um tempo extra para o trajeto." },
  80: { label: "Pancadas de chuva", tip: "Pancadas rápidas — tenha um guarda-chuva à mão." },
  81: { label: "Pancadas moderadas", tip: "Chuva passageira, mas leve guarda-chuva." },
  82: { label: "Pancadas fortes", tip: "Tempo instável; planeje o deslocamento." },
  95: { label: "Trovoadas", tip: "Possíveis tempestades — evite atrasos." },
  96: { label: "Trovoadas com granizo", tip: "Tempo severo; fique atento aos avisos." },
  99: { label: "Trovoadas com granizo forte", tip: "Tempo severo; fique atento aos avisos." },
};

function describe(code: number) {
  return WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? { label: "Tempo variável", tip: "Fique de olho na previsão perto da data." };
}

async function geocode(address: string): Promise<{ lat: number; lon: number; name: string } | null> {
  // Tenta o endereço completo e, se não achar, apenas as últimas partes (cidade/estado).
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const attempts = [address, parts.slice(-2).join(", "), parts.slice(-1).join(", ")].filter(
    (v, i, a) => v && a.indexOf(v) === i,
  );
  for (const q of attempts) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=pt&format=json`;
    const res = await fetch(url);
    if (!res.ok) continue;
    const json = (await res.json()) as {
      results?: { latitude: number; longitude: number; name: string; admin1?: string }[];
    };
    const hit = json.results?.[0];
    if (hit) {
      return {
        lat: hit.latitude,
        lon: hit.longitude,
        name: [hit.name, hit.admin1].filter(Boolean).join(", "),
      };
    }
  }
  return null;
}

function daysUntil(date: string): number {
  const target = new Date(`${date}T12:00:00Z`).getTime();
  const today = new Date();
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12);
  return Math.round((target - now) / 86_400_000);
}

export async function fetchWeatherForDate(input: Input): Promise<WeatherResult> {
  if (!input.date) return { ok: false, reason: "no_date" };

  let lat = input.latitude;
  let lon = input.longitude;
  let place: string | null = null;
  if ((lat == null || lon == null) && input.address) {
    const geo = await geocode(input.address).catch(() => null);
    if (geo) {
      lat = geo.lat;
      lon = geo.lon;
      place = geo.name;
    }
  }
  if (lat == null || lon == null) return { ok: false, reason: "no_location" };

  const diff = daysUntil(input.date);

  try {
    if (diff >= 0 && diff <= 15) {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
        `&timezone=auto&start_date=${input.date}&end_date=${input.date}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("forecast");
      const json = (await res.json()) as {
        daily: {
          weather_code: number[];
          temperature_2m_max: number[];
          temperature_2m_min: number[];
          precipitation_probability_max: (number | null)[];
        };
      };
      const code = json.daily.weather_code[0] ?? 0;
      const d = describe(code);
      return {
        ok: true,
        kind: "forecast",
        date: input.date,
        tempMin: Math.round(json.daily.temperature_2m_min[0] ?? 0),
        tempMax: Math.round(json.daily.temperature_2m_max[0] ?? 0),
        rainChance: json.daily.precipitation_probability_max[0] ?? null,
        code,
        label: d.label,
        tip: d.tip,
        place,
      };
    }

    // Fora da janela de previsão: média histórica dos últimos anos para a mesma data.
    const [, mm, dd] = input.date.split("-");
    const thisYear = new Date().getUTCFullYear();
    const years = [thisYear - 1, thisYear - 2, thisYear - 3];
    const samples = await Promise.all(
      years.map(async (y) => {
        const day = `${y}-${mm}-${dd}`;
        const url =
          `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
          `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
          `&timezone=auto&start_date=${day}&end_date=${day}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = (await res.json()) as {
          daily: {
            weather_code: (number | null)[];
            temperature_2m_max: (number | null)[];
            temperature_2m_min: (number | null)[];
            precipitation_sum: (number | null)[];
          };
        };
        const max = json.daily.temperature_2m_max[0];
        const min = json.daily.temperature_2m_min[0];
        if (max == null || min == null) return null;
        return {
          max,
          min,
          rain: (json.daily.precipitation_sum[0] ?? 0) > 1,
          code: json.daily.weather_code[0] ?? 0,
        };
      }),
    );
    const valid = samples.filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (valid.length === 0) return { ok: false, reason: "unavailable" };
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const rainy = valid.filter((s) => s.rain).length;
    const rainChance = Math.round((rainy / valid.length) * 100);
    const code = rainChance >= 50 ? 61 : rainChance > 0 ? 2 : 0;
    const d = describe(code);
    return {
      ok: true,
      kind: "climate",
      date: input.date,
      tempMin: Math.round(avg(valid.map((s) => s.min))),
      tempMax: Math.round(avg(valid.map((s) => s.max))),
      rainChance,
      code,
      label: d.label,
      tip: d.tip,
      place,
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
