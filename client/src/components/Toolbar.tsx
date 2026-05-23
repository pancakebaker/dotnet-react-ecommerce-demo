import { Search } from 'lucide-react';

type ToolbarProps = {
  search: string;
  setSearch: (value: string) => void;
  onSearch: () => void;
};

export function Toolbar({ search, setSearch, onSearch }: ToolbarProps) {
  return (
    <div className="flex gap-2">
      <input
        className="focus-ring min-w-0 flex-1 rounded-md border border-line bg-white px-3 py-2"
        placeholder="Search"
        value={search}
        onChange={event => setSearch(event.target.value)}
      />
      <button
        type="button"
        className="focus-ring rounded-md border border-line bg-white p-2 hover:bg-field"
        onClick={onSearch}
        title="Search"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
}
