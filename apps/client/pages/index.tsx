import { useEffect, useState } from 'react'
import { mpcClient, Todo } from '@sdk'

export default function Home() {
    const [todos, setTodos] = useState<Todo[]>([])

    useEffect(() => {
        mpcClient.subscribe('todos', (data: Todo[]) => {
            setTodos(data)
        })
    }, [])

    return (
        <div>
            <h1>Todo List</h1>
            <ul>
                {todos.map(todo => (
                    <li key={todo.id}>{todo.title} {todo.completed ? '✅' : '❌'}</li>
                ))}
            </ul>
        </div>
    )
}
