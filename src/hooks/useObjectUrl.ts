import { useEffect, useState } from 'react';

// Creates an object URL for a File, revoking the previous one whenever the
// file changes or the component unmounts. Calling URL.createObjectURL
// directly in render (the alternative) allocates a new, never-revoked blob
// URL on every single re-render.
export function useObjectUrl(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}
