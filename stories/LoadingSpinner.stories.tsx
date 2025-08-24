import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "storybook/test";
import LoadingSpinner from "../app/components/LoadingSpinner";

const meta = {
  title: "Components/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A versatile loading spinner component with customizable size, text, and display modes. Can be used as a full-screen loader or inline within other components.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    text: {
      control: "text",
      description: "The text to display below the spinner",
      defaultValue: "Loading...",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "The size of the spinner",
      defaultValue: "md",
    },
    fullScreen: {
      control: "boolean",
      description: "Whether to show the component in full screen mode",
      defaultValue: true,
    },
    className: {
      control: "text",
      description: "Additional CSS classes to apply to the container",
    },
  },
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default full-screen loading state
export const Default: Story = {
  args: {},
};

// Small size spinner
export const SmallSize: Story = {
  args: {
    size: "sm",
    text: "Loading...",
  },
};

// Medium size spinner (default)
export const MediumSize: Story = {
  args: {
    size: "md",
    text: "Loading...",
  },
};

// Large size spinner
export const LargeSize: Story = {
  args: {
    size: "lg",
    text: "Loading...",
  },
};

// Custom loading text
export const CustomText: Story = {
  args: {
    text: "Please wait while we fetch your data...",
  },
};

// Inline mode (not full screen)
export const InlineMode: Story = {
  args: {
    fullScreen: false,
    text: "Loading content...",
  },
  decorators: [
    (Story) => (
      <div className="p-8 bg-gray-100 min-h-screen">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Card Title</h2>
          <p className="mb-4">Some content above the loader</p>
          <div className="border border-gray-200 rounded p-4">
            <Story />
          </div>
          <p className="mt-4">Some content below the loader</p>
        </div>
      </div>
    ),
  ],
};

// Multiple inline spinners with different sizes
export const SizeComparison: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Loading Spinner Sizes</h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Small</h3>
            <LoadingSpinner size="sm" fullScreen={false} text="Small spinner" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Medium</h3>
            <LoadingSpinner
              size="md"
              fullScreen={false}
              text="Medium spinner"
            />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Large</h3>
            <LoadingSpinner size="lg" fullScreen={false} text="Large spinner" />
          </div>
        </div>
      </div>
    </div>
  ),
};

// Loading state with no text
export const NoText: Story = {
  args: {
    text: "",
  },
};

// Interactive test for accessibility
export const AccessibilityTest: Story = {
  args: {
    text: "Loading your projects...",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check for the spinner element with proper ARIA attributes
    const spinner = canvas.getByRole("status", { name: "Loading" });
    await expect(spinner).toBeInTheDocument();
    await expect(spinner).toHaveClass("animate-spin");

    // Check for the loading text
    await expect(
      canvas.getByText("Loading your projects..."),
    ).toBeInTheDocument();
  },
};

// Test different text variations
export const TextVariations: Story = {
  render: () => (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <LoadingSpinner
            size="md"
            fullScreen={false}
            text="Fetching data..."
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <LoadingSpinner
            size="md"
            fullScreen={false}
            text="Processing request..."
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <LoadingSpinner size="md" fullScreen={false} text="Almost there..." />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <LoadingSpinner
            size="md"
            fullScreen={false}
            text="Connecting to server..."
          />
        </div>
      </div>
    </div>
  ),
};

// Mobile view
export const MobileView: Story = {
  args: {
    text: "Loading...",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

// Dark mode variant (if supported)
export const DarkMode: Story = {
  args: {
    text: "Loading in dark mode...",
    fullScreen: false,
  },
  decorators: [
    (Story) => (
      <div className="dark bg-gray-900 p-8 min-h-screen">
        <div className="max-w-md mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};

// Custom styled spinner
export const CustomStyling: Story = {
  args: {
    text: "Custom styled loader",
    fullScreen: false,
    className: "bg-purple-50 p-8 rounded-xl",
  },
  decorators: [
    (Story) => (
      <div className="p-8 min-h-screen bg-gray-100">
        <div className="max-w-md mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};
