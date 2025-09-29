import { createClient } from '@modelcontextprotocol/sdk'
import { z } from 'zod'

export const TodoSchema = z.object({
    id: z.string(),
    title: z.string(),
    completed: z.boolean()
})

export type Todo = z.infer<typeof TodoSchema>

export const mpcClient = createClient({
    transport: 'sse',
    url: 'http://localhost:4000/mpc'
})
