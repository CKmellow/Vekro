import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Checkbox, RadioCardGroup } from './Choice'
import { TextArea, TextField } from './Field'

describe('Button', () => {
  it('blocks presses and announces busy while loading', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Pay KES 52,000
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Pay KES 52,000' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('fields', () => {
  it('links the label and announces the error', () => {
    render(<TextField label="Area" error="Tell us where you are" />)
    const input = screen.getByLabelText('Area')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Tell us where you are')
    expect(screen.getByRole('alert')).toHaveTextContent('Tell us where you are')
  })

  it('counts textarea characters', () => {
    render(<TextArea label="Notes" maxLength={500} value="Seal broken" onChange={() => {}} />)
    expect(screen.getByText('11/500')).toBeInTheDocument()
  })
})

describe('choices', () => {
  it('selects a radio card and toggles a checkbox', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <>
        <RadioCardGroup
          legend="If something is wrong"
          name="policy"
          value="refund"
          onChange={onChange}
          options={[
            { value: 'refund', title: 'Refund', description: 'Money goes back to the buyer' },
            { value: 'repair', title: 'Repair then release' },
          ]}
        />
        <Checkbox>I agree to the terms</Checkbox>
      </>,
    )
    expect(screen.getByRole('radio', { name: /refund/i })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /repair/i }))
    expect(onChange).toHaveBeenCalledWith('repair')
    const box = screen.getByRole('checkbox', { name: 'I agree to the terms' })
    await user.click(box)
    expect(box).toBeChecked()
  })
})
