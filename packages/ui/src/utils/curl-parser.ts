interface ParsedCurl {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string | null;
}

export function cURLParser(curlCommand: string): ParsedCurl {
  // Normalize line breaks and multiple spaces
  let cmd = curlCommand
    .replace(/\\\r?\n/g, " ") // Handle line continuations
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .replace(/^curl\s+/i, "");

  const result: ParsedCurl = {
    method: "GET",
    url: "",
    headers: {},
    queryParams: {},
    body: null,
  };

  const tokens = tokenizeCurl(cmd);
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (typeof token === "undefined") {
      break;
    }

    if (token === "-X" || token === "--request") {
      if (i + 1 < tokens.length) {
        const nextToken = tokens[++i];
        if (typeof nextToken === "string") {
          result.method = nextToken.toUpperCase();
        }
      }
      i++;
    } else if (token === "-H" || token === "--header") {
      const header = i + 1 < tokens.length ? tokens[++i] : undefined;
      if (typeof header === "string") {
        const colonIndex = header.indexOf(":");
        if (colonIndex > -1) {
          const key = header.substring(0, colonIndex).trim();
          const value = header.substring(colonIndex + 1).trim();
          result.headers[key] = value;
        }
      }
      i++;
    } else if (token === "-b" || token === "--cookie") {
      // Parse cookies into Cookie header
      const cookieValue = i + 1 < tokens.length ? tokens[++i] : undefined;
      if (typeof cookieValue === "string" && cookieValue) {
        if (result.headers["Cookie"]) {
          result.headers["Cookie"] += "; " + cookieValue;
        } else {
          result.headers["Cookie"] = cookieValue;
        }
      }
      i++;
    } else if (
      token === "-d" ||
      token === "--data" ||
      token === "--data-raw" ||
      token === "--data-binary"
    ) {
      const dataValue = i + 1 < tokens.length ? tokens[++i] : undefined;
      if (typeof dataValue === "string") {
        result.body = dataValue;
        if (result.method === "GET") {
          result.method = "POST";
        }
      }
      i++;
    } else if (
      token === "--compressed" ||
      token === "-L" ||
      token === "--location" ||
      token === "-k" ||
      token === "--insecure"
    ) {
      i++;
    } else if (token === "-u" || token === "--user") {
      i = Math.min(i + 2, tokens.length);
    } else if (typeof token === "string" && token.startsWith("-")) {
      // Unknown flag, skip it and its potential value
      i++;
      if (i < tokens.length) {
        const potentialValue = tokens[i];
        if (
          typeof potentialValue === "string" &&
          !potentialValue.startsWith("-")
        ) {
          i++;
        }
      }
    } else {
      // This is the URL
      result.url = token;
      i++;
    }
  }

  // Parse query parameters from URL
  const urlParts = result.url.split("?");
  if (urlParts.length > 1) {
    result.url = urlParts[0] ?? "";
    const queryString = urlParts.slice(1).join("?");
    const params = new URLSearchParams(queryString);
    params.forEach((value, key) => {
      result.queryParams[key] = value;
    });
  }

  return result;
}

function tokenizeCurl(cmd: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;
  let escaped = false;

  for (let i = 0; i < cmd.length; i++) {
    const char = cmd[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if ((char === '"' || char === "'") && !inQuote) {
      inQuote = char;
      continue;
    }

    if (char === inQuote) {
      inQuote = null;
      continue;
    }

    if (char === " " && !inQuote) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}
