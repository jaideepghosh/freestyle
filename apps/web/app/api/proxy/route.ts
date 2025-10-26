// Next.js App Router API route that proxies requests to arbitrary external URLs
// This avoids browser CORS by making requests server-side.

import type { NextRequest } from "next/server";

type ProxyRequestPayload = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  bodyType?: "raw" | "form-data" | "x-www-form-urlencoded" | "none";
  rawContent?: string | null;
  formData?: Array<{
    key: string;
    value: string;
    type?: string;
    enabled?: boolean;
  }>;
};

const HOP_BY_HOP_HEADER_NAMES = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
  "accept-encoding",
]);

function buildOutgoingHeaders(input?: Record<string, string>): Headers {
  const outgoing = new Headers();
  if (!input) return outgoing;
  for (const [key, value] of Object.entries(input)) {
    const lowerKey = key.toLowerCase();
    if (!HOP_BY_HOP_HEADER_NAMES.has(lowerKey)) {
      outgoing.set(key, value);
    }
  }
  // Ensure upstream returns identity (uncompressed) to avoid decoding mismatches
  outgoing.set("accept-encoding", "identity");
  return outgoing;
}

async function buildOutgoingBody(
  method: string,
  bodyType: ProxyRequestPayload["bodyType"],
  rawContent: ProxyRequestPayload["rawContent"],
  formFields: ProxyRequestPayload["formData"],
  headers: Headers
): Promise<BodyInit | undefined> {
  const methodUpper = method.toUpperCase();
  if (methodUpper === "GET" || methodUpper === "HEAD") return undefined;

  if (bodyType === "raw") {
    return typeof rawContent === "string" ? rawContent : undefined;
  }

  if (bodyType === "form-data") {
    const fd = new FormData();
    for (const field of formFields || []) {
      if (field.enabled === false) continue;
      if (!field.key) continue;
      fd.append(field.key, field.value ?? "");
    }
    // Let fetch set the multipart boundary
    headers.delete("content-type");
    return fd as unknown as BodyInit;
  }

  if (bodyType === "x-www-form-urlencoded") {
    const encoded = (formFields || [])
      .filter((f) => f.enabled !== false && f.key)
      .map(
        (f) =>
          `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value ?? "")}`
      )
      .join("&");
    headers.set("content-type", "application/x-www-form-urlencoded");
    return encoded;
  }

  return undefined;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ProxyRequestPayload;
    const {
      url,
      method,
      headers: inputHeaders,
      bodyType,
      rawContent,
      formData,
    } = payload;

    if (!url || !method) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: url and method" }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const outgoingHeaders = buildOutgoingHeaders(inputHeaders);
    const outgoingBody = await buildOutgoingBody(
      method,
      bodyType,
      rawContent,
      formData,
      outgoingHeaders
    );

    const upstreamResponse = await fetch(url, {
      method,
      headers: outgoingHeaders,
      body: outgoingBody,
      redirect: "manual",
    });

    // Forward response body and headers, but strip encoding headers that no longer apply
    const responseHeaders = new Headers();
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!HOP_BY_HOP_HEADER_NAMES.has(lower) && lower !== "content-encoding") {
        responseHeaders.set(key, value);
      }
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}
