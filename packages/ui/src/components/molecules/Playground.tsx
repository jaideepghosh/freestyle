import { RequestSection, ResponseSection } from "@freestyle/ui";
import { useState } from "react";
export const Playground = () => {
  const [requestUrl, setRequestUrl] = useState(
    "https://jsonplaceholder.typicode.com/posts"
  );
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestBody, setRequestBody] = useState(null);
  const [response, setResponse] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<
    "json" | "html" | "text" | null
  >(null);
  const [responseHeader, setResponseHeader] = useState<any>(null);

  const makeRequest = async () => {
    try {
      const res = await fetch(requestUrl, {
        method: "GET", // For simplicity, using GET. You can extend this to support other methods.
        headers: requestHeaders,
        body: requestBody,
      });
      console.log("res:: ", res);

      const contentType = res.headers.get("content-type");

      // Convert Headers object to a plain object
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      setResponseHeader(headersObj);

      console.log("contentType:: ", contentType);

      if (contentType?.includes("application/json")) {
        const data = await res.json();
        setResponse(data);
        setResponseType("json");
        return { type: "json", data };
      } else if (contentType?.includes("text/html")) {
        const html = await res.text();
        console.log("html:: ", html);

        setResponse(html);
        setResponseType("html");
        return { type: "html", data: html };
      } else {
        // fallback to text for other types like text/plain, XML, etc.
        const text = await res.text();
        console.log("text:: ", text);
        setResponse(text);
        setResponseType("text");
        return { type: "text", data: text };
      }

      const data = await res.json();
      console.log("data:: ", data);
      setResponse(data);
    } catch (error) {
      setResponse("Failed to fetch");
    }
  };
  return (
    <>
      <RequestSection
        requestUrl={requestUrl}
        setRequestUrl={setRequestUrl}
        requestHeaders={requestHeaders}
        setRequestHeaders={setRequestHeaders}
        requestBody={requestBody}
        setRequestBody={setRequestBody}
        makeRequest={makeRequest}
      />

      <div className="px-4 border-t -mx-4 mt-2">
        <ResponseSection
          response={response}
          responseType={responseType}
          responseHeader={responseHeader}
        />
      </div>
    </>
  );
};
