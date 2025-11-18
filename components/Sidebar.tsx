"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface SopListItem {
  id: string;
  title: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const [sops, setSops] = useState<SopListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSops();
  }, [pathname]); // Refresh when route changes

  const fetchSops = async () => {
    try {
      const { data, error } = await supabase
        .from('sops')
        .select('id, title')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching SOPs:', error);
        return;
      }

      setSops(data || []);
    } catch (error) {
      console.error('Error fetching SOPs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-4">
        <Link href="/">
          <Button 
            variant="default" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            New SOP
          </Button>
        </Link>

        <div className="space-y-1">
          {isLoading ? (
            <div className="text-sm text-slate-400 p-2">Loading...</div>
          ) : sops.length === 0 ? (
            <div className="text-sm text-slate-400 p-2">No SOPs yet</div>
          ) : (
            sops.map((sop) => (
              <Link
                key={sop.id}
                href={`/sop/${sop.id}`}
                className="block px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              >
                {sop.title}
              </Link>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

