import { describe, expect, it } from "vitest";

import { getLevelAtmosphere } from "@/lib/level-background";

describe("getLevelAtmosphere", () => {
  it("moves through distinct atmospheres as the player levels up", () => {
    expect(getLevelAtmosphere(1).id).toBe("launchpad");
    expect(getLevelAtmosphere(4).id).toBe("cloudline");
    expect(getLevelAtmosphere(7).id).toBe("sunrise");
    expect(getLevelAtmosphere(10).id).toBe("starlane");
    expect(getLevelAtmosphere(13).id).toBe("deep-space");
  });

  it("keeps out-of-range levels inside the supported atmosphere scale", () => {
    expect(getLevelAtmosphere(0).id).toBe("launchpad");
    expect(getLevelAtmosphere(-4).id).toBe("launchpad");
    expect(getLevelAtmosphere(99).id).toBe("deep-space");
  });
});
