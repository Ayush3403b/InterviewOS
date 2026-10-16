import { describe, expect, it } from "vitest";

import { PasswordPolicy } from "../../modules/users/domain/PasswordPolicy";

describe("PasswordPolicy", () => {

  it("accepts a strong password", () => {

    expect(
      PasswordPolicy.validate(
        "Password@123"
      )
    ).toBe(true);

  });

  it("rejects a short password", () => {

    expect(
      PasswordPolicy.validate(
        "Ab1@"
      )
    ).toBe(false);

  });

  it("rejects password without uppercase", () => {

    expect(
      PasswordPolicy.validate(
        "password@123"
      )
    ).toBe(false);

  });

  it("rejects password without lowercase", () => {

    expect(
      PasswordPolicy.validate(
        "PASSWORD@123"
      )
    ).toBe(false);

  });

  it("rejects password without number", () => {

    expect(
      PasswordPolicy.validate(
        "Password@"
      )
    ).toBe(false);

  });

  it("rejects password without special character", () => {

    expect(
      PasswordPolicy.validate(
        "Password123"
      )
    ).toBe(false);

  });

});