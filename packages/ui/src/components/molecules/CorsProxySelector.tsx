import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { CORSProxyService } from "../../utils/http";

interface CorsProxySelectorProps {
  value: CORSProxyService;
  onChange: (service: CORSProxyService) => void;
  className?: string;
}

const PROXY_SERVICE_DESCRIPTIONS = {
  [CORSProxyService.ALL_ORIGINS]: "AllOrigins (Free, reliable, GET only)",
  [CORSProxyService.CORS_PROXY]: "CORS Proxy (Free, fast, all methods)",
  [CORSProxyService.CORS_ANYWHERE]:
    "CORS Anywhere (Requires header, all methods)",
  [CORSProxyService.DIRECT]: "Direct (May fail with CORS)",
};

export const CorsProxySelector = ({
  value,
  onChange,
  className = "",
}: CorsProxySelectorProps) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground">Proxy:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-48 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PROXY_SERVICE_DESCRIPTIONS).map(
            ([service, description]) => (
              <SelectItem key={service} value={service} className="text-xs">
                {description}
              </SelectItem>
            )
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
