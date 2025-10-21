"use client";
import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Send, Paperclip, Download, Trash2, Sparkles, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function TradeBuddy() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "👋 Hello! I'm your AI Trade Buddy. I can help you analyze trades, answer questions about your performance, and provide insights. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: getAIResponse(input),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const getAIResponse = (userInput: string): string => {
    const lowercaseInput = userInput.toLowerCase();
    
    if (lowercaseInput.includes("win rate") || lowercaseInput.includes("performance")) {
      return "Based on your trading history, your current win rate is 68%. This is above average! I noticed you perform best during the first 2 hours of market open. Consider focusing your trading activity during 9:15 AM - 11:15 AM for optimal results.";
    }
    
    if (lowercaseInput.includes("loss") || lowercaseInput.includes("mistake")) {
      return "I've analyzed your losing trades. The most common pattern is holding positions too long after they go against you. Consider implementing a strict stop-loss at 2% and stick to it. Also, avoid trading on Fridays - your data shows 65% losses on that day.";
    }
    
    if (lowercaseInput.includes("strategy") || lowercaseInput.includes("which")) {
      return "Your Momentum strategy has the highest win rate at 85%. Breakout strategy shows 72% success. I'd recommend focusing on Momentum trades in the morning session and avoiding Scalping strategies which show only 55% effectiveness in your portfolio.";
    }
    
    return "I understand you're asking about: " + userInput + ". Based on your trading data, I recommend reviewing your recent trades to identify patterns. Would you like me to analyze your best performing trades or help you understand your losses better?";
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "1",
        type: "ai",
        content: "Chat cleared! How can I help you today?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleExport = () => {
    // In a real app, this would export the chat session
    console.log("Exporting chat session...");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl">Trade Buddy</h1>
                <p className="text-muted-foreground">Your AI-powered trading assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="h-[600px] overflow-y-auto p-6 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/50 border border-border"
                      } rounded-2xl px-4 py-3 shadow-sm`}
                    >
                      {message.type === "ai" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-xs font-medium text-primary">AI Trade Buddy</span>
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <span className="text-xs opacity-70 mt-2 block">
                        {message.timestamp.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-4 bg-background/50">
                <div className="flex items-end gap-2">
                  <Button size="icon" variant="outline" className="shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Textarea
                    placeholder="Ask about your trades, strategies, or performance..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="min-h-[60px] max-h-[120px] resize-none"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 h-[60px] w-[60px] bg-primary hover:bg-primary/90"
                    onClick={handleSend}
                    disabled={!input.trim() || isTyping}
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <p className="text-sm text-muted-foreground mb-3">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {[
              "What's my win rate?",
              "Analyze my losing trades",
              "Which strategy works best?",
              "Show me my best trades",
            ].map((question) => (
              <Button
                key={question}
                size="sm"
                variant="outline"
                onClick={() => {
                  setInput(question);
                }}
                className="text-sm"
              >
                {question}
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
