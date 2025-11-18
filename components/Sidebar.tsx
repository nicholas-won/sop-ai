"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SopListItem {
  id: string;
  title: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [sops, setSops] = useState<SopListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchSops = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sops')
        .select('id, title')
        .order('updated_at', { ascending: false }); // This puts the most recently edited items at the top

      if (error) {
        console.error('Error fetching SOPs:', error);
        return;
      }

      // Update local state with sorted list (most recently edited first)
      setSops(data || []);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();

    // Set up realtime subscription for UPDATE events
    const channel = supabase
      .channel('sops_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sops',
        },
        (payload) => {
          // Re-fetch SOPs when any SOP is updated to maintain sort order
          fetchSops();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [pathname, fetchSops]); // Refresh when route changes

  // Filter SOPs based on search query
  const filteredSops = sops.filter((sop) =>
    sop.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure?')) {
      return;
    }

    // Optimistic UI: Remove from local state immediately
    setSops((prev) => prev.filter((sop) => sop.id !== id));

    try {
      const { error } = await supabase
        .from('sops')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting SOP:', error);
        // Re-fetch on error to restore state
        fetchSops();
        alert('Failed to delete SOP. Please try again.');
        return;
      }

      // If user is currently on the deleted SOP page, redirect to home
      if (pathname === `/sop/${id}`) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error deleting SOP:', error);
      // Re-fetch on error to restore state
      fetchSops();
      alert('Failed to delete SOP. Please try again.');
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <Link href="/">
          <Button 
            variant="default" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            New SOP
          </Button>
        </Link>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search SOPs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 focus-visible:ring-slate-600"
          />
        </div>

        <div className="space-y-1">
          {isLoading ? (
            <div className="text-sm text-slate-400 p-2">Loading...</div>
          ) : filteredSops.length === 0 ? (
            <div className="text-sm text-slate-400 p-2">
              {searchQuery ? "No matching SOPs" : "No SOPs yet"}
            </div>
          ) : (
            filteredSops.map((sop) => (
              <Link
                key={sop.id}
                href={`/sop/${sop.id}`}
                className="group flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              >
                <span className="flex-1 truncate">{sop.title}</span>
                <button
                  onClick={(e) => handleDelete(sop.id, e)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-700"
                  aria-label="Delete SOP"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </button>
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

