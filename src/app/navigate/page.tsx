import { Suspense } from "react";
import NavigateClient from "./NavigateClient";

export default function NavigatePage() {
  return (
    <Suspense>
      <NavigateClient />
    </Suspense>
  );
}
