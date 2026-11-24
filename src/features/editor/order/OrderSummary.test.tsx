import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { OrderSummary, type OrderSummaryProps } from './OrderSummary';

const book: OrderSummaryProps = {
  format: 'landscape-11',
  coverType: 'hardcover',
  pageCount: 30,
  emptySpreadCount: 0,
};

const priceDetails = () => screen.getByRole('group', { name: 'Price details' });
const orderButton = () => screen.getByRole('button', { name: 'Order book' });
const status = () => screen.getByRole('status');

async function renderAndOrder(props: Partial<OrderSummaryProps> = {}) {
  const user = userEvent.setup();
  const view = render(<OrderSummary {...book} {...props} />);
  await user.click(orderButton());
  return { user, ...view };
}

describe('OrderSummary price', () => {
  it('shows the total and a breakdown that adds up to it', () => {
    render(<OrderSummary {...book} />);
    const details = within(priceDetails());
    expect(details.getByText('$74.99')).toBeInTheDocument();
    expect(details.getByText('Book with 20 pages').nextSibling).toHaveTextContent('$44.99');
    expect(details.getByText('10 extra pages').nextSibling).toHaveTextContent('+$15.00');
    expect(details.getByText('Hardcover upgrade').nextSibling).toHaveTextContent('+$15.00');
  });

  it('updates as pages are added and leaves out rows that cost nothing', () => {
    const props = { ...book, format: 'square-8', coverType: 'softcover', pageCount: 20 } as const;
    const { rerender } = render(<OrderSummary {...props} />);
    expect(priceDetails()).toHaveTextContent(/^Total\$29\.99Book with 20 pages\$29\.99$/);
    rerender(<OrderSummary {...props} pageCount={22} />);
    expect(priceDetails()).toHaveTextContent('Total$31.99');
    expect(screen.getByText('2 extra pages')).toBeInTheDocument();
  });

  it('hides and shows the price with a toggle button', async () => {
    const user = userEvent.setup();
    render(<OrderSummary {...book} pageCount={4} />);
    const toggle = screen.getByRole('button', { name: 'Hide price' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await user.click(toggle);
    expect(screen.queryByRole('group', { name: 'Price details' })).not.toBeInTheDocument();
    expect(toggle).toHaveAccessibleName('Show price');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Add 16 more pages/)).toBeVisible();

    await user.keyboard('{Enter}');
    expect(priceDetails()).toBeVisible();
  });
});

describe('OrderSummary validation', () => {
  it('explains how many pages are missing and shows the minimum price', async () => {
    render(<OrderSummary {...book} format="square-8" coverType="softcover" pageCount={4} />);
    expect(orderButton()).toHaveAccessibleDescription(
      'Add 16 more pages to reach the 20-page minimum.',
    );
    expect(priceDetails()).toHaveTextContent('Books start at $29.99 for 20 pages.');

    await userEvent.click(orderButton());
    expect(screen.getByRole('alert')).toHaveTextContent(
      "You can't order yet. Add 16 more pages to reach the 20-page minimum.",
    );
    expect(status()).toBeEmptyDOMElement();
  });

  it('explains the maximum page count', async () => {
    await renderAndOrder({ pageCount: 104 });
    expect(priceDetails()).toHaveTextContent('The price appears once the page count can be printed.');
    expect(screen.getByRole('alert')).toHaveTextContent(
      "You can't order yet. Books can have at most 100 pages. Remove 4 pages.",
    );
    expect(status()).toBeEmptyDOMElement();
  });

  it('handles a page count the price book rejects', async () => {
    await renderAndOrder({ pageCount: 21 });
    expect(screen.getByRole('alert')).toHaveTextContent(
      "You can't order yet. This book can't be printed yet: Page count must be even.",
    );
    expect(status()).toBeEmptyDOMElement();
  });

  it.each([20, 100])('lets a %s-page book be ordered', async (pageCount) => {
    await renderAndOrder({ pageCount });
    expect(orderButton()).not.toHaveAccessibleDescription();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(status()).toHaveTextContent(`Ready to order: ${pageCount} pages`);
  });
});

describe('OrderSummary ordering', () => {
  it('confirms a valid book without empty spreads', async () => {
    await renderAndOrder();
    expect(status()).toHaveTextContent(
      'Ready to order: 30 pages · 11x8.5 Landscape · Hardcover · $74.99',
    );
  });

  it('warns about empty spreads until the user acknowledges them', async () => {
    const { user } = await renderAndOrder({ emptySpreadCount: 2 });
    expect(screen.getByRole('alert')).toHaveTextContent('2 spreads have no photos');
    expect(status()).toBeEmptyDOMElement();

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(orderButton()).toHaveFocus();
    expect(status()).toBeEmptyDOMElement();

    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Order anyway' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(orderButton()).toHaveFocus();
    expect(status()).toHaveTextContent('Ready to order');
  });

  it('uses the singular for one empty spread', async () => {
    await renderAndOrder({ emptySpreadCount: 1 });
    expect(screen.getByRole('alert')).toHaveTextContent('1 spread has no photos');
  });

  it('clears the ready state when the book changes', async () => {
    const { rerender } = await renderAndOrder();
    expect(status()).toHaveTextContent('Ready to order');
    rerender(<OrderSummary {...book} pageCount={32} />);
    expect(status()).toBeEmptyDOMElement();
  });
});
