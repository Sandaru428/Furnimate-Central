import type { SVGProps } from 'react';
import { Briefcase } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center justify-center size-12 bg-primary/10 rounded-lg">
        <Briefcase className="size-6 text-primary" />
    </div>
  );
}
