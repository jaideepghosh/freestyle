import { useState, useCallback, useMemo } from "react";
import {
  RequestState,
  RequestConfig,
  FormDataRow,
  RequestHeader,
  QueryParam,
} from "../types/api";
import { validateRequest } from "../utils/validation";

const initialRequestState: RequestState = {
  config: {
    url: "",
    method: "GET",
    headers: {},
    timeout: 30000,
  },
  headers: [],
  queryParams: [],
  bodyType: "none",
  formData: [],
  rawContent: "",
  rawFormat: "JSON",
  isLoading: false,
  error: null,
};

export const useRequestState = (initialState?: Partial<RequestState>) => {
  const [state, setState] = useState<RequestState>({
    ...initialRequestState,
    ...initialState,
  });

  const updateState = useCallback((updates: Partial<RequestState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateConfig = useCallback((configUpdates: Partial<RequestConfig>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...configUpdates },
    }));
  }, []);

  const addHeader = useCallback(() => {
    const newHeader: RequestHeader = {
      id: `header-${Date.now()}`,
      key: "",
      value: "",
      description: "",
      enabled: true,
    };
    setState((prev) => ({
      ...prev,
      headers: [...prev.headers, newHeader],
    }));
  }, []);

  const updateHeader = useCallback(
    (id: string, updates: Partial<RequestHeader>) => {
      setState((prev) => ({
        ...prev,
        headers: prev.headers.map((header) =>
          header.id === id ? { ...header, ...updates } : header
        ),
      }));
    },
    []
  );

  const removeHeader = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      headers: prev.headers.filter((header) => header.id !== id),
    }));
  }, []);

  const addQueryParam = useCallback(() => {
    const newParam: QueryParam = {
      id: `param-${Date.now()}`,
      key: "",
      value: "",
      description: "",
      enabled: true,
    };
    setState((prev) => ({
      ...prev,
      queryParams: [...prev.queryParams, newParam],
    }));
  }, []);

  const updateQueryParam = useCallback(
    (id: string, updates: Partial<QueryParam>) => {
      setState((prev) => ({
        ...prev,
        queryParams: prev.queryParams.map((param) =>
          param.id === id ? { ...param, ...updates } : param
        ),
      }));
    },
    []
  );

  const removeQueryParam = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      queryParams: prev.queryParams.filter((param) => param.id !== id),
    }));
  }, []);

  const addFormDataRow = useCallback(() => {
    const newRow: FormDataRow = {
      id: `form-${Date.now()}`,
      key: "",
      value: "",
      type: "Text",
      description: "",
      enabled: true,
    };
    setState((prev) => ({
      ...prev,
      formData: [...prev.formData, newRow],
    }));
  }, []);

  const updateFormDataRow = useCallback(
    (id: string, updates: Partial<FormDataRow>) => {
      setState((prev) => ({
        ...prev,
        formData: prev.formData.map((row) =>
          row.id === id ? { ...row, ...updates } : row
        ),
      }));
    },
    []
  );

  const removeFormDataRow = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      formData: prev.formData.filter((row) => row.id !== id),
    }));
  }, []);

  const validation = useMemo(() => {
    const headersObj = state.headers
      .filter((h) => h.enabled && h.key.trim())
      .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

    const configWithHeaders = {
      ...state.config,
      headers: headersObj,
    };

    return validateRequest(configWithHeaders);
  }, [state.config, state.headers]);

  const resetState = useCallback(() => {
    setState(initialRequestState);
  }, []);

  return {
    state,
    updateState,
    updateConfig,
    addHeader,
    updateHeader,
    removeHeader,
    addQueryParam,
    updateQueryParam,
    removeQueryParam,
    addFormDataRow,
    updateFormDataRow,
    removeFormDataRow,
    validation,
    resetState,
  };
};
