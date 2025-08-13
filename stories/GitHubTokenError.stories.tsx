import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";

import GitHubTokenError from "../app/components/GitHubTokenError";

const meta = {
  title: "Components/GitHubTokenError",
  component: GitHubTokenError,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Error component displayed when GitHub token is missing or invalid. Provides setup instructions and optional retry functionality.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onRetry: {
      action: "retry clicked",
      description:
        "Callback function triggered when the retry button is clicked",
    },
  },
} satisfies Meta<typeof GitHubTokenError>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story showing the error state
export const Default: Story = {
  args: {},
};

// Story with retry functionality
export const WithRetryButton: Story = {
  args: {
    onRetry: () => console.log("Retry clicked"),
  },
};

// Interactive story testing the retry button
export const RetryInteraction: Story = {
  args: {
    onRetry: () => console.log("Retry clicked"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the main error message is displayed
    await expect(
      canvas.getByRole("heading", { name: "Missing GitHub Token" }),
    ).toBeInTheDocument();

    // Verify setup instructions are shown
    await expect(canvas.getByText("Setup Instructions:")).toBeInTheDocument();

    // Find and click the retry button
    const retryButton = canvas.getByRole("button", { name: "Check Again" });
    await expect(retryButton).toBeInTheDocument();

    // Click the button
    await userEvent.click(retryButton);

    // Verify the callback was called (this will be visible in the Actions panel)
    // The actual verification happens through Storybook's action addon
  },
};

// Story demonstrating the component without retry option
export const NoRetryOption: Story = {
  args: {
    onRetry: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the main error message is displayed
    await expect(
      canvas.getByRole("heading", { name: "Missing GitHub Token" }),
    ).toBeInTheDocument();

    // Verify that no retry button is present
    const retryButton = canvas.queryByRole("button", { name: "Check Again" });
    await expect(retryButton).not.toBeInTheDocument();
  },
};

// Story demonstrating all the instructional content
export const VerifyInstructions: Story = {
  args: {
    onRetry: () => console.log("Retry clicked"),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all instruction steps are present
    await expect(
      canvas.getByText(
        /GitHub Settings → Developer settings → Personal access tokens/,
      ),
    ).toBeInTheDocument();

    await expect(
      canvas.getByText("Create a new token with repo permissions"),
    ).toBeInTheDocument();

    await expect(
      canvas.getByText("Set the environment variable:"),
    ).toBeInTheDocument();

    // Verify the code snippet is shown
    await expect(
      canvas.getByText("GITHUB_TOKEN=your_token_here"),
    ).toBeInTheDocument();

    // Verify helper text
    await expect(
      canvas.getByText(
        "Add this to your .env.local file or environment variables",
      ),
    ).toBeInTheDocument();

    await expect(
      canvas.getByText(
        "Restart your development server after setting the token",
      ),
    ).toBeInTheDocument();
  },
};

// Story for mobile viewport
export const MobileView: Story = {
  args: {
    onRetry: () => console.log("Retry clicked"),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// Story for dark mode (if your app supports it)
export const DarkMode: Story = {
  args: {
    onRetry: () => console.log("Retry clicked"),
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};
