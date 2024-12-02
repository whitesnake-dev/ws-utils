import * as React from 'react';

/**
 * Creates a context for state management in React.
 *
 * @param componentName - The name of the component using the context.
 * @param defaultContextValue - The default value for the context.
 * @returns  An array containing the Provider, useContext hook and Context [Provider, useContext, Context].
 */

function generateContext<ContextValueType extends object | null>(
	componentName: string,
	defaultContextValue?: ContextValueType
) {
	const Context = React.createContext<ContextValueType | undefined>(
		defaultContextValue
	);

	function Provider(props: ContextValueType & { children: React.ReactNode }) {
		const { children, ...context } = props;

		const value = React.useMemo(
			() => context,
			[Object.values(context)]
		) as ContextValueType;
		return <Context.Provider value={value}>{children}</Context.Provider>;
	}

	function useContext(consumerName: string) {
		const context = React.useContext(Context);
		if (context) return context;
		if (defaultContextValue !== undefined) return defaultContextValue;

		throw new Error(
			`\`${consumerName}\` must be used within \`${componentName}\``
		);
	}

	Provider.displayName = defaultContextValue + 'Provider';
	return [Provider, useContext, Context] as const;
}

export { generateContext };