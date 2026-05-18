/**
 * Mock tRPC client for WordPro standalone components
 */
export const trpc = {
  useUtils: () => ({
    documents: { invalidate: async () => {} },
    auth: { me: { setData: () => {}, invalidate: async () => {} } }
  }),
  documents: {
    create: { useMutation: () => ({ mutateAsync: async () => ({ id: 1 }) }) },
    update: { useMutation: () => ({ mutateAsync: async () => ({}) }) },
    list: { useQuery: () => ({ data: [], isLoading: false }) },
  },
  ai: {
    chat: { useMutation: () => ({ mutateAsync: async () => ({ choices: [{ message: { content: "Mock AI response" } }] }) }) },
  },
  auth: {
    me: { useQuery: () => ({ data: { id: 1, name: "User" }, isLoading: false }) },
    logout: { useMutation: () => ({ mutateAsync: async () => ({}) }) },
  }
} as any;
