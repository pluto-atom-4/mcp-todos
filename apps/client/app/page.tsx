"use client";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, CheckCircle2, Plus, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const getTodos = async () => {
  const res = await fetch("http://localhost:8080/todos");
  return res.json();
};

export default function Home() {
  const query = useQuery({
    queryKey: ["todo"],
    queryFn: getTodos,
  }) as { data: Todo[] | undefined };

  const {messages} = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // For now, just log the input since we need to check the correct API
      console.log("Input:", input);
      setInput("");
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "user") {
        // UIMessage might have different structure, let's use a safer approach
        const content = (lastMessage as any).content || "";
        setInput(typeof content === "string" ? content : "");
      }
    }
  }, [messages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto p-4 max-w-6xl">
        <h1
          className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
          MCP Todos App
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card
            className="h-[calc(100vh-150px)] flex flex-col md:col-span-3 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-smm">
            <CardHeader className="border-b bg-white dark:bg-slate-950 rounded-t-lg">
              <CardTitle>
                <Bot className="h-5 w-5 text-blue-500"/>
                <span>TODOアシスタント</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4 h-[calc(100%-80px)]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.3}}
                        className={cn(
                          "flex items-center gap-2",
                          message.role === "user"
                            ? "flex-row-reverse"
                            : "flex-row"
                        )}
                      >
                        <div
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-slate-700"
                          )}
                        >
                          {message.role === "user" ? (
                            <User className="h-4 w-4"/>
                          ) : (
                            <Bot className="h-4 w-4"/>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex w-full">
                            <div
                              className={cn(
                                "p-3 rounded-2xl max-w-full md:max-w-[90%] min-w-0 break-words relative",
                                message.role === "user"
                                  ? "bg-blue-500 text-white ml-auto rounded-tr-none"
                                  : "bg-gray-200 dark:bg-slate-700 dark:text-slate-100 rounded-tl-none"
                              )}
                            >
                              <p className="whitespace-pro-line break-words">
                                {(message as any).content || ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div ref={messageEndRef}/>

                </div>
              </ScrollArea>
            </CardContent>
          </Card>
          <Card
            className="h-[calc(100vh-150px)] flex flex-col md:col-span-2 shadow-lg border-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <CardHeader className="border-b bg-white dark:bg-slate-950 rounded-t-lg">
              <CardTitle className="flex items-center justify-between">
                <span>TODOリスト</span>
                <span className="ml-2">
                  {query.data ? query.data.length : 0} 件
                </span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                チャットからのみ操作可能です
              </p>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[calc(100%-80px)] p-4">
                {!query.data || query.data.length === 0 ? (
                  <div
                    className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-8">
                    <div
                      className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <Plus className="h-8 w-8 text-gray-400"/>
                    </div>
                    <p>TODOがありません</p>
                    <p className="text-sm">
                      チャットで「TODO 追加:
                      タスク名」と入力してTODOを追加してください。
                    </p>
                    <span className="mt-4">チャットからのみ操作可能</span>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    <AnimatePresence>
                      {query.data.map((todo) => (
                        <motion.li
                          key={todo.id}
                          initial={{opacity: 0, y: 10}}
                          animate={{opacity: 1, y: 0}}
                          exit={{opacity: 0, height: 0}}
                          transition={{duration: 0.2}}
                          className="border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div
                              className={cn(
                                "rounded-full p-0 h-6 w-6 flex items-center justify-center",
                                todo.completed
                                  ? "text-green-500"
                                  : "text-gray-400"
                              )}
                            >
                              {todo.completed ? (
                                <CheckCircle2 className="h-5 w-5 fill-green-100"/>
                              ) : (
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600"/>
                              )}
                            </div>
                            <span
                              className={cn(
                                "font-medium",
                                todo.completed &&
                                "line-through text-muted-foreground"
                              )}
                            >
                              {todo.title}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs bg-gray-50 dark:bg-slate-900">
                              ID: {String(todo.id).slice(-4)}
                            </span>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
