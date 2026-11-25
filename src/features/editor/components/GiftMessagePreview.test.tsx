import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GiftMessagePreview } from './GiftMessagePreview';

const preview = () => screen.getByRole('figure', { name: 'Preview of the last page' });

describe('GiftMessagePreview', () => {
  it('shows the message with its line breaks', () => {
    render(<GiftMessagePreview message={'Happy birthday,\nMum'} theme="kraft" format="portrait-8x11" />);
    expect(preview()).toHaveTextContent('Happy birthday, Mum');
    expect(screen.getByText(/Happy birthday,\s+Mum/)).toBeInTheDocument();
    expect(screen.queryByText('Your message will appear here.')).not.toBeInTheDocument();
  });

  it('shows a placeholder for an empty or blank message', () => {
    const { rerender } = render(<GiftMessagePreview message="" theme="classic" format="square-8" />);
    expect(preview()).toHaveTextContent('Your message will appear here.');
    rerender(<GiftMessagePreview message={' \n '} theme="modern" format="landscape-11" />);
    expect(preview()).toHaveTextContent('Your message will appear here.');
  });
});
