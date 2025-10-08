"use client";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";


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
  const {messages} = useChat();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // For now, just log the input since we need to check the correct API
      console.log("Input:", input);
      setInput("");
    }
  };

  const query = useQuery({
    queryKey: ["todo"],
    queryFn: getTodos,
  }) as { data: Todo[] | undefined };

  return (
    <div>
      {query.data?.map((todo) => (
        <div
          key={todo.id}
          style={{display: "flex", alignItems: "center", gap: 8}}
        >
          <input type="checkbox" checked={todo.completed} readOnly/>
          <span>{todo.title}</span>
          <span style={{color: "#888", fontSize: 12}}>id: {todo.id}</span>
        </div>
      ))}
      <div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={isLoading}>send</button>
        </form>
        {messages.map((message, index) => (
          <div key={index}>{JSON.stringify(message)}</div>
        ))}
      </div>
    </div>
  );
}
