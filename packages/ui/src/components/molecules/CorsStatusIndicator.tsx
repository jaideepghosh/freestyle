import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { isCrossOrigin } from "../../utils/http";

interface CorsStatusIndicatorProps {
  url: string;
  className?: string;
}

export const CorsStatusIndicator = ({
  url,
  className = "",
}: CorsStatusIndicatorProps) => {
  const [isCrossOriginUrl, setIsCrossOriginUrl] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (url) {
      setIsCrossOriginUrl(isCrossOrigin(url));
    }
  }, [url]);

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isClient || !url) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-muted-foreground">CORS:</span>
      <Badge
        variant={isCrossOriginUrl ? "secondary" : "default"}
        className="text-xs"
      >
        {isCrossOriginUrl ? "Cross-Origin (Proxied)" : "Same-Origin"}
      </Badge>
    </div>
  );
};
