import { describe } from "jest";
import { env } from "@/config/env"
import { createContainer } from "@/createContainer"

describe("Rafiki Service", async () => {
  const bindings = createContainer(env);
  const rafikiService = await bindings.resolve("rafikiService")
  it("Should...", async () => {
    rafikiService.onWebHook();
  })

})