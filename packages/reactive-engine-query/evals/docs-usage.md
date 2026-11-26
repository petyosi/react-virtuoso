# Docs usage evaluation

Checks whether an agent that learns `@virtuoso.dev/reactive-engine-query` only from its docs picks the right write
primitive and uses it correctly. It is evidence for a release, not a gate: run it after changing the query docs or the
`reactive-engine` skill, record every run, and judge each against the rubric.

## How to run

- **Model:** pin one model and record it with the results. Run the prompt at least three times, each in a fresh session.
- **Materials:** give the agent only these files, and nothing from `src/` or the tests:
  - `packages/reactive-engine-query/docs/01.queries-and-mutations.md`
  - `packages/virtuoso-skills/skills/reactive-engine/SKILL.md`
  - the built declarations, `packages/reactive-engine-query/dist/index.d.ts`
- **Type-check:** save each run's code and type-check it against the built declarations.
- **Record:** for every run, the model, the date, the code, and the judgment for each task.

## Prompt

> You are using `@virtuoso.dev/reactive-engine-query` for the first time. Read only the files you are given. For each
> task below, write the mutation definitions, the graph wiring, and the relevant React component code
> (`useCellValue`, `usePublisher` from `@virtuoso.dev/reactive-engine-react`). Then explain what the user sees, step by
> step, including timing edge cases: a request that fails or succeeds late, a double click, or a record switch.
> Say which parts of the docs were unclear. Write what you would naturally write.
>
> Assume `api.patchSetting(key, value, signal)`, `api.updateContact(id, fields, signal)`, `api.createTodo(title, signal)`,
> `api.deleteTodo(id, signal)`, `api.charge(orderId, signal)`, and `api.getContacts(signal)` exist and return Promises.
>
> 1. A settings page with toggles (notifications, dark mode, compact layout). Every click saves immediately. Show
>    "Saving…", "Saved", or "Couldn't save" with a ✕ that dismisses the error.
> 2. A dialog that edits one contact (name, email). Fields save as the user types. Cancel closes the dialog, and the
>    user expects their changes to be discarded.
> 3. A "new todo" form. After a successful create, the form clears for the next todo.
> 4. A detail pane shows one contact at a time with a save status line. The user saves contact 1, then switches the
>    pane to contact 2 while the save is in flight.
> 5. A todo list where each row has a Delete button.
> 6. A websocket message tells the client to save a draft to the server (`api.updateContact`). Messages can arrive
>    faster than the save completes.
> 7. A "Pay" button that charges a card with `api.charge(orderId)`. It must never charge twice.
> 8. For each pair, say which primitive you would use, and why not the other: (a) a "like" button that toggles, (b) a
>    "send invitation" button.

## Rubric

| Task                           | Expected                                                                                                                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Settings toggles            | `ConcurrentMutation` with `concurrency: 'coalesce'`, keyed per setting with the full value; the overlay recipe for the shown value; a refetch in `onSuccess` (or a confirmed value written there); the ✕ uses `dismiss$` only after the error was shown |
| 2. Autosave dialog with Cancel | `ConcurrentMutation` with `'coalesce'`, keyed per field with full values (or `merge` for patches, without the overlay recipe); Cancel is a compensating write of the original values, not `dismiss$`                                                    |
| 3. Create form                 | `Mutation` with `key: false`; the submit button is disabled while `data$.isPending`; the form is cleared in `onSuccess` or from `settled$`                                                                                                              |
| 4. Switching records           | Keyed `Mutation` (or `ConcurrentMutation` if saves repeat); the pane reads `status$.get(selectedId)`; no dismiss on switch                                                                                                                              |
| 5. Per-row delete              | Keyed `Mutation` with the key type passed (`Mutation<P, D, number>`); the row's button is disabled while its entry is pending; `dismiss$(id)` after a successful delete                                                                                 |
| 6. Websocket-driven save       | `ConcurrentMutation` (`'coalesce'` per record), because each message carries a new value; if `Mutation` is chosen, `onIgnored` records the ignored call and never republishes                                                                           |
| 7. Charge a card               | `Mutation`, because a second click is a duplicate; the button is disabled while pending, and `onIgnored` (if used) does not retry                                                                                                                       |
| 8. Which primitive             | (a) `ConcurrentMutation` with `'coalesce'`: each toggle is a new value; (b) `Mutation`: a second click is a duplicate                                                                                                                                   |

Also report, per run:

- whether the code type-checks against the built declarations;
- whether keyed primitives pass the key type argument, or annotate `mutationFn` and list it before `key`;
- any misuse of `dismiss$` (to cancel, or to scope status to a record);
- any use of the overlay recipe with `merge`d patches;
- any child-engine use without registering the primitive in the root engine.
