"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Card } from "./ui/card";
import { useTranslation } from "./I18nProvider";
import {
  Send,
  Loader2,
  User,
  Bot,
  Copy,
  Check,
  Trash2,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  timestamp: Date;
}

// Helper to parse thinking tags from content
function parseThinkingContent(content: string): {
  thinking: string;
  response: string;
} {
  // Match <think>...</think> tags (DeepSeek-R1 style)
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/i);

  if (thinkMatch) {
    const thinking = thinkMatch[1].trim();
    const response = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    return { thinking, response };
  }

  // Also try matching <thinking>...</thinking> tags
  const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);

  if (thinkingMatch) {
    const thinking = thinkingMatch[1].trim();
    const response = content
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
      .trim();
    return { thinking, response };
  }

  return { thinking: "", response: content };
}

// Component to display thinking content
function ThinkingBlock({
  thinking,
  isStreaming,
}: {
  thinking: string;
  isStreaming?: boolean;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!thinking && !isStreaming) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mb-3"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors mb-2 font-mono"
      >
        <Brain className="w-3 h-3" />
        <span>{t("chat.thinkingProcess") || "Thinking Process"}</span>
        {isExpanded ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs font-mono text-purple-300/80 whitespace-pre-wrap overflow-x-auto"
          >
            {thinking || (
              <span className="flex items-center gap-2 text-purple-400/60">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("chat.reasoning") || "Reasoning..."}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ChatInterfaceProps {
  modelName: string;
}

export function ChatInterface({ modelName }: ChatInterfaceProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([]);
    toast.success(t("chat.cleared") || "Chat cleared");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      thinking: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk
          .split("\n")
          .filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = line.slice(6); // Remove 'data: ' prefix
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.message?.content) {
              fullContent += parsed.message.content;

              // Parse thinking content from the full response
              const { thinking, response: responseContent } =
                parseThinkingContent(fullContent);

              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMessageId
                    ? { ...m, content: responseContent, thinking }
                    : m
                )
              );
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-sm text-muted-foreground">
            {t("chat.chattingWith") || "Chatting with"}:{" "}
            <span className="text-foreground font-medium">{modelName}</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t("chat.clear") || "Clear"}
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-mono">
                {t("chat.startConversation") || "Start a conversation"}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {t("chat.typeMessage") || "Type a message below to begin"}
              </p>
            </motion.div>
          ) : (
            messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    message.role === "user"
                      ? "bg-primary/20 text-primary"
                      : "bg-accent/20 text-accent"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <Card
                  className={cn(
                    "max-w-[80%] p-4 relative group",
                    message.role === "user"
                      ? "bg-primary/10 border-primary/20"
                      : "bg-muted/30 border-border/50"
                  )}
                >
                  {/* Display thinking block for assistant messages */}
                  {message.role === "assistant" &&
                    (message.thinking || (isLoading && !message.content)) && (
                      <ThinkingBlock
                        thinking={message.thinking || ""}
                        isStreaming={
                          isLoading && !message.content && !message.thinking
                        }
                      />
                    )}

                  <div className="font-mono text-sm whitespace-pre-wrap break-words">
                    {message.content ||
                      (!message.thinking && (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t("chat.thinking") || "Thinking..."}
                        </span>
                      ))}
                  </div>
                  {message.content && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-3 w-3 text-accent" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-4 border-t border-border/50">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("chat.placeholder") || "Type your message..."}
            className="min-h-[60px] max-h-[200px] resize-none font-mono text-sm"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-auto px-4 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground/70 mt-2 text-center font-mono">
          {t("chat.hint") || "Press Enter to send, Shift+Enter for new line"}
        </p>
      </div>
    </div>
  );
}
