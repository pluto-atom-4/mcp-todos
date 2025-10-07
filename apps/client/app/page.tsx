"use client";

import {useQuery} from "@tanstack/react-query";

type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const getTodos = async () => {
  const res = await fetch("http://localhost:8080/todos");
  return res.json();
}

export default function Home() {
  const query = useQuery({
    queryKey: ["todo"],
    queryFn: getTodos,
  }) as { data: Todo[]  | undefined };

  return (
    <div>
      {query.data?.map((todo) => (
        <div
          key={todo.id}
          style={{ display: "flex", alignItems: "center", gap: 8 }}
        >
          <input type="checkbox" checked={todo.completed} readOnly />
          <span>{todo.title}</span>
          <span style={{ color: "#888", fontSize: 12 }}>id: {todo.id}</span>
        </div>
      ))}
    </div>
  );
}
