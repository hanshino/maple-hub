import { render, screen } from '@testing-library/react';
import Home from '../../app/page';

describe('Home Page', () => {
  it('renders the dashboard progress page content', () => {
    render(<Home />);

    // Check for the character search components that are actually rendered
    expect(screen.getByLabelText('角色名稱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('輸入角色名稱')).toBeInTheDocument();
  });
});
