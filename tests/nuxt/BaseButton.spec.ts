import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BaseButton from '~/components/base/BaseButton.vue'

describe('BaseButton', () => {
  it('renders a <button type="button"> by default', async () => {
    const wrapper = await mountSuspended(BaseButton, { slots: { default: () => '預約' } })
    const button = wrapper.get('button')
    expect(button.attributes('type')).toBe('button')
    expect(button.text()).toContain('預約')
    expect(button.classes()).toContain('base-button--primary')
  })

  it('renders a link when `to` is provided', async () => {
    const wrapper = await mountSuspended(BaseButton, {
      props: { to: '/workshops' },
      slots: { default: () => '探索' },
    })
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe('/workshops')
  })

  it('emits click when enabled', async () => {
    const wrapper = await mountSuspended(BaseButton)
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
  })

  it('does not emit click while loading and exposes aria-busy', async () => {
    const wrapper = await mountSuspended(BaseButton, { props: { loading: true } })
    const button = wrapper.get('button')
    expect(button.attributes('aria-busy')).toBe('true')
    await button.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
  })

  it('uses the native disabled attribute', async () => {
    const wrapper = await mountSuspended(BaseButton, { props: { disabled: true } })
    expect(wrapper.get('button').attributes('disabled')).toBeDefined()
  })
})
