import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Checkbox, RadioCardGroup } from './Choice'
import { CodeCells } from './CodeCells'
import { TextArea, TextField } from './Field'
import { PhoneField } from './PhoneField'

function Phone() {
  const [value, setValue] = useState('')
  return <PhoneField label="M-Pesa phone number" value={value} onChange={setValue} />
}

function Code({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState('')
  return <CodeCells label="Your code" value={value} onChange={setValue} onComplete={onComplete} />
}

const cells = () => screen.getAllByRole('textbox', { name: /digit/i }) as HTMLInputElement[]
const cell = (n: number) => screen.getByRole('textbox', { name: `Digit ${n} of 6` })

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

describe('PhoneField', () => {
  it('formats as you type and accepts a pasted 07 number', async () => {
    const user = userEvent.setup()
    render(<Phone />)
    const input = screen.getByLabelText('M-Pesa phone number')
    await user.type(input, '7123')
    expect(input).toHaveValue('712 3')
    await user.clear(input)
    await user.paste('0712 345 678')
    expect(input).toHaveValue('712 345 678')
    await user.tab()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows the rule after leaving an invalid number', async () => {
    const user = userEvent.setup()
    render(<Phone />)
    await user.type(screen.getByLabelText('M-Pesa phone number'), '81234')
    await user.tab()
    expect(screen.getByRole('alert')).toHaveTextContent('Enter 9 digits starting with 7 or 1')
  })
})

describe('CodeCells', () => {
  it('advances on each digit and completes', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Code onComplete={onComplete} />)
    await user.click(cell(1))
    await user.keyboard('482719')
    expect(
      cells()
        .map((c) => c.value)
        .join(''),
    ).toBe('482719')
    expect(onComplete).toHaveBeenCalledWith('482719')
  })

  it('spreads a pasted code and steps back on backspace', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<Code onComplete={onComplete} />)
    await user.click(cell(1))
    await user.paste('48 27 19')
    expect(onComplete).toHaveBeenCalledWith('482719')
    await user.click(cell(6))
    await user.keyboard('{Backspace}{Backspace}')
    expect(
      cells()
        .map((c) => c.value)
        .join(''),
    ).toBe('4827')
    expect(cell(5)).toHaveFocus()
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
