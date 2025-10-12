import { ChevronDown, History } from "lucide-react";
import { Button } from "@freestyle/ui";

export const ResponseSection = () => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium">Response</h3>
        <Button variant="ghost" size="sm" className="h-8">
          <History className="h-4 w-4" />
          History
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">
          Enter the URL and click Send to get a response
        </p>
      </div>
    </div>
  );
};
