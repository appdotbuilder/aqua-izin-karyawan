
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createLeaveRequestInputSchema, 
  managerLoginInputSchema,
  updateLeaveStatusInputSchema 
} from './schema';

import { createLeaveRequest } from './handlers/create_leave_request';
import { getLeaveRequests } from './handlers/get_leave_requests';
import { managerLogin } from './handlers/manager_login';
import { updateLeaveStatus } from './handlers/update_leave_status';
import { getLeaveRequestById } from './handlers/get_leave_request_by_id';
import { exportLeaveRequests } from './handlers/export_leave_requests';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Employee procedures (public access)
  createLeaveRequest: publicProcedure
    .input(createLeaveRequestInputSchema)
    .mutation(({ input }) => createLeaveRequest(input)),

  // Manager authentication
  managerLogin: publicProcedure
    .input(managerLoginInputSchema)
    .mutation(({ input }) => managerLogin(input)),

  // Manager procedures (requires authentication in real implementation)
  getLeaveRequests: publicProcedure
    .query(() => getLeaveRequests()),

  getLeaveRequestById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getLeaveRequestById(input.id)),

  updateLeaveStatus: publicProcedure
    .input(updateLeaveStatusInputSchema)
    .mutation(({ input }) => updateLeaveStatus(input)),

  exportLeaveRequests: publicProcedure
    .query(() => exportLeaveRequests()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
