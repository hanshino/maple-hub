'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CharacterRedirect({ name }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/?name=${encodeURIComponent(name)}`);
  }, [name, router]);

  return null;
}
