import { Search } from 'lucide-react';

type ToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  onSearch: () => void;
};

export function Toolbar({ search, setSearch, onSearch }: ToolbarProps) {
  return (
    <form className="flex gap-2" onSubmit={event => {
      event.preventDefault();
      onSearch();
    }}>
      <label className="min-w-0 flex-1">
        <span className="sr-only">Search records</span>
        <input
          className="focus-ring min-h-11 w-full rounded-md border border-line bg-white px-3 py-2"
          placeholder="Search"
          type="search"
          maxLength={100}
          autoComplete="off"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </label>
      <button
        type="submit"
        className="focus-ring grid h-11 w-11 flex-none place-items-center rounded-md border border-line bg-white hover:bg-field"
        aria-label="Search"
        title="Search"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}
