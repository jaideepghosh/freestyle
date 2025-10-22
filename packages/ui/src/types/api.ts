export interface RequestConfig {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers: Record<string, string>;
  body?: string | FormData;
  timeout?: number;
}

export interface ResponseData {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  responseTime: number;
}

export interface FormDataRow {
  id: string;
  key: string;
  value: string;
  type: "Text" | "File";
  description: string;
  enabled: boolean;
}

export interface RequestHeader {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

export interface QueryParam {
  id: string;
  key: string;
  value: string;
  description: string;
  enabled: boolean;
}

export type BodyType =
  | "none"
  | "form-data"
  | "x-www-form-urlencoded"
  | "raw"
  | "binary";

export type RawFormat = "JSON" | "XML" | "HTML" | "Text" | "JavaScript";

export interface RequestState {
  config: RequestConfig;
  headers: RequestHeader[];
  queryParams: QueryParam[];
  bodyType: BodyType;
  formData: FormDataRow[];
  rawContent: string;
  rawFormat: RawFormat;
  isLoading: boolean;
  error: string | null;
}

export interface RequestSectionProps {
  requestState: RequestState;
  onRequestStateChange: (updates: Partial<RequestState>) => void;
  onMakeRequest: () => Promise<void>;
  onSaveRequest?: () => void;
  onShareRequest?: () => void;
  className?: string;
  proxyService?: any;
  onProxyServiceChange?: (service: any) => void;
}

export interface RequestBodyConfigProps {
  bodyType: BodyType;
  formData: FormDataRow[];
  rawContent: string;
  rawFormat: RawFormat;
  onBodyTypeChange: (type: BodyType) => void;
  onFormDataChange: (formData: FormDataRow[]) => void;
  onRawContentChange: (content: string) => void;
  onRawFormatChange: (format: RawFormat) => void;
  className?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface RequestValidation {
  isValid: boolean;
  errors: ValidationError[];
}
