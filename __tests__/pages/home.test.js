import { render, screen } from '@testing-library/react';
import Home from '../../app/page';

describe('Home Page', () => {
  it('renders the dashboard progress page content', () => {
    render(<Home />);

    expect(screen.getByText('進度追蹤儀表板')).toBeInTheDocument();
    expect(screen.getByLabelText('角色名稱')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '搜尋' })).toBeInTheDocument();
  });
});
