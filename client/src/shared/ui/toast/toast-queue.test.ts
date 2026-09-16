import { describe, expect, it } from 'vitest'
import {
  announcement,
  createToast,
  DEFAULT_DURATION,
  MAX_VISIBLE,
  toastReducer,
  type Toast,
  type ToastInput,
} from './toast-queue'

const show = (state: Toast[], input: ToastInput) => toastReducer(state, { type: 'show', toast: createToast(input) })

describe('createToast', () => {
  it('fills tone defaults', () => {
    const toast = createToast({ title: 'Saved' })
    expect(toast).toMatchObject({ tone: 'info', icon: 'sparkles', key: 'Saved', duration: DEFAULT_DURATION.info })
  })

  it('keeps errors on screen until dismissed', () => {
    expect(createToast({ title: 'Failed', tone: 'error' }).duration).toBeNull()
  })

  it('honours explicit duration, icon, and key', () => {
    const toast = createToast({ title: 'Hi', tone: 'success', icon: 'wave', duration: 1000, key: 'auth' })
    expect(toast).toMatchObject({ icon: 'wave', duration: 1000, key: 'auth' })
  })

  it('gives every toast a unique id', () => {
    expect(createToast({ title: 'a' }).id).not.toBe(createToast({ title: 'a' }).id)
  })
})

describe('toastReducer', () => {
  it('puts the newest toast first and caps the stack', () => {
    let state: Toast[] = []
    for (const title of ['one', 'two', 'three', 'four']) state = show(state, { title })
    expect(state.map((t) => t.title)).toEqual(['four', 'three', 'two'])
    expect(state).toHaveLength(MAX_VISIBLE)
  })

  it('replaces a toast with the same key, keeps its id, bumps the revision, and moves it to the top', () => {
    let state = show([], { title: 'Welcome', key: 'auth' })
    const id = state[0].id
    state = show(state, { title: 'Lessons open soon' })
    state = show(state, { title: 'Logged out', key: 'auth' })

    expect(state.map((t) => t.title)).toEqual(['Logged out', 'Lessons open soon'])
    expect(state[0]).toMatchObject({ id, revision: 1 })
  })

  it('dedupes repeated clicks by title', () => {
    let state: Toast[] = []
    for (let i = 0; i < 5; i++) state = show(state, { title: 'Lessons open soon' })
    expect(state).toHaveLength(1)
    expect(state[0].revision).toBe(4)
  })

  it('dismisses one or all', () => {
    let state = show(show([], { title: 'a' }), { title: 'b' })
    state = toastReducer(state, { type: 'dismiss', id: state[0].id })
    expect(state.map((t) => t.title)).toEqual(['a'])
    expect(toastReducer(state, { type: 'dismissAll' })).toEqual([])
  })

  it('returns the same state when there is nothing to clear', () => {
    const empty: Toast[] = []
    expect(toastReducer(empty, { type: 'dismissAll' })).toBe(empty)
  })
})

describe('announcement', () => {
  it('joins title and description for screen readers', () => {
    expect(announcement({ title: 'Logged out', description: 'Ingat!' })).toBe('Logged out Ingat!')
    expect(announcement({ title: 'Saved' })).toBe('Saved')
  })
})
