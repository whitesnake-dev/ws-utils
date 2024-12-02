import { FC, memo, useContext } from 'react';

/**
 * A higher-order component that provides setter functions from context.
 *
 * @param Component - The component to be wrapped.
 * @param Context - The context from which setter functions will be extracted.
 * @param setNames - An array of setter function names to extract from the context.
 * @returns The wrapped component with the provided setter functions.
 */

export const withSetterFromContext = <T extends Record<string, any>>(
	Component: FC<any>,
	Context: React.Context<T | undefined>,
	setNames: Array<keyof T>
) => {
	const ComponentMemo = memo(Component);

	return (props: any) => {
		const contextValue = useContext(Context);
		if (!contextValue) {
			throw new Error(
				'Context value is null. Ensure the provider is properly set.'
			);
		}

		const setters = setNames.reduce(
			(acc, name) => {
				if (typeof contextValue[name] === 'function') {
					acc[name as string] = contextValue[name];
				}
				return acc;
			},
			{} as Record<string, any>
		);

		return <ComponentMemo {...props} {...setters} />;
	};
};
