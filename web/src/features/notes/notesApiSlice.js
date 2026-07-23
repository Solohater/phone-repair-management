import {
    createSelector,
    createEntityAdapter
} from "@reduxjs/toolkit";
import { apiSlice } from "../../app/api/apiSlice"

const statusOrder = { pending: 0, in_progress: 1, blocked: 2, needs_rework: 3, completed: 4 }

const notesAdapter = createEntityAdapter({
    sortComparer: (a, b) => (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
})

const initialState = notesAdapter.getInitialState()

export const notesApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getNotes: builder.query({
            query: () => ({
                url: '/notes',
                validateStatus: (response, result) => {
                    return response.status === 200 && !result.isError
                },
            }),
            transformResponse: responseData => {
                const loadedNotes = responseData.map(note => ({
                    ...note,
                    id: note.id || note._id,
                }));
                return notesAdapter.setAll(initialState, loadedNotes)
            },
            providesTags: (result, error, arg) => {
                if (result?.ids) {
                    return [
                        { type: 'Note', id: 'LIST' },
                        ...result.ids.map(id => ({ type: 'Note', id }))
                    ]
                } else return [{ type: 'Note', id: 'LIST' }]
            }
        }),
        addNewNote: builder.mutation({
            query: initialNote => ({
                url: '/notes',
                method: 'POST',
                body: {
                    ...initialNote,
                }
            }),
            invalidatesTags: [
                {type: 'Note', id: 'LIST'}
            ]
        }),
        updateNote: builder.mutation({
            query: initialNote => ({
                url: '/notes',
                method: 'PATCH',
                body: {
                    ...initialNote,
                }
            }),
            invalidatesTags: (result, error, arg) => [
                {type: 'Note', id: 'LIST'},
                {type: 'Note', id: arg.id}
            ],
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                const patchResult = dispatch(
                    apiSlice.util.updateQueryData('getNotes', 'notesList', draft => {
                        const note = draft.entities[arg.id]
                        if (note) {
                            if (arg.status) note.status = arg.status
                            if (arg.comment !== undefined) note.comment = arg.comment
                            if (arg.title) note.title = arg.title
                            if (arg.text) note.text = arg.text
                            if (arg.user) note.user = arg.user
                            if (arg.user) note.userId = arg.user
                        }
                    })
                )
                try {
                    await queryFulfilled
                } catch {
                    patchResult.undo()
                }
            }
        }),
        deleteNote: builder.mutation({
            query: ({id}) => ({
                url: '/notes',
                method: 'DELETE',
                body: { id }
            }),
            invalidatesTags: (result, error, arg) => [
                {type: 'Note', id: arg.id}
            ]
        }),
    }),
})

export const {
    useGetNotesQuery,
    useAddNewNoteMutation,
    useUpdateNoteMutation,
    useDeleteNoteMutation,
} = notesApiSlice

// returns the query result object
export const selectNotesResult = notesApiSlice.endpoints.getNotes.select()

// creates memoized selector
const selectNotesData = createSelector(
    selectNotesResult,
    notesResult => notesResult.data // normalized state object with ids & entities
)

//getSelectors creates these selectors and we rename them with aliases using destructuring
export const {
    selectAll: selectAllNotes,
    selectById: selectNoteById,
    selectIds: selectNoteIds
    // Pass in a selector that returns the notes slice of state
} = notesAdapter.getSelectors(state => selectNotesData(state) ?? initialState)