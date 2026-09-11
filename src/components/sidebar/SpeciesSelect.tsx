import { useEffect, useRef, useState } from "react";
import { searchSpecies } from "@/services/dataService";
import "./SpeciesSelect.css";

interface SpeciesSelectProps {
  value: string | "all";
  onChange: (species: string | "all") => void;
}

const DEBOUNCE_MS = 150;
const MAX_RESULTS = 200;

/**
 * A searchable species picker rather than a native <select>, since the
 * dataset has 10k+ species — rendering all of them as <option> elements
 * would be slow to mount and hard to search. Results are capped to
 * MAX_RESULTS and the query is debounced so filtering the full species
 * list doesn't run on every keystroke.
 */
export function SpeciesSelect({ value, onChange }: SpeciesSelectProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = open ? searchSpecies(debouncedQuery, MAX_RESULTS) : [];
  const totalMatches = open ? results.length : 0;

  return (
    <div className="gs-species-select" ref={containerRef}>
      <input
        type="text"
        className="gs-species-select__input"
        placeholder={value === "all" ? "Search species…" : value}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search species"
      />
      {value !== "all" && (
        <button
          type="button"
          className="gs-species-select__clear"
          onClick={() => {
            onChange("all");
            setQuery("");
          }}
          aria-label="Clear species filter"
        >
          ×
        </button>
      )}

      {open && (
        <div className="gs-species-select__dropdown" role="listbox">
          <button
            type="button"
            className={
              "gs-species-select__option" + (value === "all" ? " gs-species-select__option--active" : "")
            }
            onClick={() => {
              onChange("all");
              setQuery("");
              setOpen(false);
            }}
          >
            All species
          </button>
          {results.map((name) => (
            <button
              type="button"
              key={name}
              className={
                "gs-species-select__option" + (value === name ? " gs-species-select__option--active" : "")
              }
              onClick={() => {
                onChange(name);
                setQuery("");
                setOpen(false);
              }}
            >
              {name}
            </button>
          ))}
          {totalMatches === MAX_RESULTS && (
            <p className="gs-species-select__hint">Showing first {MAX_RESULTS} matches — refine your search</p>
          )}
          {totalMatches === 0 && <p className="gs-species-select__hint">No species match "{debouncedQuery}"</p>}
        </div>
      )}
    </div>
  );
}
