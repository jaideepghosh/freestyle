import {
  SendHorizonal,
  SaveIcon,
  Share,
  MoreHorizontal,
  PlusIcon,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@freestyle/ui";
import RequestBodyConfig from "./RequestBodyConfig";

export const RequestSection = ({
  requestUrl,
  setRequestUrl,
  requestHeaders,
  setRequestHeaders,
  requestBody,
  setRequestBody,
  makeRequest,
}: any) => {
  return (
    <div className="min-h-[300px]">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Select defaultValue="get">
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="get">GET</SelectItem>
              <SelectItem value="post">POST</SelectItem>
              <SelectItem value="put">PUT</SelectItem>
              <SelectItem value="patch">PATCH</SelectItem>
              <SelectItem value="delete">DELETE</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter URL or paste text"
            className="flex-1"
            value={requestUrl}
            onChange={(e) => setRequestUrl(e.target.value)}
          />
          <Button onClick={makeRequest}>
            Send
            <SendHorizonal className="h-4 w-4" />
          </Button>
          <Button variant="secondary">
            <SaveIcon className="h-4 w-4" />
          </Button>
          <Button variant="secondary">
            <Share className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="params" className="flex flex-col">
        <div className="flex items-center border-b px-4 -mx-4">
          <TabsList className="h-10 p-0 bg-transparent">
            <TabsTrigger value="params">Params</TabsTrigger>

            <TabsTrigger value="headers">
              Headers <span className="text-muted-foreground ml-1">(7)</span>
            </TabsTrigger>
            <TabsTrigger value="body">Body</TabsTrigger>
          </TabsList>
          <div className="flex-1"></div>
          <Button variant="link" size="sm" className="text-blue-600">
            Cookies
          </Button>
        </div>

        <TabsContent value="params" className="flex-1 px-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Query Params</h3>
            <div className="border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-4 ml-1 mt-1">Key</div>
                <div className="col-span-4 ml-1 mt-1">Value</div>
                <div className="col-span-3 ml-1 mt-1">Description</div>
                <div className="col-span-1 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b">
                <Input placeholder="Key" className="col-span-4 h-8" />
                <Input placeholder="Value" className="col-span-4 h-8" />
                <Input placeholder="Description" className="col-span-4 h-8" />
              </div>
              <div className="flex justify-center py-2">
                <Button size="sm" variant="secondary">
                  <PlusIcon />
                  Add more
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 px-4">
          <div>
            <h3 className="text-sm font-medium mb-3">Headers</h3>
            <div className="border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-4 ml-1 mt-1">Key</div>
                <div className="col-span-4 ml-1 mt-1">Value</div>
                <div className="col-span-3 ml-1 mt-1">Description</div>
                <div className="col-span-1 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b">
                <Input placeholder="Key" className="col-span-4 h-8" />
                <Input placeholder="Value" className="col-span-4 h-8" />
                <Input placeholder="Description" className="col-span-4 h-8" />
              </div>
              <div className="flex justify-center py-2">
                <Button size="sm" variant="secondary">
                  <PlusIcon />
                  Add more
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="body" className="flex-1 px-4">
          <RequestBodyConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};
