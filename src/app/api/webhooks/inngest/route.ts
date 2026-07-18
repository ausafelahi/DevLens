import { serve } from "inngest/next";
import { inngest } from "@/infrastructure/queue/InngestClient";
import { indexRepositoryJob } from "../../../../../inngest/indexRepositoryJob";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [indexRepositoryJob],
});
