"use client";

import { type QueryClientConfig, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { httpBatchStreamLink, loggerLink, TRPCClientError } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useState } from "react";
import SuperJSON from "superjson";
import { useRouter } from 'next/navigation';

import type { AppRouter } from "@/server/api/root";

let clientQueryClientSingleton: import("@tanstack/react-query").QueryClient | undefined = undefined;
const getQueryClientInstance = (router?: ReturnType<typeof useRouter>) => {
	const queryClientConfig: QueryClientConfig = {
		defaultOptions: {
			queries: {
				staleTime: 1 * 1000 * 60, // 1 minute, example, adjust as needed
				retry: (failureCount, error) => {
					if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
						return false; // Do not retry on UNAUTHORIZED
					}
					return failureCount < 3; // Default retry count for other errors
				},
			},
		},
		queryCache: new QueryCache({
			onError: (error) => {
				if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
					const publicAuthPaths = ['/auth/login', '/auth/register'];
					if (router && !publicAuthPaths.includes(window.location.pathname)) {
						router.push('/auth/login?reason=unauthorized');
					}
				}
			},
		}),
	};

	if (typeof window === "undefined") {
		return new (require("@tanstack/react-query").QueryClient)(queryClientConfig);
	}
	clientQueryClientSingleton ??= new (require("@tanstack/react-query").QueryClient)(queryClientConfig);
	return clientQueryClientSingleton;
};

export const api = createTRPCReact<AppRouter>();

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

export function TRPCReactProvider(props: { children: React.ReactNode }) {
	const router = useRouter();
	const queryClient = getQueryClientInstance(router);

	const [trpcClient] = useState(() =>
		api.createClient({
			links: [
				loggerLink({
					enabled: (op) =>
						process.env.NODE_ENV === "development" ||
						(op.direction === "down" && op.result instanceof Error),
				}),
				httpBatchStreamLink({
					transformer: SuperJSON,
					url: `${getBaseUrl()}/api/trpc`,
					headers: () => {
						const headers = new Headers();
						headers.set("x-trpc-source", "nextjs-react");
						return headers;
					},
				}),
			],
		}),
	);

	return (
		<QueryClientProvider client={queryClient}>
			<api.Provider client={trpcClient} queryClient={queryClient}>
				{props.children}
			</api.Provider>
		</QueryClientProvider>
	);
}

function getBaseUrl() {
	if (typeof window !== "undefined") return window.location.origin;
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
	return `http://localhost:${process.env.PORT ?? 3000}`;
}
