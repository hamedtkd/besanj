// Source lineage: PersianLabs/ui, adapted from Radix UI's controllable-state hook.
import * as React from "react";

const useLayoutEffect = globalThis?.document ? React.useLayoutEffect : () => {};
const useInsertionEffect: typeof useLayoutEffect =
  (React as never)[" useInsertionEffect ".trim().toString()] || useLayoutEffect;

type ChangeHandler<T> = (state: T) => void;
type SetStateFn<T> = React.Dispatch<React.SetStateAction<T>>;

interface UseControllableStateParams<T> {
  prop?: T | undefined;
  defaultProp: T;
  onChange?: ChangeHandler<T>;
  caller?: string;
}

export function useControllableState<T>({
  prop,
  defaultProp,
  onChange = () => {},
  caller,
}: UseControllableStateParams<T>): [T, SetStateFn<T>] {
  const [uncontrolledProp, setUncontrolledProp, onChangeRef] =
    useUncontrolledState({ defaultProp, onChange });
  const isControlled = prop !== undefined;
  const value = isControlled ? prop : uncontrolledProp;

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const isControlledRef = React.useRef(prop !== undefined);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useEffect(() => {
      const wasControlled = isControlledRef.current;
      if (wasControlled !== isControlled) {
        const from = wasControlled ? "controlled" : "uncontrolled";
        const to = isControlled ? "controlled" : "uncontrolled";
        console.warn(
          `${caller ?? "Component"} is changing from ${from} to ${to}. Choose controlled or uncontrolled state for the component lifetime.`
        );
      }
      isControlledRef.current = isControlled;
    }, [isControlled, caller]);
  }

  const setValue = React.useCallback<SetStateFn<T>>(
    (nextValue) => {
      if (isControlled) {
        const next = isFunction(nextValue) ? nextValue(prop as T) : nextValue;
        if (next !== prop) onChangeRef.current?.(next);
      } else {
        setUncontrolledProp(nextValue);
      }
    },
    [isControlled, prop, setUncontrolledProp, onChangeRef]
  );

  return [value, setValue];
}

function useUncontrolledState<T>({
  defaultProp,
  onChange,
}: Omit<UseControllableStateParams<T>, "prop">): [
  T,
  React.Dispatch<React.SetStateAction<T>>,
  React.RefObject<ChangeHandler<T> | undefined>,
] {
  const [value, setValue] = React.useState(defaultProp);
  const prevValueRef = React.useRef(value);
  const onChangeRef = React.useRef<ChangeHandler<T> | undefined>(onChange);

  useInsertionEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (prevValueRef.current !== value) {
      onChangeRef.current?.(value);
      prevValueRef.current = value;
    }
  }, [value]);

  return [value, setValue, onChangeRef];
}

function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}
