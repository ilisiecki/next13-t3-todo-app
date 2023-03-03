import toast from "react-hot-toast";
import type { Todo } from "~/types";
import { api } from "~/utils/api";

type TodoProps = {
  todo: Todo;
};

export default function Todo({ todo }: TodoProps) {
  const { id, text, done } = todo;

  const trpc = api.useContext();

  const { mutate: doneMutation } = api.todo.toggle.useMutation({
    onMutate: async ({ id, done }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await trpc.todo.all.cancel();

      // Snapshot the previous value
      const previousTodos = trpc.todo.all.getData();

      // Optimistically update to the noe value
      trpc.todo.all.setData(undefined, (prev) => {
        if (!prev) return previousTodos;
        return prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              done,
            };
          }
          return t;
        });
      });

      return { previousTodos };
    },
    onSuccess: (err, { done }) => {
      if (done) {
        toast.success("Todo completed 🎉");
      }
    },

    onError: (err, newTodo, context) => {
      toast.error(`An error occured when setting todo to ${done ? "done" : "undone"}`);
      trpc.todo.all.setData(undefined, () => context?.previousTodos);
    },
    onSettled: async () => {
      await trpc.todo.all.invalidate();
    },
  });

  const { mutate: deleteMutation } = api.todo.delete.useMutation({
    onMutate: async (deleteId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await trpc.todo.all.cancel();

      // Snapshot the previous value
      const previousTodos = trpc.todo.all.getData();

      // Optimistically update to the noe value
      trpc.todo.all.setData(undefined, (prev) => {
        if (!prev) return previousTodos;
        return prev.filter((t) => t.id !== deleteId);
      });

      return { previousTodos };
    },

    onError: (err, newTodo, context) => {
      toast.error("An error occures when deleting todo");
      trpc.todo.all.setData(undefined, () => context?.previousTodos);
    },
    onSettled: async () => {
      await trpc.todo.all.invalidate();
    },
  });

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <input
            className="focus:ring-3 h-4 w-4 cursor-pointer rounded border border-gray-300 bg-gray-50 focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
            type="checkbox"
            name="done"
            id={id}
            checked={done}
            onChange={(e) => {
              doneMutation({ id, done: e.target.checked });
            }}
          />
          <label htmlFor={id} className={`cursor-pointer ${done ? "line-through" : ""}`}>
            {text}
          </label>
        </div>
        <button
          className="w-full rounded-lg bg-blue-700 px-2 py-1 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 sm:w-auto"
          onClick={() => {
            deleteMutation(id);
          }}
        >
          Delete
        </button>
      </div>
    </>
  );
}
