import { RequestSection, ResponseSection } from "@freestyle/ui";
export const Playground = () => {
  return (
    <>
      <RequestSection />

      <div className="px-4 border-t -mx-4 mt-2">
        <ResponseSection />
      </div>
    </>
  );
};
