import { describe, expect, it, vi } from "vitest";

import { sumLeadActions } from "../../src/utils/facebook-lead-actions.util";

describe("sumLeadActions", () => {
  it("devolve 0 quando não há actions", () => {
    expect(sumLeadActions(undefined)).toBe(0);
    expect(sumLeadActions([])).toBe(0);
  });

  it("soma somente os action_types da whitelist de leads", () => {
    const total = sumLeadActions([
      { action_type: "lead", value: "2" },
      { action_type: "onsite_conversion.lead_grouped", value: "3" },
      { action_type: "offsite_conversion.fb_pixel_lead", value: "1" },
      { action_type: "link_click", value: "50" },
      { action_type: "post_engagement", value: "10" },
    ]);

    expect(total).toBe(6);
  });

  it("ignora valores não numéricos sem lançar erro", () => {
    const total = sumLeadActions([
      { action_type: "lead", value: "not-a-number" },
      { action_type: "lead", value: "4" },
    ]);

    expect(total).toBe(4);
  });
});

describe("logUnrecognizedActionTypes", () => {
  it("loga só os action_types fora da whitelist, uma vez por chamada", async () => {
    vi.resetModules();
    const infoSpy = vi.fn();
    vi.doMock("firebase-functions", () => ({ logger: { info: infoSpy } }));

    const { logUnrecognizedActionTypes } = await import(
      "../../src/utils/facebook-lead-actions.util"
    );

    logUnrecognizedActionTypes(
      [
        { action_type: "lead", value: "1" },
        { action_type: "video_view", value: "20" },
      ],
      { companyId: "c1", campaignId: "camp1" },
    );

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      expect.stringContaining("action_types não reconhecidos"),
      expect.objectContaining({
        companyId: "c1",
        campaignId: "camp1",
        unrecognized: ["video_view"],
      }),
    );

    vi.doUnmock("firebase-functions");
  });

  it("não loga nada quando todos os action_types são conhecidos", async () => {
    vi.resetModules();
    const infoSpy = vi.fn();
    vi.doMock("firebase-functions", () => ({ logger: { info: infoSpy } }));

    const { logUnrecognizedActionTypes } = await import(
      "../../src/utils/facebook-lead-actions.util"
    );

    logUnrecognizedActionTypes([{ action_type: "lead", value: "1" }], {
      companyId: "c1",
      campaignId: "camp1",
    });

    expect(infoSpy).not.toHaveBeenCalled();

    vi.doUnmock("firebase-functions");
  });
});
