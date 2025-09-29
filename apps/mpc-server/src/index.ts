import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createMpcServer } from 'hono-mcp-server-sse-transport'

const app = new Hono()

const mpcServer = createMpcServer({
    transport: 'sse',
    onMessage: async (msg) => {
        console.log('MPC message received:', msg)
        // Handle MPC logic here
    }
})

app.route('/mpc', mpcServer)

serve(app, { port: 4000 })
