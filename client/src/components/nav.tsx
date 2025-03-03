import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tv, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function Nav() {
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
  };

  return (
    <nav className="border-b px-2 py-2">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-2 items-center">
        <Link href="/">
          <a className="flex items-center gap-2 text-lg font-bold">
            <Tv className="h-5 w-5" /> 
            <span>RyuuStream</span>
          </a>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 w-full sm:max-w-md">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search anime..."
              className="w-full pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </form>
      </div>
    </nav>
  );
}