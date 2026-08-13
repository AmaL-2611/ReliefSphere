import { FaSearch } from "react-icons/fa";
import "../../../styles/admin/common.css";
function SearchBar({ value, onChange }) {
  return (
    <div className="search-container">
      <FaSearch />

      <input placeholder="Search..." value={value} onChange={onChange} />
    </div>
  );
}

export default SearchBar;
