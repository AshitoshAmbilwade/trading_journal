"use client";

import * as React from "react";

/**
 * Note:
 * We do NOT import ToastProps from ./toast because that file exports components,
 * not types. Instead we define the lightweight shape we actually use here.
 */

type ToastVariant = "default" | "destructive";

export type ToasterToast = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  /**
   * action can be any React node (e.g. <ToastAction .../> or a button)
   */
  action?: React.ReactNode;
  /**
   * variant used for styling in Toast component
   */
  variant?: ToastVariant;
  /**
   * open controls Radix.Root open state. We set onOpenChange to auto dismiss.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 1000 * 30; // 30s remove delay (adjust if you want)

const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = typeof actionTypes;

type Action =
  | { type: ActionType["ADD_TOAST"]; toast: ToasterToast }
  | { type: ActionType["UPDATE_TOAST"]; toast: Partial<ToasterToast> & { id: string } }
  | { type: ActionType["DISMISS_TOAST"]; toastId?: string }
  | { type: ActionType["REMOVE_TOAST"]; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function addToRemoveQueue(toastId: string) {
  if (toastTimeouts.has(toastId)) return;

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({ type: "REMOVE_TOAST", toastId });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
}

/**
 * In-memory store + simple pub/sub so multiple consumers can read state
 */
const store = (() => {
  const listeners: ((s: State) => void)[] = [];
  let memoryState: State = { toasts: [] };

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case "ADD_TOAST":
        return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
      case "UPDATE_TOAST":
        return {
          ...state,
          toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)),
        };
      case "DISMISS_TOAST": {
        const { toastId } = action;
        if (toastId) addToRemoveQueue(toastId);
        else state.toasts.forEach((t) => addToRemoveQueue(t.id));

        return {
          ...state,
          toasts: state.toasts.map((t) =>
            toastId === undefined || t.id === toastId ? { ...t, open: false } : t
          ),
        };
      }
      case "REMOVE_TOAST":
        return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
      default:
        return state;
    }
  }

  function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((l) => l(memoryState));
  }

  function subscribe(listener: (s: State) => void) {
    listeners.push(listener);
    return () => {
      const idx = listeners.indexOf(listener);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  return {
    getState: () => memoryState,
    dispatch,
    subscribe,
  };
})();

const { dispatch, subscribe, getState } = store;

/**
 * Public API to create a toast
 */
function toast(props: Omit<ToasterToast, "id">) {
  const id = genId();

  const toastObj: ToasterToast = {
    id,
    ...props,
    open: props.open ?? true,
    onOpenChange: (open: boolean) => {
      // keep consistent behavior with Radix onOpenChange
      if (!open) dispatch({ type: "DISMISS_TOAST", toastId: id });
      props.onOpenChange?.(open);
    },
  };

  dispatch({ type: "ADD_TOAST", toast: toastObj });

  const update = (next: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...next, id } as Partial<ToasterToast> & { id: string } });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  return { id, update, dismiss };
}

/**
 * React hook to access toasts and helpers from components
 */
function useToast() {
  const [state, setState] = React.useState<State>(getState());

  React.useEffect(() => {
    const unsub = subscribe(setState);
    // sync initial
    setState(getState());
    return unsub;
  }, []);

  return {
    toasts: state.toasts,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  } as const;
}

export { useToast, toast };
