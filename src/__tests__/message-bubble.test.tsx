import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { MessageBubble } from "@/components/chat/message-bubble";
import type { Message } from "@/types/chat";

type MockMotionProps<T extends HTMLElement> = HTMLAttributes<T> & {
  initial?: Record<string, number>;
  animate?: Record<string, number>;
  exit?: Record<string, number>;
  transition?: Record<string, unknown>;
};

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: MockMotionProps<HTMLDivElement>): React.JSX.Element => <div {...rest}>{children}</div>,
    span: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: MockMotionProps<HTMLSpanElement>): React.JSX.Element => <span {...rest}>{children}</span>,
  },
  AnimatePresence: ({
    children,
    mode: _m,
  }: {
    children?: ReactNode;
    mode?: string;
  }): React.JSX.Element => <>{children}</>,
}));

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: "test-id",
    senderId: "me",
    text: "Hello, world!",
    timestamp: new Date("2024-01-15T12:00:00"),
    status: "sent",
    ...overrides,
  };
}

describe("MessageBubble", () => {
  it("renders the message text", () => {
    render(<MessageBubble message={makeMessage()} currentUserId="me" />);
    expect(screen.getByText("Hello, world!")).toBeInTheDocument();
  });

  it("renders the formatted timestamp", () => {
    render(<MessageBubble message={makeMessage()} currentUserId="me" />);
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
  });

  it("shows 'Sent' status label for own messages with sent status", () => {
    render(<MessageBubble message={makeMessage({ status: "sent" })} currentUserId="me" />);
    expect(screen.getByLabelText("Sent")).toBeInTheDocument();
  });

  it("shows 'Sending…' status label for own messages with sending status", () => {
    render(<MessageBubble message={makeMessage({ status: "sending" })} currentUserId="me" />);
    expect(screen.getByLabelText("Sending…")).toBeInTheDocument();
  });

  it("shows 'Failed' status label for own messages with failed status", () => {
    render(<MessageBubble message={makeMessage({ status: "failed" })} currentUserId="me" />);
    expect(screen.getByLabelText("Failed")).toBeInTheDocument();
  });

  it("does not show status icon for messages from another user", () => {
    render(<MessageBubble message={makeMessage({ senderId: "other-user" })} currentUserId="me" />);
    expect(screen.queryByLabelText("Sent")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Sending…")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Failed")).not.toBeInTheDocument();
  });

  it("applies own-message layout when sender matches currentUserId", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ senderId: "me" })} currentUserId="me" />,
    );
    expect(container.firstChild).toHaveClass("justify-end");
  });

  it("applies other-message layout when sender does not match", () => {
    const { container } = render(
      <MessageBubble message={makeMessage({ senderId: "alice" })} currentUserId="me" />,
    );
    expect(container.firstChild).toHaveClass("justify-start");
  });
});
