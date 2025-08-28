import "dotenv/config";
import { expect } from "@playwright/test";
import OpenAI from "openai";

/**
 * Custom matcher to grade translation similarity using OpenAI's chat completion.
 * Usage:
 *   expect(receivedSnapshot).toMatchLocalisation(expectedSnapshot, threshold);
 * where threshold is a number between 0 and 100, default 50.
 */

// Augment the global expect type with our matcher
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace PlaywrightTest {
    interface Matchers<R, T = unknown> {
      toMatchLocalisation(expected: string, threshold?: number): Promise<R>;
    }
  }
}

expect.extend({
  async toMatchLocalisation(
    received: string,
    expected: string,
    threshold: number = 50,
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in environment");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a translation grading assistant. Your job is to evaluate how closely two ARIA snapshots correspond as translations. The ARIA snapshots represent localized UI states.",
      },
      {
        role: "user" as const,
        content: `Snapshot A:\n${received}\n\nSnapshot B:\n${expected}\n\nProvide an integer score from 0 (no relation) to 100 (perfect translation) indicating how well Snapshot A translates to Snapshot B. Reply with ONLY the integer score.`,
      },
    ];

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.0,
      });

      const content = response.choices?.[0]?.message?.content?.trim();

      if (!content) {
        return {
          pass: false,
          message: () =>
            "OpenAI returned an empty response for translation grading.",
        };
      }

      // Parse the score as a standalone integer from the response
      const scoreMatch = content.match(/\b(\d{1,3})\b/);
      let score = 0;
      if (scoreMatch) {
        score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
      } else {
        return {
          pass: false,
          message: () =>
            `Could not parse a valid score from OpenAI response: "${content}"`,
        };
      }

      const pass = score >= threshold;

      return {
        pass,
        message: () =>
          pass
            ? `Expected translation similarity score to be less than ${threshold}, but got ${score}`
            : `Expected translation similarity score to be at least ${threshold}, but got ${score}`,
      };
    } catch (error: any) {
      return {
        pass: false,
        message: () =>
          `OpenAI API request failed: ${
            error?.message ||
            (typeof error === "string" ? error : JSON.stringify(error))
          }`,
      };
    }
  },
});
