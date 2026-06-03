import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "@/components/chat/message-input";

describe("MessageInput", () => {
  it("renders the textarea with correct placeholder", () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText("Write a message...")).toBeInTheDocument();
  });

  it("renders the send button", () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByLabelText("Send message")).toBeInTheDocument();
  });

  it("calls onSend with trimmed text when send button is clicked", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Write a message..."), "  hello  ");
    await user.click(screen.getByLabelText("Send message"));

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("calls onSend when Enter is pressed (without Shift)", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Write a message..."), "hello");
    await user.keyboard("{Enter}");

    expect(onSend).toHaveBeenCalledOnce();
    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("does not call onSend for empty input on button click", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    await user.click(screen.getByLabelText("Send message"));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("clears the textarea after sending", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} />);
    const textarea = screen.getByPlaceholderText("Write a message...");

    await user.type(textarea, "hello");
    await user.click(screen.getByLabelText("Send message"));

    expect(textarea).toHaveValue("");
  });

  it("disables the textarea when the disabled prop is true", () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByPlaceholderText("Write a message...")).toBeDisabled();
  });

  it("disables the send button when the disabled prop is true", () => {
    render(<MessageInput onSend={vi.fn()} disabled />);
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("send button is disabled when input is empty", () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByLabelText("Send message")).toBeDisabled();
  });

  it("send button becomes enabled after typing text", async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} />);

    expect(screen.getByLabelText("Send message")).toBeDisabled();
    await user.type(screen.getByPlaceholderText("Write a message..."), "hi");
    expect(screen.getByLabelText("Send message")).not.toBeDisabled();
  });
});
