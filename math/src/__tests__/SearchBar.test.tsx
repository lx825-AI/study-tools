import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SearchBar from '../components/SearchBar';

const baseSearch = {
  query: '',
  setQuery: vi.fn(),
  results: [],
  isSearching: false,
  sortBySection: true,
  toggleSort: vi.fn(),
  subjectFilter: '',
  setSubjectFilter: vi.fn(),
  levelFilter: '',
  setLevelFilter: vi.fn(),
};

describe('SearchBar', () => {
  it('渲染搜索输入框', () => {
    render(<SearchBar search={baseSearch} searchHistory={[]} />);
    expect(screen.getByPlaceholderText(/搜索公式/)).toBeDefined();
  });

  it('输入框中显示当前 query', () => {
    const search = { ...baseSearch, query: '极限' };
    render(<SearchBar search={search} searchHistory={[]} />);
    const input = screen.getByPlaceholderText(/搜索公式/) as HTMLInputElement;
    expect(input.value).toBe('极限');
  });

  it('输入时调用 setQuery', () => {
    const setQuery = vi.fn();
    const search = { ...baseSearch, setQuery };
    render(<SearchBar search={search} searchHistory={[]} />);
    fireEvent.change(screen.getByPlaceholderText(/搜索公式/), {
      target: { value: '极限' },
    });
    expect(setQuery).toHaveBeenCalledWith('极限');
  });

  it('有 combobox 角色', () => {
    render(<SearchBar search={baseSearch} searchHistory={[]} />);
    expect(screen.getByRole('combobox')).toBeDefined();
  });

  it('按 Escape 清空搜索', () => {
    const setQuery = vi.fn();
    const search = { ...baseSearch, query: '极限', setQuery };
    render(<SearchBar search={search} searchHistory={[]} />);
    fireEvent.keyDown(screen.getByPlaceholderText(/搜索公式/), { key: 'Escape' });
    expect(setQuery).toHaveBeenCalledWith('');
  });

  it('有搜索历史时 focus 输入框显示历史', () => {
    render(
      <SearchBar
        search={baseSearch}
        searchHistory={['极限', '导数']}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText(/搜索公式/));
    expect(screen.getByText('极限')).toBeDefined();
    expect(screen.getByText('导数')).toBeDefined();
  });

  it('点击历史项调用 setQuery', () => {
    const setQuery = vi.fn();
    const search = { ...baseSearch, setQuery };
    render(
      <SearchBar
        search={search}
        searchHistory={['极限']}
      />,
    );
    fireEvent.focus(screen.getByPlaceholderText(/搜索公式/));
    fireEvent.click(screen.getByText('极限'));
    expect(setQuery).toHaveBeenCalledWith('极限');
  });
});
