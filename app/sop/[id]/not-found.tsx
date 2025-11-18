import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-2xl font-bold">SOP Not Found</h2>
      <p className="text-muted-foreground">The SOP you're looking for doesn't exist.</p>
      <Link href="/">
        <Button>Create New SOP</Button>
      </Link>
    </div>
  );
}

