import { notFound } from 'next/navigation';
import { SopDisplay } from '@/components/SopDisplay';
import { supabase } from '@/lib/supabaseClient';
import { SopSchema } from '@/types/sop';

interface PageProps {
  params: {
    id: string;
  };
}

async function getSop(id: string): Promise<SopSchema | null> {
  try {
    const { data, error } = await supabase
      .from('sops')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching SOP:', error);
      return null;
    }

    return data as SopSchema;
  } catch (error) {
    console.error('Error fetching SOP:', error);
    return null;
  }
}

export default async function SopPage({ params }: PageProps) {
  const sopData = await getSop(params.id);

  if (!sopData) {
    notFound();
  }

  // Note: Video files are not stored, so videoFile is undefined
  // Users would need to re-upload videos to edit timestamps
  return (
    <div className="py-8 px-4">
      <SopDisplay data={sopData} videoFile={undefined} sopId={params.id} />
    </div>
  );
}

